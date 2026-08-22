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
import { loadOnDeviceSteps, loadConnectedDeviceCache } from '../redux/slices/deviceSlice';
import { checkLegalAcceptance } from '../redux/slices/legalSlice';
import { loadAppConfig } from '../redux/slices/appConfigSlice';

import ErrorBoundary from '../components/ErrorBoundary';
import { initCrashReporting } from '../bootstrap/crashReporting';
import { initPushNotifications, setupNotificationTapHandling } from '../bootstrap/pushNotifications';
import { syncCartOnBoot } from '../bootstrap/syncCartOnBoot';
import { useBoot } from '../bootstrap/useBoot';
import { usePostLoginEffects } from '../features/auth/usePostLoginEffects';
import JSSplashScreen from '../features/splash/SplashScreen';
import { isStepsTrackingEnabled, isNativeStepsWriteEnabled } from '../services/health/stepsTrackingFlags';
import { ensureNativeStepsBackgroundTaskRegistered } from '../services/health/nativeStepsBackgroundTask';

function AppSplash() {
  return <JSSplashScreen />;
}

// Keep the native splash up until Montserrat is actually loaded, so no
// screen ever gets a chance to flash the system font first - not even the
// JS splash screen itself, which renders its own <Text>.
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
  usePostLoginEffects();

  useEffect(() => {
    if (boot.status !== 'ready') return;
    if (!boot.isAuthenticated) return;

    syncCartOnBoot();
    dispatch(loadGoalsCache());
    dispatch(loadGoalsFromServer());
    dispatch(loadConnectedDeviceCache());
    dispatch(loadOnDeviceSteps());
    dispatch(checkLegalAcceptance());
    dispatch(loadAppConfig());

    // Defensive re-registration in case the background task was ever lost
    // (e.g. reinstall) - ensureNativeStepsBackgroundTaskRegistered() is a
    // cheap no-op if it's already registered.
    Promise.all([isStepsTrackingEnabled(), isNativeStepsWriteEnabled()]).then(([tracking, nativeWrite]) => {
      if (tracking && nativeWrite) ensureNativeStepsBackgroundTaskRegistered();
    });
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

  // ⛔ Do NOT render navigation until boot is complete
  if (boot.status !== 'ready') {
    return <AppSplash />;
  }

  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(montserratFontMap);

  useEffect(() => {
    initCrashReporting();
    initPushNotifications();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) console.warn('[App] Montserrat failed to load, falling back to system font', fontError);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Keep the native splash on screen (nothing else renders) until
  // Montserrat is ready or has definitively failed - avoids any screen,
  // including the JS splash screen itself, ever flashing the system font.
  if (!fontsLoaded && !fontError) {
    return null;
  }

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
