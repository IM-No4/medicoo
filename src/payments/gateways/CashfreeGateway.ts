import { CFPaymentGatewayService } from 'react-native-cashfree-pg-sdk';
import {
  CFEnvironment,
  CFSession,
  CFUPI,
  CFUPIPayment,
  CFNB,
  CFNBPayment,
  Card,
  CFCardPayment,
  UPIMode,
} from 'cashfree-pg-api-contract';
import { fromCashfreeError } from '../errors';
import {
  AttemptFromServer,
  ClientConfig,
  GatewayResult,
  Method,
  MethodInput,
  PaymentError,
  PaymentGateway,
  UpiApp,
} from '../types';
import { findMatchingApp, withTimeout } from './shared';

// All Cashfree-specific code lives in this file (Cashfree's native Element
// SDK - no Cashfree checkout page ever opens). Wallets are not offered here:
// the SDK's wallet call is Cashfree's own prepaid-wallet product, not consumer
// wallets, so the backend never routes `wallet` to Cashfree.

export class CashfreeGateway implements PaymentGateway {
  name = 'cashfree' as const;

  async init(_config: ClientConfig): Promise<void> {
    // The SDK needs no global init - everything is carried by the per-attempt CFSession.
  }

  supports(method: Method): boolean {
    return method !== 'wallet';
  }

  async getUpiApps(): Promise<UpiApp[]> {
    try {
      // Android: JSON string of [{ appName, appPackage }]; iOS: same shape via an event.
      const result: unknown = await withTimeout(CFPaymentGatewayService.getInstalledUpiApps() as Promise<unknown>, 4000);
      const list: any[] = typeof result === 'string' ? JSON.parse(result) : Array.isArray(result) ? (result as any[]) : [];
      return list
        .map((a) => ({
          id: String(a.appPackage || a.appName || ''),
          name: String(a.appName || a.appPackage || ''),
          packageOrScheme: String(a.appPackage || ''),
        }))
        .filter((a) => a.packageOrScheme);
    } catch {
      return [];
    }
  }

  async pay(attempt: AttemptFromServer, input: MethodInput): Promise<GatewayResult> {
    if (!attempt.paymentSessionId) throw new PaymentError('GATEWAY_DOWN', 'Payment session missing');
    const session = new CFSession(
      attempt.paymentSessionId,
      attempt.gatewayOrderId,
      attempt.environment === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    );

    let payment;
    switch (input.method) {
      case 'upi_intent': {
        // Android appId = package name, iOS = URI scheme - whichever Cashfree itself lists.
        const installed = await this.getUpiApps();
        const app = findMatchingApp(installed, input.app);
        if (!app) throw new PaymentError('UNKNOWN', 'That UPI app is not available');
        payment = new CFUPIPayment(session, new CFUPI(UPIMode.INTENT, app.packageOrScheme));
        break;
      }
      case 'upi_collect':
        payment = new CFUPIPayment(session, new CFUPI(UPIMode.COLLECT, input.vpa.trim()));
        break;
      case 'card':
        payment = new CFCardPayment(
          session,
          new Card(input.number.replace(/\s+/g, ''), input.name.trim(), input.expiryMonth, input.expiryYear, input.cvv, false),
        );
        break;
      case 'netbanking':
        payment = new CFNBPayment(session, new CFNB(input.bank.cashfree));
        break;
      default:
        throw new PaymentError('UNKNOWN', 'Unsupported method');
    }

    // The SDK reports through one global callback - install it for this payment only.
    return new Promise<GatewayResult>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        try {
          CFPaymentGatewayService.removeCallback();
        } catch {
          // already removed
        }
        fn();
      };

      try {
        CFPaymentGatewayService.setCallback({
          // "Verify" means the flow ended - success OR pending. Whether money actually moved is decided by our backend.
          onVerify: () => finish(() => resolve({ confirmPayload: {} })),
          onError: (error: any) =>
            finish(() => {
              const mapped = fromCashfreeError(error);
              if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log('[payments] Cashfree error', mapped.code, mapped.detail);
              }
              reject(mapped);
            }),
        });
        CFPaymentGatewayService.makePayment(payment as any);
      } catch (error) {
        finish(() => reject(new PaymentError('GATEWAY_DOWN', 'Payment service unavailable')));
      }
    });
  }
}
