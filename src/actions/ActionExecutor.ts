import { addItemToCart } from '@/src/services/api/cart.api';
import { navigationRef } from '../navigation/navigationRef';
import { addItemLocal } from '../redux/slices/cartSlice';
import { store } from '../redux/store';
import { ActionRegistry } from './ActionRegistry';
import { ActionKey } from './action.types';

export async function executeAction(action: ActionKey, params?: any) {
  const def = ActionRegistry[action];
  if (!def || !navigationRef.isReady()) return;

  const { isAuthenticated } = store.getState().boot;

  if (!isAuthenticated) {
    navigationRef.navigate('Auth');
    return;
  }

  if (action === 'ADD_MEDICINE_FROM_SEARCH') {
    try {
      const { pharmacyId, pharmacyName, medicine } = params;

      const cartItem = {
        productId: medicine.id,
        sku: medicine.sku,
        name: medicine.name,
        price: medicine.price ?? 0,
        discountPrice: medicine.discountPrice ?? medicine.price ?? 0,
        quantity: 1,
        brand: medicine.manufacturer,
        composition: medicine.composition,
        prescriptionRequired: medicine.prescriptionRequired ?? false,
        image: medicine.images?.[0] ?? null,
        batchId: Array.isArray(medicine.batchNum)
          ? String(medicine.batchNum[0] ?? '')
          : String(medicine.batchNum ?? ''),
        expiryDate: Array.isArray(medicine.expiryDate)
          ? medicine.expiryDate[0] ?? null
          : medicine.expiryDate ?? null,
      };

      // backend
      await addItemToCart(pharmacyId, cartItem);

      // redux (THIS is what updates StickyCartBar)
      store.dispatch(
        addItemLocal({
          storeId: pharmacyId,
          storeName: pharmacyName,
          item: cartItem,
        })
      );

      // navigation
      navigationRef.navigate('PharmacyStack', {
        screen: 'PharmacyDetail',
        params: {
          pharmacyId,
          medicineName: medicine.name,
        },
      });
    } catch (e) {
      console.error('ADD_MEDICINE_FROM_SEARCH failed', e);
    }
    return;
  }

  if (action === 'GO_BACK') {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
    return;
  }

  if (def.tab) {
    if (def.screen) {
      navigationRef.navigate('Tabs', {
        screen: def.tab,
        params: {
          screen: def.screen,
          params,
        },
      });
    } else {
      navigationRef.navigate('Tabs', { screen: def.tab });
    }
    return;
  }

  if (def.stack) {
    navigationRef.navigate(def.stack, {
      screen: def.screen,
      params,
    });
    return;
  }

  if (def.screen) {
    navigationRef.navigate(def.screen, params);
  }
}
