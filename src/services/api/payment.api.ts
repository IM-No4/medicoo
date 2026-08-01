import { apiClient } from './client';

export interface RazorpayOrderResult {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
}

export const createRazorpayOrder = async (amount: number): Promise<RazorpayOrderResult> => {
  const res = await apiClient.post('/api/payments/razorpay/create-order', { amount });
  return res.data.data;
};
