import { hydrateCart } from '@/src/redux/slices/cartSlice';
import { store } from '@/src/redux/store';
import { getCartFromServer } from '@/src/services/api/cart.api';

export async function syncCartOnBoot() {
  try {
    const res = await getCartFromServer();

    const normalized: Record<string, any> = {};

    res?.carts?.forEach((storeCart: any) => {
      const items: Record<string, any> = {};

      storeCart.items.forEach((item: any) => {
        const skuKey = String(item.sku);

        items[skuKey] = {
          sku: skuKey,
          medicineId: item.medicineId,
          name: item.name,
          price: item.price,
          discountPrice: item.discountPrice,
          quantity: item.quantity,
          brand: item.brand,
          composition: item.composition,
          batchId: item.batchId?.toString() || '',
          expiryDate: item.expiryDate ?? null,
          prescriptionRequired: item.prescriptionRequired ?? false,
          image: item.image || '',
        };
      });

      normalized[storeCart.storeId] = {
        storeId: storeCart.storeId,
        storeName: storeCart.storeName,
        items,
        totalAmount: storeCart.totalAmount ?? 0,
        coupon: storeCart.coupon ?? null,
        prescriptionRequired: storeCart.prescription_required ?? false,
      };
    });

    store.dispatch(hydrateCart(normalized));
  } catch (e) {
    console.warn('Cart sync skipped', e);
    store.dispatch(hydrateCart({}));
  }
}
