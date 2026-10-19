import { apiClient } from './client';

export interface ApiCoupon {
  _id: string;
  code: string;
  type: string;
  description?: string;
  discountType: 'percentage' | 'flat' | 'free_shipping' | 'free_subscription' | 'fixed_total';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  expiry: string;
  // Added server-side (customerController.getStoreCoupons) from the
  // cart's real usage/order-value context - not just "is this coupon
  // active anywhere", but "can *this* customer actually use it on *this*
  // cart right now". A coupon this customer has exhausted (globally or
  // their own per-user allowance) never even reaches the client;
  // minOrderValue not yet met is the one case still returned, so the UI
  // can show a "add ₹X more" nudge instead of just hiding it.
  eligible: boolean;
  shortfall: number;
}

/**
 * Real, admin-managed medicine coupons (customerController.getStoreCoupons -
 * already filters to type:'medicine', active, and not yet expired) -
 * CouponScreen.tsx previously showed a hardcoded list instead of this.
 * `cartAmount` (the store-cart's current subtotal) drives the
 * minOrderValue eligibility check server-side.
 */
export const getStoreCoupons = async (cartAmount?: number): Promise<ApiCoupon[]> => {
  try {
    const response = await apiClient.get<ApiCoupon[]>('/api/v1/user/get-store-coupons', {
      params: { amount: cartAmount },
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Failed to fetch coupons', error);
    return [];
  }
};

/**
 * Get cart on app start
 */
export const getCartFromServer = async () => {
  try {
    const response = await apiClient.get('/api/cart/get');
    return response.data; // { carts: [...] }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return { carts: [] }; // Graceful handle for "no cart in DB yet"
    }
    throw error;
  }
};

/**
 * Add item to cart (exact backend contract)
 */
export const addItemToCart = async (
  storeId: string,
  storeName: string,
  item: {
    productId: string;
    sku?: number | string;
    name: string;
    price: number;
    discountPrice: number;
    quantity: number;
    brand?: string;
    composition?: string;
    prescriptionRequired?: boolean;
    image?: string | null;
    batchId: string;
    expiryDate: string | null;
  }
) => {
  const payload = {
    storeId,
    storeName,
    productId: item.productId, // Root field required by validation middleware
    quantity: item.quantity,   // Root field required by validation middleware
    item: {
      sku: item.sku,
      medicineId: item.productId,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
      brand: item.brand,
      composition: item.composition,
      batchNum: item.batchId, // Backend uses batchNum in addItem
      expiryDate: item.expiryDate,
      prescriptionStatus: item.prescriptionRequired ?? false, // Backend uses prescriptionStatus
      images: item.image ? [item.image] : [], // Backend uses images array
    },
  };

  console.log('📡 API Call: POST /api/cart/add-item', JSON.stringify(payload, null, 2));

  try {
    const response = await apiClient.post('/api/cart/add-item', payload);
    return response.data;
  } catch (error: any) {
    console.error('❌ API Error details:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Increment / decrement quantity
 */
export const updateCartItemQuantity = async (
  storeId: string,
  sku: number | string,
  productId: string,
  quantity: number
) => {
  const response = await apiClient.post('/api/cart/update-quantity', {
    storeId,
    sku,
    productId,
    medicineId: productId, // Send both to be safe
    quantity: Number(quantity), // Explicit cast to number
  });

  return response.data;
};

/**
 * Remove item completely
 */
export const removeItemFromCart = async (
  storeId: string,
  sku: number | string,
  productId: string
) => {
  const response = await apiClient.post('/api/cart/remove-item', {
    storeId,
    sku,
    productId,
    medicineId: productId,
  });

  return response.data;
};

/**
 * Clear entire store cart
 */
export const clearCart = async (storeId: string) => {
  const response = await apiClient.delete(
    `/api/cart/clear/${storeId}`
  );
  return response.data;
};

/**
 * Sync full cart (future / safety)
 */
export const syncCartToServer = async (cartData: any) => {
  // Backend expects req.body.cartData.cartData.carts
  const response = await apiClient.post('/api/cart/sync', {
    cartData: {
      cartData: {
        carts: cartData // Assuming cartData passed is the array of stores
      }
    },
  });
  return response.data;
};
