import { apiClient } from './client';

// Medicine checkout only (see backend/services/cashfreeService.js's own
// comment) - Razorpay (payment.api.ts) is untouched and still powers every
// other payment flow in the app.

export interface CashfreeOrderResult {
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  orderStatus: string;
  mode: 'sandbox' | 'production';
}

export const createCashfreeOrder = async (amount: number): Promise<CashfreeOrderResult> => {
  const res = await apiClient.post('/api/payments/cashfree/create-order', { amount });
  return res.data.data;
};

export interface UpiCollectResult {
  cfPaymentId: string;
  action: string;
}

// Sends a payment request straight to the given UPI ID's app - no Cashfree
// UI ever appears, the customer approves entirely within their own UPI app.
export const payUpiCollect = async (paymentSessionId: string, upiId: string): Promise<UpiCollectResult> => {
  const res = await apiClient.post('/api/payments/cashfree/pay-upi-collect', { paymentSessionId, upiId });
  return res.data.data;
};

export interface UpiIntentResult {
  cfPaymentId: string;
  url: string | null;
}

// Returns a Cashfree-hosted gateway URL (not a raw upi:// deep link) that
// resolves to an installed UPI app picker - has to be opened in a WebView.
export const payUpiIntent = async (paymentSessionId: string): Promise<UpiIntentResult> => {
  const res = await apiClient.post('/api/payments/cashfree/pay-upi-intent', { paymentSessionId });
  return res.data.data;
};

export interface CashfreeOrderStatus {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'NOT_ATTEMPTED' | 'USER_DROPPED' | 'VOID' | 'CANCELLED';
  cfPaymentId: string | null;
}

export const getCashfreeOrderStatus = async (orderId: string): Promise<CashfreeOrderStatus> => {
  const res = await apiClient.get(`/api/payments/cashfree/order-status/${orderId}`);
  return res.data.data;
};
