import { apiClient } from './client';

/** One row of the bill, exactly as the server worked it out. New fees or taxes simply arrive as more rows. */
export interface QuoteLine {
  id: string;
  label: string;
  /** Negative for a discount. */
  amount: number;
  /** 'main' rows are always shown; 'charges' rows sit under the expandable "GST & charges" row. */
  group: 'main' | 'charges';
  free?: boolean;
  kind?: 'discount';
}

/** What a medicine order costs and the wording shown with it. Everything here comes from the server. */
export interface OrderQuote {
  subtotal: number;
  deliveryFee: number;
  packaging: number;
  platformFee: number;
  feeGst: number;
  discount: number;
  total: number;
  lines: QuoteLine[];
  deliveryEtaMins: number;
  distanceKm: number | null;
  coupon: { code: string; discountType: string; description: string } | null;
  policy: { returnWindowHours: number; cancellation: string; returns: string };
}

export class QuoteRefused extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Asks the server for the bill. Prices come from the cart; every fee, tax, discount and rule comes back from the server,
 * so a change there (a new fee, a different rate) shows up in the cart without an app update.
 */
export const fetchOrderQuote = async (input: {
  storeId: string;
  items: Array<{ productId?: string; quantity: number; price: number; discountPrice?: number }>;
  address?: { latitude?: number; longitude?: number } | null;
  couponCode?: string | null;
}): Promise<OrderQuote> => {
  try {
    const res = await apiClient.post('/api/orders/quote', {
      storeId: input.storeId,
      items: input.items,
      address: input.address ? { latitude: input.address.latitude, longitude: input.address.longitude } : null,
      couponCode: input.couponCode || undefined,
    });
    return res.data.quote as OrderQuote;
  } catch (error: any) {
    const data = error?.response?.data;
    if (data?.code) throw new QuoteRefused(data.code, data.message || 'That is not available right now.');
    throw error;
  }
};
