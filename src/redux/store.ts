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
import vitalsReducer from './slices/vitalsSlice';
import goalsReducer from './slices/goalsSlice';
import activityReducer from './slices/activitySlice';
import orderReducer from './slices/orderSlice';
import friendsReducer from './slices/friendsSlice';
import legalReducer from './slices/legalSlice';

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
    vitals: vitalsReducer,
    goals: goalsReducer,
    activity: activityReducer,
    order: orderReducer,
    friends: friendsReducer,
    legal: legalReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
