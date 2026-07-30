import { apiClient } from './client';

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
