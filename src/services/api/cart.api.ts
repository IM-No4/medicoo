import { apiClient } from './client';

/**
 * Get cart on app start
 */
export const getCartFromServer = async () => {
  const response = await apiClient.get('/api/cart/get');
  return response.data; // { carts: [...] }
};

/**
 * Add item to cart (exact backend contract)
 */
export const addItemToCart = async (
  storeId: string,
  item: {
    productId: string;
    sku?: number;
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
  const response = await apiClient.post('/api/cart/add-item', {
    storeId,

    // ✅ required by validator
    productId: item.productId,
    quantity: item.quantity,

    // ✅ required by controller
    item: {
      sku: item.sku,
      medicineId: item.productId,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
      brand: item.brand,
      composition: item.composition,
      batchId: item.batchId,
      expiryDate: item.expiryDate,
      prescriptionRequired: item.prescriptionRequired ?? false,
      image: item.image ?? null,
    },
  });

  return response.data;
};

/**
 * Increment / decrement quantity
 */
export const updateCartItemQuantity = async (
  storeId: string,
  sku: number,
  quantity: number
) => {
  const response = await apiClient.put('/api/cart/update-quantity', {
    storeId,
    sku,
    quantity,
  });

  return response.data;
};

/**
 * Remove item completely
 */
export const removeItemFromCart = async (
  storeId: string,
  sku: number
) => {
  const response = await apiClient.post('/api/cart/remove-item', {
    storeId,
    sku,
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
  const response = await apiClient.post('/api/cart/sync', {
    cartData,
  });
  return response.data;
};
