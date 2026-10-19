// react-native-customui ships plain JS without types (Razorpay's Custom UI SDK).
// Declared here from its Razorpay.js / README so the gateway adapter is typed.
declare module 'react-native-customui' {
  export interface RazorpayUpiApp {
    package_name?: string;
    app_name?: string;
    app_icon?: string;
    [key: string]: unknown;
  }

  export interface RazorpayOpenOptions {
    key_id: string;
    amount: string | number; // paise
    currency: string;
    order_id: string; // mandatory - a payment without an order is auto-refunded
    email: string;
    contact: string;
    method: 'upi' | 'card' | 'netbanking' | 'wallet';
    description?: string;
    [key: string]: unknown;
  }

  export interface RazorpaySuccess {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    [key: string]: unknown;
  }

  export interface RazorpayError {
    code?: number | string;
    description?: string;
    [key: string]: unknown;
  }

  export default class Razorpay {
    static initRazorpay(keyId: string): void;
    static open(options: RazorpayOpenOptions): Promise<RazorpaySuccess>;
    static getAppsWhichSupportUPI(callback?: (apps: RazorpayUpiApp[]) => void): Promise<RazorpayUpiApp[]>;
    static getCardsNetwork(cardNumber: string): Promise<string>;
    static isValidCardNumber(cardNumber: string): Promise<boolean>;
    static getCardNetworkLength(network: string): Promise<number>;
  }
}
