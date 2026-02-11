import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setAppReady } from '../redux/slices/appSlice';
import { loginSuccess, logout } from '../redux/slices/authSlice';

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
        } else {
          dispatch(logout());
        }
      } catch {
        dispatch(logout());
      } finally {
        dispatch(setAppReady(true));
      }
    };

    bootstrap();
  }, []);
}
