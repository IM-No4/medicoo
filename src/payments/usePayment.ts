import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { getProfileDetails } from '../services/api/user.api';
import {
  abandonAttempt,
  confirmAttempt,
  createAttempt,
  CreateAttemptResult,
  getAttemptStatus,
  getPaymentOrderState,
} from './api';
import { messageFor } from './errors';
import { getGateway } from './gateways/registry';
import { usePaymentConfig } from './usePaymentConfig';
import { clearPending, loadPending, savePending, saveLastMethod, LastMethod } from './pendingStore';
import {
  AttemptFromServer,
  AttemptStatusView,
  GatewayName,
  MethodInput,
  PayerInfo,
  PaymentError,
  PaymentErrorCode,
} from './types';

// The one payment flow, shared by every checkout and both gateways:
//   idle -> creating_attempt -> awaiting_user -> verifying -> success | failed | pending
// Gateway specifics never appear here - only the PaymentGateway interface.

export type Phase = 'idle' | 'creating_attempt' | 'awaiting_user' | 'verifying' | 'success' | 'failed' | 'pending';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;
// One silent switch to the other gateway - there are only two.
const MAX_SILENT_SWITCHES = 1;

const ALL_GATEWAYS: GatewayName[] = ['razorpay', 'cashfree'];

/** The labelled choice remembered for the cart ("Pay using PhonePe"). Never holds card details. */
export const choiceFor = (input: MethodInput): LastMethod => {
  switch (input.method) {
    case 'upi_intent':
      return { method: 'upi_intent', refId: input.app.id, label: input.app.name, sub: 'UPI' };
    case 'upi_collect':
      return { method: 'upi_collect', refId: input.vpa, label: input.vpa, sub: 'UPI ID' };
    case 'netbanking':
      return { method: 'netbanking', refId: input.bank.id, label: input.bank.name, sub: 'Netbanking' };
    case 'wallet':
      return { method: 'wallet', refId: input.wallet.id, label: input.wallet.name, sub: 'Wallet' };
    default:
      return { method: 'card', label: 'Credit / Debit card', sub: 'Card' };
  }
};

const isGatewaySide = (code: PaymentErrorCode) => code === 'GATEWAY_DOWN' || code === 'NETWORK';

const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

let cachedEmail: string | null = null;
const loadEmail = async (): Promise<string> => {
  if (cachedEmail) return cachedEmail;
  try {
    const profile = await getProfileDetails();
    if (profile?.email) cachedEmail = String(profile.email);
  } catch {
    // fall through to the placeholder
  }
  return cachedEmail || 'customer@medicoo.app';
};

/** Why a payment could not go ahead - rendered calmly on the progress screen. */
export type IssueKind = 'payment' | 'network' | 'order' | 'stock' | 'store' | 'address' | 'prescription' | 'maintenance';

export interface PaymentIssue {
  code: PaymentErrorCode | string;
  kind: IssueKind;
  title: string;
  message: string;
  /** Trying the same thing again can help (a declined payment, a dropped connection). */
  retryable: boolean;
}

const TITLES: Record<IssueKind, string> = {
  payment: "Payment didn't go through",
  network: 'Connection problem',
  order: "We couldn't start your payment",
  stock: 'Some items are unavailable',
  store: 'This store is unavailable',
  address: 'Delivery address needed',
  prescription: 'Prescription needed',
  maintenance: 'Temporarily unavailable',
};

const issueFor = (code: PaymentErrorCode | string | null | undefined, opts: { kind?: IssueKind; message?: string; retryable?: boolean } = {}): PaymentIssue => {
  const kind: IssueKind = opts.kind || (code === 'NETWORK' || code === 'GATEWAY_DOWN' ? 'network' : 'payment');
  return {
    code: code || 'UNKNOWN',
    kind,
    title: TITLES[kind],
    message: opts.message || messageFor(code),
    retryable: opts.retryable ?? (kind === 'payment' || kind === 'network'),
    ...(code === 'USER_CANCELLED' ? { title: 'Payment cancelled' } : {}),
  };
};

