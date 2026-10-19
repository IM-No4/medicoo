// Gateway-agnostic payment types. Nothing outside src/payments/gateways/ may
// import a payment SDK - everything else speaks only these.

export type Method = 'upi_intent' | 'upi_collect' | 'card' | 'netbanking' | 'wallet';
export type GatewayName = 'razorpay' | 'cashfree';

// Our own error vocabulary (mirrors the backend's). Every SDK error, whatever
// the gateway calls it, is mapped to one of these.
export type PaymentErrorCode = 'USER_CANCELLED' | 'BANK_DECLINED' | 'GATEWAY_DOWN' | 'NETWORK' | 'UNKNOWN';

export class PaymentError extends Error {
  code: PaymentErrorCode;
  /** What the SDK actually said (codes/reasons only, no payment data) - sent to our server for diagnosis. */
  detail?: string;
  constructor(code: PaymentErrorCode, message?: string) {
    super(message || code);
    this.name = 'PaymentError';
    this.code = code;
  }
}

/** A UPI app installed on the phone, normalized across both SDKs. */
export interface UpiApp {
  id: string;
  name: string;
  icon?: string; // base64 or url when the SDK provides one
  /** Android package name / iOS URI scheme. */
  packageOrScheme: string;
  /** Which payment gateways' SDKs can pay through this app (it may be known to only one of them). */
  gateways?: GatewayName[];
}

export interface Bank {
  id: string;
  name: string;
  razorpay: string;
  cashfree: string;
}

export interface Wallet {
  id: string;
  name: string;
  razorpay: string;
}

export interface MethodAvailability {
  enabled: boolean;
  primary: GatewayName | null;
}

/** What the backend tells the app at checkout start. */
export interface ClientConfig {
  methods: Record<Method, MethodAvailability>;
  razorpayKeyId: string | null;
  cashfreeEnvironment: 'SANDBOX' | 'PRODUCTION';
}

/** An attempt as created by the backend - the gateway-specific bits the SDK needs. */
export interface AttemptFromServer {
  attemptId: string;
  orderId: string;
  gateway: GatewayName;
  method: Method;
  gatewayOrderId: string;
  amountPaise: number;
  keyId?: string; // Razorpay
  paymentSessionId?: string; // Cashfree
  environment?: 'SANDBOX' | 'PRODUCTION'; // Cashfree
  payerContact?: string; // 10-digit phone from the customer's profile
}

export type MethodInput =
  | { method: 'upi_intent'; app: UpiApp }
  | { method: 'upi_collect'; vpa: string }
  | { method: 'card'; number: string; name: string; expiryMonth: string; expiryYear: string; cvv: string }
  | { method: 'netbanking'; bank: Bank }
  | { method: 'wallet'; wallet: Wallet };

/** Who is paying - needed by Razorpay's options. */
export interface PayerInfo {
  email: string;
  contact: string;
}

/** Normalized result of a gateway SDK call. `confirmPayload` goes to the backend's /confirm. */
export interface GatewayResult {
  confirmPayload: Record<string, unknown>;
}

export interface PaymentGateway {
  name: GatewayName;
  init(config: ClientConfig): Promise<void>;
  getUpiApps(): Promise<UpiApp[]>;
  supports(method: Method): boolean;
  pay(attempt: AttemptFromServer, input: MethodInput, payer: PayerInfo): Promise<GatewayResult>;
}

/** Final answer the backend gives about an attempt. */
export type PaymentState = 'success' | 'verifying' | 'pending' | 'failed';

export interface AttemptStatusView {
  attemptId: string;
  orderId: string;
  state: PaymentState;
  attemptStatus: string;
  orderStatus: string;
  errorCode: PaymentErrorCode | 'EXPIRED' | 'AMOUNT_MISMATCH' | null;
  fulfillment: { status?: string; result?: { orderId?: string; orderNumber?: string; requestId?: string } | null };
  refunded: boolean;
}
