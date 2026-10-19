import { PaymentError, PaymentErrorCode } from './types';

// Maps whatever an SDK or our own API throws onto our error vocabulary.
//
// Rule of thumb: only claim a BANK decline when the bank/customer side clearly
// said so. A payment that fails instantly before anything reached the gateway
// is an integration/availability problem, not the customer's bank - calling it
// "declined" sends people to fix something that is not wrong.

const text = (...parts: unknown[]) =>
  parts
    .filter((p) => p !== undefined && p !== null)
    .map(String)
    .join(' ')
    .toLowerCase();

const DECLINE = /declin|insufficient|incorrect|invalid.*(pin|otp|vpa)|wrong (pin|otp)|cvv|card.*(expired|blocked)|limit (exceed|reached)|not (permitted|allowed)|do not honou?r/;

/** A short, safe-to-store description of an SDK error: codes and reasons only, no payment data. */
const detailOf = (parts: Record<string, unknown>): string =>
  JSON.stringify(parts, (_k, v) => (typeof v === 'string' ? v.replace(/\d{9,}/g, '[redacted]').slice(0, 160) : v)).slice(0, 400);

export const fromRazorpayError = (error: any): PaymentError => {
  const raw = typeof error?.description === 'string' ? error.description : '';
  let nested: any = null;
  try {
    nested = JSON.parse(raw)?.error || null;
  } catch {
    nested = null;
  }
  const detail = detailOf({
    sdkCode: error?.code,
    code: nested?.code,
    reason: nested?.reason,
    source: nested?.source,
    step: nested?.step,
    description: nested?.description || (nested ? undefined : raw),
  });
  const t = text(error?.code, nested?.code, nested?.reason, nested?.description, nested?.source, nested ? '' : raw, error?.message);
  const make = (code: PaymentErrorCode, message: string) => Object.assign(new PaymentError(code, message), { detail });

  // Razorpay RN codes: 0 NETWORK_ERROR, 1 INVALID_OPTIONS, 2 PAYMENT_CANCELLED, 3 TLS_ERROR
  if (Number(error?.code) === 2 || /cancel|dismiss|payment_cancelled/.test(t)) return make('USER_CANCELLED', 'Payment cancelled');
  if (Number(error?.code) === 0 || /network|connect|internet/.test(t)) return make('NETWORK', 'Network problem');
  if (Number(error?.code) === 3 || /tls|ssl|timeout|server_error|internal/.test(t)) return make('GATEWAY_DOWN', 'Payment service unavailable');
  // Our request was refused before a payment existed (bad option, feature not enabled, ...): not the customer's fault.
  if (Number(error?.code) === 1 || /input_validation|invalid_options|not (enabled|activated|supported)|bad_request/.test(t) && nested?.source !== 'customer' && nested?.source !== 'bank') {
    return make('GATEWAY_DOWN', 'Payment service unavailable');
  }
  if (nested?.source === 'bank' || DECLINE.test(t)) return make('BANK_DECLINED', 'Payment declined');
  return make('UNKNOWN', 'Payment could not be completed');
};

export const fromCashfreeError = (error: any): PaymentError => {
  const code = typeof error?.getCode === 'function' ? error.getCode() : error?.code;
  const type = typeof error?.getType === 'function' ? error.getType() : error?.type;
  const message = typeof error?.getMessage === 'function' ? error.getMessage() : error?.message;
  const detail = detailOf({ code, type, message });
  const t = text(code, type, message);
  const make = (c: PaymentErrorCode, m: string) => Object.assign(new PaymentError(c, m), { detail });

  if (/cancel|drop|dismiss|back_?pressed|user/.test(t)) return make('USER_CANCELLED', 'Payment cancelled');
  if (/network|connect|internet|offline/.test(t)) return make('NETWORK', 'Network problem');
  if (/timeout|server|gateway|unavailable|internal|5\d\d|sdk|init|session|invalid_request|not.*(enabled|activated)/.test(t)) return make('GATEWAY_DOWN', 'Payment service unavailable');
  if (DECLINE.test(t)) return make('BANK_DECLINED', 'Payment declined');
  return make('UNKNOWN', 'Payment could not be completed');
};

/** What to tell the customer for each code. Never names a gateway. */
export const messageFor = (code: PaymentErrorCode | string | null | undefined): string => {
  switch (code) {
    case 'USER_CANCELLED':
      return 'Payment cancelled. You have not been charged.';
    case 'BANK_DECLINED':
      return 'Your bank declined the payment. Try again or choose another method.';
    case 'GATEWAY_DOWN':
    case 'NETWORK':
      return 'We could not reach the payment service. Please check your connection and try again.';
    case 'EXPIRED':
      return 'This payment session expired. Please try again.';
    case 'AMOUNT_MISMATCH':
      return 'The amount did not match, so the payment was refunded. Please try again.';
    default:
      return "We couldn't complete the payment, and you have not been charged. Please try again or choose another method.";
  }
};
