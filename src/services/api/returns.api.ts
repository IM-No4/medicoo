import { apiClient } from './client';

export interface ReturnPolicy {
  version: string;
  returnWindowHours: number;
  coldChainWindowHours: number;
  responseHours: number;
  minPhotos: number;
  maxPhotos: number;
  rules: string[];
  reasons: { code: string; label: string }[];
  conditions: { code: 'sealed' | 'opened' | 'used'; label: string }[];
  grievanceTeam: { ivrNumber: string; availability: string; acknowledgeWithinHours: number; resolveWithinDays: number; officer: { name?: string; designation?: string } | null } | null;
}

export interface ItemState {
  itemIndex: number;
  name: string;
  quantity: number;
  remaining: number;
  returnClass: 'standard' | 'cold_chain' | 'non_returnable';
  claimable: boolean;
  claimableUntil: string | null;
  batchNum?: string;
  expiry?: string;
}

export interface ClaimItem {
  itemIndex: number;
  name: string;
  quantity: number;
  reason: string;
  condition: string;
  outcome: 'pending' | 'approved' | 'rejected';
  message: string | null;
  refundAmount: number;
}

export interface ReturnClaim {
  requestNumber: string;
  orderNumber: string;
  status: 'rejected' | 'under_review' | 'approved' | 'refunded' | 'refund_failed' | 'closed';
  createdOn: string;
  respondBy?: string;
  decision: { code: string; message: string; at: string } | null;
  items: ClaimItem[];
  refund: { amount: number; refundedAt?: string; feesIncluded?: boolean } | null;
  timeline: { at: string; event: string; message?: string }[];
}

export interface Eligibility {
  delivered: boolean;
  items: ItemState[];
  policy: ReturnPolicy;
  requests: ReturnClaim[];
}

export const getEligibility = async (orderId: string): Promise<Eligibility> => {
  const res = await apiClient.get(`/api/orders/${orderId}/returns/eligibility`);
  return res.data;
};

export const getReturnPolicy = async (): Promise<ReturnPolicy> => {
  const res = await apiClient.get('/api/orders/returns/policy');
  return res.data.policy;
};

/** Uploads one photo for a claim and returns its id. Photos are kept apart from the customer's own documents. */
export const uploadReturnPhoto = async (orderId: string, uri: string): Promise<string> => {
  const form = new FormData();
  const name = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(name);
  form.append('orderId', orderId);
  form.append('photo', { uri, name, type: match ? `image/${match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase()}` : 'image/jpeg' } as any);
  // Content-Type must be set explicitly for a FormData body in this React Native / axios setup (see document.api.ts).
  const res = await apiClient.post('/api/orders/returns/evidence', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.evidenceId;
};

export const submitReturn = async (
  orderId: string,
  body: { items: { itemIndex: number; quantity: number; reason: string; condition: string; notes?: string }[]; evidenceIds: string[]; note?: string },
): Promise<ReturnClaim> => {
  const res = await apiClient.post(`/api/orders/${orderId}/returns`, body);
  return res.data.request;
};
