import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ActiveOrder {
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  amount: number;
  address: {
    label?: string;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
  } | null;
  status: 'pending' | 'accepted' | 'preparing' | 'readyForPickup' | 'pickedUp' | 'dispatched' | 'delivered';
  timestamp: number;
  items?: any[];
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  billData?: any;
}

interface OrderState {
  activeOrder: ActiveOrder | null;
}

const initialState: OrderState = {
  activeOrder: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setActiveOrder(state, action: PayloadAction<ActiveOrder>) {
      state.activeOrder = action.payload;
      AsyncStorage.setItem('@active_order', JSON.stringify(action.payload)).catch(e => {
        console.warn('Failed to save active order to AsyncStorage:', e);
      });
    },
    updateOrderStatus(state, action: PayloadAction<ActiveOrder['status']>) {
      if (state.activeOrder) {
        state.activeOrder.status = action.payload;
        AsyncStorage.setItem('@active_order', JSON.stringify(state.activeOrder)).catch(e => {
          console.warn('Failed to update active order in AsyncStorage:', e);
        });
      }
    },
    clearActiveOrder(state) {
      state.activeOrder = null;
      AsyncStorage.removeItem('@active_order').catch(e => {
        console.warn('Failed to clear active order from AsyncStorage:', e);
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logout', (state) => {
      state.activeOrder = null;
      AsyncStorage.removeItem('@active_order').catch(e => {
        console.warn('Failed to clear active order on logout:', e);
      });
    });
  },
});

export const { setActiveOrder, updateOrderStatus, clearActiveOrder } = orderSlice.actions;
export default orderSlice.reducer;
