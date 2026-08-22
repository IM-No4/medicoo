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
      const { pharmacyId, pharmacyName, medicine, itemId } = params;

      if (!medicine && itemId) {
        console.warn('ADD_MEDICINE_FROM_SEARCH called with itemId but no medicine object.');
      }

      const med = medicine || { id: itemId, name: 'Medicine' };

      // Ensure we have a valid batchId
      let batchId = '';
      if (med.batchNum) {
        if (Array.isArray(med.batchNum) && med.batchNum.length > 0) {
          batchId = String(med.batchNum[0]);
        } else if (typeof med.batchNum === 'string' || typeof med.batchNum === 'number' || typeof med.batchNum === 'object') {
          batchId = String(med.batchNum);
        }
      }

      // Final fallback to avoid backend 500
      if (!batchId || batchId === 'undefined' || batchId === 'null') {
        console.warn(`Missing or invalid batchId for ${med.name}, using med.id as fallback`);
        batchId = String(med.id);
      }

      // med.discountPrice is a discount AMOUNT to subtract from price, not
      // the final selling price - CartItem.discountPrice is the opposite:
      // the already-discounted final price (see CartScreen's rendering and
      // MedicineRow.tsx/MedicineDetailBottomSheet.tsx's add-to-cart, which
      // both do this same subtraction). Copying med.discountPrice straight
      // across meant the cart showed the raw discount amount as if it were
      // the item's price.
      const originalPrice = med.price ?? 0;
      const discountAmount = med.discountPrice ?? 0;
      const finalPrice = discountAmount > 0 ? originalPrice - discountAmount : originalPrice;

      const cartItem = {
        productId: med.id,
        medicineId: med.id, // Redux expects medicineId
        sku: med.sku || med.id,
        name: med.name,
        price: originalPrice,
        discountPrice: finalPrice,
        quantity: 1,
        brand: med.manufacturer || med.brand || '',
        composition: med.composition || '',
        prescriptionRequired: med.prescriptionRequired ?? false,
        image: med.images?.length > 0 ? med.images[0] : (med.image || null),
        batchId: batchId,
        expiryDate: Array.isArray(med.expiryDate) ? med.expiryDate[0] : (med.expiryDate || null),
      };

      console.log('🛒 Adding to cart:', { pharmacyId, medicineName: med.name, batchId });

      // backend
      await addItemToCart(pharmacyId, pharmacyName || 'Pharmacy', cartItem);

      // redux
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
          medicineName: med.name,
        },
      });
    } catch (e: any) {
      const errorMsg = e?.response?.data?.message || e?.response?.data || e.message;
      console.error('❌ ADD_MEDICINE_FROM_SEARCH failed:', errorMsg);
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