/** Errors thrown by an order creator may carry a `kind`; anything else is judged by whether we reached the server. */
const issueFromError = (e: any): PaymentIssue => {
  const message = e?.response?.data?.message;
  if (e?.response?.data?.code === 'PRICE_CHANGED') return issueFor('UNKNOWN', { kind: 'order', message: message || 'The price of your order has changed. Please review your cart.', retryable: false });
  if (e?.kind) return issueFor('UNKNOWN', { kind: e.kind, message: message || e.message, retryable: e.kind === 'network' });
  if (!e?.response) return issueFor('NETWORK');
  return issueFor('UNKNOWN', { kind: 'payment', message: message || undefined, retryable: true });
};

export interface UsePaymentOptions {
  /** Where to remember an in-flight payment so a killed app can resume it, e.g. `appointment:REQ123`. */
  contextKey: string;
  /** Creates (or reuses) the payable order on the server. Called once per payment session.
   *  Call `report(i)` as each of `steps` completes so the progress screen can tick them off. */
  createOrder: (report: (completedSteps: number) => void) => Promise<{ orderId: string } | { free: true }>;
  /** Labels for the checks done before the payment starts, e.g. ['Checking the store and stock', ...]. */
  steps?: string[];
  /** Payment confirmed and the business action completed on the server. */
  onSuccess: (view: AttemptStatusView) => void;
  /** The payable order turned out to need no payment (free consultation). */
  onFree?: () => void;
}

export type PaymentError_ = PaymentIssue;

const DEFAULT_STEPS = ['Preparing your order', 'Securing your payment'];

