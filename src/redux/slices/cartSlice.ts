import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from './cart.types';

const initialState: CartState = {};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCart(_, action: PayloadAction<CartState>) {
      return action.payload;
    },

    addItemLocal(
      state,
      action: PayloadAction<{
        storeId: string;
        storeName: string;
        item: CartItem;
      }>
    ) {
      const { storeId, storeName, item } = action.payload;

      if (!state[storeId]) {
        state[storeId] = {
          storeId,
          storeName,
          items: {},
        };
      }

      const existing = state[storeId].items[item.sku];

      state[storeId].items[item.sku] = {
        ...item,
        quantity: (existing?.quantity || 0) + item.quantity,
      };
    },

    updateItemQuantityLocal(
      state,
      action: PayloadAction<{
        storeId: string;
        sku: string | number;
        quantity: number;
      }>
    ) {
      const store = state[action.payload.storeId];
      if (!store) return;

      if (action.payload.quantity <= 0) {
        delete store.items[action.payload.sku];
        if (Object.keys(store.items).length === 0) {
          delete state[action.payload.storeId];
        }
        return;
      }

      store.items[action.payload.sku].quantity =
        action.payload.quantity;
    },

    clearStoreCartLocal(
      state,
      action: PayloadAction<{ storeId: string }>
    ) {
      delete state[action.payload.storeId];
    },
  },
});

export const {
  hydrateCart,
  addItemLocal,
  updateItemQuantityLocal,
  clearStoreCartLocal,
} = cartSlice.actions;

export default cartSlice.reducer;
