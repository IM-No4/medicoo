import Razorpay from 'react-native-customui';
import { fromRazorpayError } from '../errors';
import {
  AttemptFromServer,
  ClientConfig,
  GatewayResult,
  Method,
  MethodInput,
  PayerInfo,
  PaymentError,
  PaymentGateway,
  UpiApp,
} from '../types';
import { findMatchingApp, withTimeout } from './shared';

// All Razorpay-specific code lives in this file (Razorpay's Custom UI SDK -
// no Razorpay screen ever opens). Everything outside src/payments/gateways/
// sees only the PaymentGateway interface.

let initialisedKey: string | null = null;

export class RazorpayGateway implements PaymentGateway {
  name = 'razorpay' as const;

  async init(config: ClientConfig): Promise<void> {
    if (!config.razorpayKeyId) throw new PaymentError('GATEWAY_DOWN', 'Razorpay key missing');
    if (initialisedKey === config.razorpayKeyId) return;
    // initRazorpay's promise never settles (the SDK just sets internal state), so it is not awaited.
    Razorpay.initRazorpay(config.razorpayKeyId);
    initialisedKey = config.razorpayKeyId;
  }

  supports(_method: Method): boolean {
    return true; // UPI intent, cards, netbanking and wallets
  }

  async getUpiApps(): Promise<UpiApp[]> {
    try {
      // The SDK answers through an event; guard against it never firing (e.g. a device with no UPI apps).
      const result: any = await withTimeout(new Promise((resolve) => Razorpay.getAppsWhichSupportUPI(resolve as any)), 4000);
      const list: any[] = Array.isArray(result?.data) ? result.data : Array.isArray(result) ? result : [];
      return list
        .map((a) => {
          const pkg = String(a.packageName || a.package_name || a.appPackage || '');
          return {
            id: pkg || String(a.appName || ''),
            name: String(a.appName || a.app_name || pkg),
            icon: a.iconBase64 ? `data:image/png;base64,${a.iconBase64}` : a.appLogo || undefined,
            packageOrScheme: pkg,
          } as UpiApp;
        })
        .filter((a) => a.packageOrScheme);
    } catch {
      return [];
    }
  }

  async pay(attempt: AttemptFromServer, input: MethodInput, payer: PayerInfo): Promise<GatewayResult> {
    if (!attempt.keyId) throw new PaymentError('GATEWAY_DOWN', 'Razorpay key missing');
    await this.init({ razorpayKeyId: attempt.keyId } as ClientConfig);

    const base = {
      key_id: attempt.keyId,
      amount: String(attempt.amountPaise),
      currency: 'INR',
      order_id: attempt.gatewayOrderId, // mandatory - a payment without an order is auto-refunded
      email: payer.email,
      contact: payer.contact,
    };

    let options: Record<string, unknown>;
    switch (input.method) {
      case 'upi_intent': {
        // upi_app_package_name must be EXACTLY a value from Razorpay's own installed-apps list.
        const installed = await this.getUpiApps();
        const app = findMatchingApp(installed, input.app);
        if (!app) throw new PaymentError('UNKNOWN', 'That UPI app is not available');
        options = { ...base, method: 'upi', upi_app_package_name: app.packageOrScheme, '_[flow]': 'intent' };
        break;
      }
      case 'upi_collect':
        // A UPI ID (VPA) - the customer approves the request inside their own UPI app.
        options = { ...base, method: 'upi', vpa: input.vpa.trim() };
        break;
      case 'card':
        options = {
          ...base,
          method: 'card',
          card: {
            number: input.number.replace(/\s+/g, ''),
            name: input.name.trim(),
            expiry_month: input.expiryMonth,
            expiry_year: input.expiryYear,
            cvv: input.cvv,
          },
        };
        break;
      case 'netbanking':
        options = { ...base, method: 'netbanking', bank: input.bank.razorpay };
        break;
      case 'wallet':
        options = { ...base, method: 'wallet', wallet: input.wallet.razorpay };
        break;
      default:
        throw new PaymentError('UNKNOWN', 'Unsupported method');
    }

    try {
      const result = await Razorpay.open(options as any);
      // The backend verifies this signature against ITS stored order id - what is sent here is not trusted.
      return {
        confirmPayload: {
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_order_id: result.razorpay_order_id,
          razorpay_signature: result.razorpay_signature,
        },
      };
    } catch (error) {
      const mapped = fromRazorpayError(error);
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[payments] Razorpay error', mapped.code, mapped.detail);
      }
      throw mapped;
    }
  }
}