export function usePayment({ contextKey, createOrder, onSuccess, onFree, steps = DEFAULT_STEPS }: UsePaymentOptions) {
  const mobile = useSelector((state: RootState) => state.auth.mobile);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<PaymentError_ | null>(null);
  const [view, setView] = useState<AttemptStatusView | null>(null);
  const { config, configError, reloadConfig, upiApps, appsLoaded, lastMethod } = usePaymentConfig();
  // How many of `steps` are done (the last one, 'Securing your payment', is the attempt itself).
  const [completedSteps, setCompletedSteps] = useState(0);
  const lastInput = useRef<MethodInput | null>(null);

  const mounted = useRef(true);
  const busy = useRef(false);
  const orderIdRef = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollToken = useRef(0);
  const successRef = useRef(onSuccess);
  successRef.current = onSuccess;
  const createOrderRef = useRef(createOrder);
  createOrderRef.current = createOrder;
  const phaseRef = useRef<Phase>('idle');

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    if (mounted.current) setPhase(next);
  }, []);

  const stopPolling = useCallback(() => {
    pollToken.current += 1;
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // ---- settle / poll --------------------------------------------------------------
  const fail = useCallback(
    async (code: PaymentErrorCode | string | null | undefined, issue?: PaymentIssue) => {
      stopPolling();
      await clearPending(contextKey);
      if (!mounted.current) return;
      setError(issue || issueFor(code));
      go('failed');
    },
    [contextKey, go, stopPolling],
  );

  const settle = useCallback(
    async (v: AttemptStatusView): Promise<boolean> => {
      if (!mounted.current) return true;
      setView(v);
      if (v.state === 'success') {
        stopPolling();
        await clearPending(contextKey);
        go('success');
        successRef.current(v);
        return true;
      }
      if (v.state === 'failed') {
        await fail(v.errorCode);
        return true;
      }
      go('verifying');
      return false;
    },
    [contextKey, fail, go, stopPolling],
  );

  const poll = useCallback(
    (attemptId: string) => {
      stopPolling();
      const token = pollToken.current;
      const startedAt = Date.now();

      const tick = async () => {
        if (token !== pollToken.current || !mounted.current) return;
        try {
          const v = await getAttemptStatus(attemptId);
          if (token !== pollToken.current) return;
          if (await settle(v)) return;
        } catch {
          // offline / transient - keep trying until the timeout
        }
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          // Not settled yet. The webhook / reconciliation job will settle it and notify the customer.
          go('pending');
          return;
        }
        pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
      };
      tick();
    },
    [go, settle, stopPolling],
  );

  // Coming back from a UPI app / bank page / the home screen: check right away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const p = phaseRef.current;
      if ((p === 'verifying' || p === 'awaiting_user' || p === 'pending') && view?.attemptId) {
        go('verifying');
        poll(view.attemptId);
      }
    });
    return () => sub.remove();
  }, [go, poll, view?.attemptId]);

  // ---- the attempt ----------------------------------------------------------------
  const runAttempt = useCallback(
    async (input: MethodInput, exclude: GatewayName[], switches = 0): Promise<void> => {
      const orderId = orderIdRef.current as string;
      let created: CreateAttemptResult;
      try {
        created = await createAttempt({ orderId, method: input.method, idempotencyKey: newKey(), excludeGateways: exclude });
      } catch (e: any) {
        const body = e?.response?.data;
        if (body?.code === 'ATTEMPT_PENDING' && body.attempt) {
          // An earlier attempt may still succeed - never start another; wait for it.
          await savePending(contextKey, { orderId, attemptId: body.attempt.attemptId, startedAt: Date.now() });
          go('verifying');
          poll(body.attempt.attemptId);
          return;
        }
        const offline = !e?.response;
        await fail(
          offline ? 'NETWORK' : body?.code === 'GATEWAY_DOWN' ? 'GATEWAY_DOWN' : 'UNKNOWN',
          issueFor(offline ? 'NETWORK' : body?.code || 'UNKNOWN', {
            kind: offline || body?.code === 'GATEWAY_DOWN' ? 'network' : 'payment',
            message: !offline && body?.message ? body.message : undefined,
            retryable: true,
          }),
        );
        return;
      }

      if (created.alreadyPaid) {
        const v = await getPaymentOrderState(orderId).catch(() => null);
        if (v?.attemptId) {
          go('verifying');
          poll(v.attemptId);
        } else {
          await fail('UNKNOWN');
        }
        return;
      }

      const attempt: AttemptFromServer = created.attempt;
      setCompletedSteps(steps.length);
      await savePending(contextKey, { orderId, attemptId: attempt.attemptId, startedAt: Date.now() });

      const gateway = getGateway(attempt.gateway);
      const payer: PayerInfo = { email: await loadEmail(), contact: attempt.payerContact || String(mobile || '').replace(/\D/g, '').slice(-10) || '9999999999' };

      go('awaiting_user');
      try {
        if (config) await gateway.init(config);
        const result = await gateway.pay(attempt, input, payer);

        go('verifying');
        setView({ attemptId: attempt.attemptId } as AttemptStatusView);
        try {
          const v = await confirmAttempt(attempt.attemptId, result.confirmPayload);
          if (await settle(v)) return;
        } catch {
          // The SDK said it went through but our confirm call failed (offline?) - the payment may well have
          // succeeded. Never show "failed"; poll until the server can tell us.
        }
        poll(attempt.attemptId);
      } catch (e: any) {
        const err = e instanceof PaymentError ? e : new PaymentError('UNKNOWN', e?.message);
        // Ask the server what really happened before believing the SDK - the customer may have paid anyway.
        let v: AttemptStatusView | null = null;
        try {
          v = await abandonAttempt(attempt.attemptId, err.code, err.detail);
        } catch {
          v = null;
        }
        if (v && (v.state === 'success' || v.state === 'verifying' || v.state === 'pending')) {
          setView(v);
          go('verifying');
          poll(attempt.attemptId);
          return;
        }
        if (!v) {
          // Could not reach our server to find out - treat as in flight, not failed.
          setView({ attemptId: attempt.attemptId } as AttemptStatusView);
          go('verifying');
          poll(attempt.attemptId);
          return;
        }
        // Definitely nothing charged. A gateway-side fault switches gateways silently; a user-side one never does.
        if ((isGatewaySide(err.code) || err.code === 'UNKNOWN') && switches < MAX_SILENT_SWITCHES && ALL_GATEWAYS.some((g) => g !== attempt.gateway && !exclude.includes(g))) {
          await runAttempt(input, [...exclude, attempt.gateway], switches + 1);
          return;
        }
        await fail(err.code);
      }
    },
    [config, contextKey, fail, go, mobile, poll, settle],
  );

  const start = useCallback(
    async (input: MethodInput) => {
      if (busy.current) return; // double-tap guard (the server also enforces idempotency)
      busy.current = true;
      setError(null);
      setCompletedSteps(0);
      // Card details are never kept for a retry - "Try again" for a card returns to the form instead.
      lastInput.current = input.method === 'card' ? null : input;
      try {
        go('creating_attempt');
        if (!orderIdRef.current) {
          let order: { orderId: string } | { free: true };
          try {
            order = await createOrderRef.current((n) => mounted.current && setCompletedSteps(n));
          } catch (e: any) {
            if (mounted.current) {
              setError(issueFromError(e));
              go('failed');
            }
            return;
          }
          if ('free' in order) {
            go('success');
            onFree?.();
            return;
          }
          orderIdRef.current = order.orderId;
        }
        setCompletedSteps(Math.max(0, steps.length - 1));
        saveLastMethod(choiceFor(input));
        // An app only one SDK knows can only be paid through that gateway.
        const exclude = input.method === 'upi_intent' && input.app.gateways?.length ? ALL_GATEWAYS.filter((g) => !input.app.gateways!.includes(g)) : [];
        await runAttempt(input, exclude);
      } finally {
        busy.current = false;
      }
    },
    [go, onFree, runAttempt, steps.length],
  );

  /** A fresh payable order next time (e.g. the cart changed after a failed payment). */
  const resetOrder = useCallback(() => {
    orderIdRef.current = null;
  }, []);

  /** After an app kill / reopen: pick the in-flight payment back up. */
  const resume = useCallback(async () => {
    const pending = await loadPending(contextKey);
    if (!pending) return false;
    orderIdRef.current = pending.orderId;
    try {
      const v = await getPaymentOrderState(pending.orderId);
      if (v.state === 'success' && v.attemptId) {
        await settle(v as AttemptStatusView);
        return true;
      }
      if (v.state === 'verifying' || v.state === 'pending') {
        go('verifying');
        setView({ attemptId: pending.attemptId } as AttemptStatusView);
        poll(pending.attemptId);
        return true;
      }
      await clearPending(contextKey);
    } catch {
      // offline - leave the pending marker; the next open retries
    }
    return false;
  }, [contextKey, go, poll, settle]);

  const dismissError = useCallback(() => setError(null), []);

  /** Show a problem found before any payment started (e.g. no delivery address) on the progress screen. */
  const showIssue = useCallback(
    (e: any) => {
      setError(issueFromError(e));
      go('failed');
    },
    [go],
  );

  /** From the failure screen: back to choosing a method. */
  const backToOptions = useCallback(() => {
    stopPolling();
    setError(null);
    go('idle');
  }, [go, stopPolling]);

  /** From the failure screen: the same payment again (not offered for cards - their details are not kept). */
  const retry = useCallback(() => {
    const input = lastInput.current;
    if (!input) {
      backToOptions();
      return;
    }
    start(input);
  }, [backToOptions, start]);

  return {
    phase,
    error,
    view,
    config,
    configError,
    reloadConfig,
    upiApps,
    appsLoaded,
    lastMethod,
    start,
    resume,
    resetOrder,
    dismissError,
    backToOptions,
    retry,
    showIssue,
    steps,
    completedSteps,
    isBusy: phase !== 'idle' && phase !== 'failed',
  };
}

export type PaymentController = ReturnType<typeof usePayment>;
