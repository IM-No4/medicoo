import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfileDetails } from '../services/api/user.api';
import { clearToken, getToken } from '../utils/tokenManagement';
import { bootStart, bootSuccess } from './boot.slice';

export const runBootSequence = async (dispatch: any) => {
  try {
    dispatch(bootStart());

    // Start timer for minimum splash screen duration
    const startTime = Date.now();
    const MIN_SPLASH_DURATION = 3000; // 3 seconds

    const token = await getToken('access_token');
    const onboarding = await AsyncStorage.getItem('onboarding_completed');

    // If no token, user is not authenticated
    if (!token) {
      // Ensure minimum splash duration
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      dispatch(
        bootSuccess({
          isAuthenticated: false,
          onboardingCompleted: false,
          initialRoute: 'Login',
        })
      );
      return;
    }

    // Validate the token by making an API call
    try {
      await getProfileDetails();

      // Ensure minimum splash duration
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // Token is valid
      dispatch(
        bootSuccess({
          isAuthenticated: true,
          onboardingCompleted: onboarding === 'true',
          initialRoute: 'MainTabs',
        })
      );
    } catch {
      // Token is invalid (401) or other error
      // Clear invalid token
      await clearToken('access_token');
      await AsyncStorage.removeItem('onboarding_completed');

      // Ensure minimum splash duration
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // User is not authenticated
      dispatch(
        bootSuccess({
          isAuthenticated: false,
          onboardingCompleted: false,
          initialRoute: 'Login',
        })
      );
    }
  } catch (e) {
    console.error('Boot sequence failed:', e);
    // Never leave the app stuck on the splash screen.
    dispatch(
      bootSuccess({
        isAuthenticated: false,
        onboardingCompleted: false,
        initialRoute: 'Login',
      })
    );
  }
};
