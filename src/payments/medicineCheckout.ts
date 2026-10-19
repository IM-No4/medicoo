import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import { clearStoreCartLocal } from '../redux/slices/cartSlice';
import { dismissActivity } from '../redux/slices/activitySlice';
import { setActiveOrder } from '../redux/slices/orderSlice';
import { clearCart } from '../services/api/cart.api';
import { getPaymentOrderState } from './api';
import { clearPending, loadPending } from './pendingStore';

// Mirrors a medicine order the SERVER placed after a confirmed payment into the
// app: the active order (live tracking) and clearing the cart. Used both when the
// customer stays on the payment screen and when they left it and come back later.

export const mapOrderItems = (items: any[]) =>
  items.map((item: any) => ({
    productId: item.medicineId,
    sku: item.sku,
    name: item.name,
    price: item.price,
    discountPrice: item.discountPrice,
    quantity: item.quantity,
    brand: item.brand || '',
    composition: item.composition || '',
    prescriptionRequired: item.prescriptionRequired || false,
    image: item.image || null,
    batchId: item.batchId || String(item.medicineId),
    expiryDate: item.expiryDate || null,
  }));

export interface PaidMedicineOrder {
  dispatch: (action: any) => unknown;
  storeId: string;
  storeName: string;
  items: any[];
  amount: number;
  address: any;
  orderId?: string;
  orderNumber?: string;
  billData?: Record<string, unknown>;
}

export const applyPaidMedicineOrder = async ({ dispatch, storeId, storeName, items, amount, address, orderId, orderNumber, billData }: PaidMedicineOrder) => {
  try {
    await clearCart(storeId);
  } catch (e) {
    console.warn('Failed clearing cart from database, continuing locally', e);
  }
  dispatch(
    setActiveOrder({
      orderId: orderId || '',
      orderNumber: orderNumber || '',
      storeId,
      storeName,
      amount,
      address,
      status: 'pending',
      timestamp: Date.now(),
      items: mapOrderItems(items),
      billData: billData || {
        totalAmount: amount,
        finalTotal: amount,
        totalItems: items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      },
    } as any),
  );
  dispatch(dismissActivity() as any);
  dispatch(clearStoreCartLocal({ storeId }));
};

/**
 * For the cart screen: a customer who paid and then left the payment screen has
 * a medicine order the server is (or has already finished) placing. On focus this
 * settles it - clearing the cart when it succeeded - and reports which stores
 * still have a payment being confirmed, so the cart can say so instead of
 * inviting a second payment.
 */
export function useSettlePendingMedicinePayments(storeCarts: Array<{ storeId: string; storeName?: string; items: Record<string, any> }>) {
  const dispatch = useDispatch();
  const address = useSelector((state: RootState) => state.address.selectedAddress);
  const [confirming, setConfirming] = useState<Record<string, boolean>>({});
  const key = storeCarts.map((c) => c.storeId).join(',');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const next: Record<string, boolean> = {};
        for (const cart of storeCarts) {
          // eslint-disable-next-line no-await-in-loop
          const pending = await loadPending(`medicine:${cart.storeId}`);
          if (!pending) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const state = await getPaymentOrderState(pending.orderId);
            if (state.state === 'success') {
              // eslint-disable-next-line no-await-in-loop
              await clearPending(`medicine:${cart.storeId}`);
              // eslint-disable-next-line no-await-in-loop
              await applyPaidMedicineOrder({
                dispatch,
                storeId: cart.storeId,
                storeName: cart.storeName || 'Pharmacy',
                items: Object.values(cart.items || {}),
                amount: state.amountPaise / 100,
                address,
                orderId: state.fulfillment?.result?.orderId,
                orderNumber: state.fulfillment?.result?.orderNumber,
              });
            } else if (state.state === 'failed') {
              // eslint-disable-next-line no-await-in-loop
              await clearPending(`medicine:${cart.storeId}`);
            } else {
              next[cart.storeId] = true;
            }
          } catch {
            next[cart.storeId] = true; // offline - still unconfirmed
          }
        }
        if (!cancelled) setConfirming(next);
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, dispatch]),
  );

  return confirming;
}
