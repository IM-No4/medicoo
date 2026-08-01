declare module 'react-native-razorpay' {
  export interface RazorpayCheckoutOptions {
    key: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    [key: string]: unknown;
  }

  export interface RazorpaySuccessResult {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResult {
    code: number;
    description: string;
    [key: string]: unknown;
  }

  const RazorpayCheckout: {
    open(options: RazorpayCheckoutOptions): Promise<RazorpaySuccessResult>;
  };

  export default RazorpayCheckout;
}
