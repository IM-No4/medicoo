import { configureStore } from '@reduxjs/toolkit';
import bootreducer from '../bootstrap/boot.slice';
import searchreducer from '../search/search.slice';
import addressReducer from './slices/addressSlice';
import appReducer from './slices/appSlice';
import authReducer from './slices/authSlice';
import calendarReducer from './slices/calendarSlice';
import cartReducer from './slices/cartSlice';
import locationReducer from './slices/locationSlice';
import notificationReducer from './slices/notificationSlice';

import bloodDonationReducer from './slices/bloodDonationSlice';
import deviceReducer from './slices/deviceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appReducer,
    notifications: notificationReducer,
    boot: bootreducer,
    search: searchreducer,
    address: addressReducer,
    location: locationReducer,
    cart: cartReducer,
    calendar: calendarReducer,
    device: deviceReducer,
    bloodDonation: bloodDonationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
