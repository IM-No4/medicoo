import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';

import RootNavigator from '../navigation/RootNavigator';
import { handleDeepLink } from '../navigation/deepLinkHandler';
import { linking } from '../navigation/linking';
import { navigationRef } from '../navigation/navigationRef';
import { AppDispatch, store } from '../redux/store';
import { loadGoalsCache, loadGoalsFromServer } from '../redux/slices/goalsSlice';
import { loadOnDeviceSteps } from '../redux/slices/deviceSlice';
import { checkLegalAcceptance } from '../redux/slices/legalSlice';

import ErrorBoundary from '../components/ErrorBoundary';
import { initCrashReporting } from '../bootstrap/crashReporting';
import { initPushNotifications, setupNotificationTapHandling } from '../bootstrap/pushNotifications';
import { syncCartOnBoot } from '../bootstrap/syncCartOnBoot';
import { useBoot } from '../bootstrap/useBoot';
import { usePostLoginEffects } from '../features/auth/usePostLoginEffects';

// Keep the native splash up until Montserrat is loaded AND boot has
// resolved, so the native splash is the only screen ever visible before the
// real app - no separate JS splash screen flashing in between.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Metro needs a static string literal to resolve/bundle each asset - it
// can't statically analyze a template-literal/loop-built require() path -
// so every font file is required explicitly rather than generated. Keys
// match what globalFont.ts's resolveFontFamily computes (weight suffix +
// "Italic"), which is why the plain-italic file (named just
// "Montserrat-Italic.ttf" on disk) is loaded under the "RegularItalic" key.
const montserratFontMap = {
  'Montserrat-Thin': require('../assets/fonts/Montserrat-Thin.ttf'),
  'Montserrat-ThinItalic': require('../assets/fonts/Montserrat-ThinItalic.ttf'),
  'Montserrat-ExtraLight': require('../assets/fonts/Montserrat-ExtraLight.ttf'),
  'Montserrat-ExtraLightItalic': require('../assets/fonts/Montserrat-ExtraLightItalic.ttf'),
  'Montserrat-Light': require('../assets/fonts/Montserrat-Light.ttf'),
  'Montserrat-LightItalic': require('../assets/fonts/Montserrat-LightItalic.ttf'),
  'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
  'Montserrat-RegularItalic': require('../assets/fonts/Montserrat-Italic.ttf'),
  'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
  'Montserrat-MediumItalic': require('../assets/fonts/Montserrat-MediumItalic.ttf'),
  'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
  'Montserrat-SemiBoldItalic': require('../assets/fonts/Montserrat-SemiBoldItalic.ttf'),
  'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
  'Montserrat-BoldItalic': require('../assets/fonts/Montserrat-BoldItalic.ttf'),
  'Montserrat-ExtraBold': require('../assets/fonts/Montserrat-ExtraBold.ttf'),
  'Montserrat-ExtraBoldItalic': require('../assets/fonts/Montserrat-ExtraBoldItalic.ttf'),
  'Montserrat-Black': require('../assets/fonts/Montserrat-Black.ttf'),
  'Montserrat-BlackItalic': require('../assets/fonts/Montserrat-BlackItalic.ttf'),
};

function AppContent() {
  const boot = useBoot();
  const dispatch = useDispatch<AppDispatch>();
  const [fontsLoaded, fontError] = useFonts(montserratFontMap);
  usePostLoginEffects();

  useEffect(() => {
    if ((fontsLoaded || fontError) && boot.status === 'ready') {
      if (fontError) console.warn('[App] Montserrat failed to load, falling back to system font', fontError);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, boot.status]);

  useEffect(() => {
    if (boot.status !== 'ready') return;
    if (!boot.isAuthenticated) return;

    syncCartOnBoot();
    dispatch(loadGoalsCache());
    dispatch(loadGoalsFromServer());
    dispatch(loadOnDeviceSteps());
    dispatch(checkLegalAcceptance());
  }, [boot.status, boot.isAuthenticated, dispatch]);
  /**
   * ✅ Handle deep links ONLY after boot is ready
   */
  useEffect(() => {
    if (boot.status !== 'ready') return;

    // Initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url && navigationRef.isReady()) {
        handleDeepLink(url);
      }
    });

    // Runtime links
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (navigationRef.isReady()) {
        handleDeepLink(url);
      }
    });

    // Push notification taps (background wake + cold start)
    setupNotificationTapHandling();

    return () => sub.remove();
  }, [boot.status]);

  // Native splash is still covering the screen until both fonts and boot
  // are ready - nothing should render here, so no screen (not even a JS
  // splash) ever gets a chance to flash before the real app does.
  if ((!fontsLoaded && !fontError) || boot.status !== 'ready') {
    return null;
  }

  return <RootNavigator />;
}

export default function App() {
  useEffect(() => {
    initCrashReporting();
    initPushNotifications();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
          >
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    </ErrorBoundary>
  );
}
