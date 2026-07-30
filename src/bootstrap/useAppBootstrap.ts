import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setAppReady } from '../redux/slices/appSlice';
import { loginSuccess, logout } from '../redux/slices/authSlice';
import { loadActivityFromStorage } from '../redux/slices/activitySlice';
import { setActiveOrder } from '../redux/slices/orderSlice';

export function useAppBootstrap() {
  const dispatch = useDispatch();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const onboardingComplete =
          (await AsyncStorage.getItem('onboarding_complete')) === 'true';

        if (token) {
          dispatch(
            loginSuccess({
              token,
              onboardingComplete,
            })
          );

          // Restore persisted active order (if any) only for authenticated user
          const rawOrder = await AsyncStorage.getItem('@active_order');
          if (rawOrder) {
            try {
              const parsedOrder = JSON.parse(rawOrder);
              if (parsedOrder && parsedOrder.status !== 'delivered') {
                dispatch(setActiveOrder(parsedOrder));
              }
            } catch (jsonErr) {
              console.warn('Failed parsing active order from AsyncStorage:', jsonErr);
            }
          }
        } else {
          dispatch(logout());
          await AsyncStorage.removeItem('@active_order');
        }
      } catch {
        dispatch(logout());
      } finally {
        dispatch(setAppReady(true));
        // Load persisted in-progress activity
        dispatch(loadActivityFromStorage() as any);
      }
    };

    bootstrap();
  }, []);
}
