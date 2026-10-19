import { apiClient } from '../services/api/client';
import type { AttemptFromServer, AttemptStatusView, ClientConfig, GatewayName, Method, PaymentErrorCode, PaymentState } from './types';

// Calls to our backend's payment API. The app never says which gateway to use -
// the backend routes and tells us what the SDK needs.

export type PaymentPurpose = 'medicine' | 'appointment';

export const getPaymentConfig = async (): Promise<ClientConfig> => {
  const res = await apiClient.get('/api/payments/config');
  return res.data.data;
};

export interface CreatedOrder {
  orderId: string;
  amountPaise: number;
}

export const createPaymentOrder = async (params: {
  purpose: PaymentPurpose;
  referenceId?: string;
  payload?: Record<string, unknown>;
}): Promise<CreatedOrder | { free: true }> => {
  const res = await apiClient.post('/api/payments/orders', params);
  return res.data.data;
};

export type CreateAttemptResult =
  | { alreadyPaid: true; order: { orderId: string; state: string }; attempt?: AttemptFromServer }
  | { alreadyPaid?: false; attempt: AttemptFromServer };

export const createAttempt = async (params: {
  orderId: string;
  method: Method;
  idempotencyKey: string;
  excludeGateways?: GatewayName[];
}): Promise<CreateAttemptResult> => {
  const res = await apiClient.post('/api/payments/attempts', params);
  return res.data.data;
};

export const confirmAttempt = async (attemptId: string, payload: Record<string, unknown>): Promise<AttemptStatusView> => {
  const res = await apiClient.post(`/api/payments/attempts/${attemptId}/confirm`, payload);
  return res.data.data;
};

export const getAttemptStatus = async (attemptId: string): Promise<AttemptStatusView> => {
  const res = await apiClient.get(`/api/payments/attempts/${attemptId}/status`);
  return res.data.data;
};

export const abandonAttempt = async (attemptId: string, errorCode: PaymentErrorCode, detail?: string): Promise<AttemptStatusView> => {
  const res = await apiClient.post(`/api/payments/attempts/${attemptId}/abandon`, { errorCode, detail });
  return res.data.data;
};

export interface OrderStateView extends Partial<AttemptStatusView> {
  orderId: string;
  state: PaymentState;
  amountPaise: number;
  purpose?: PaymentPurpose;
}

export const getPaymentOrderState = async (orderId: string): Promise<OrderStateView> => {
  const res = await apiClient.get(`/api/payments/orders/${orderId}`);
  return res.data.data;
};
