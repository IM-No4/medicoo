import { NavigationContainer } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import RootNavigator from '../navigation/RootNavigator';
import { handleDeepLink } from '../navigation/deepLinkHandler';
import { linking } from '../navigation/linking';
import { navigationRef } from '../navigation/navigationRef';
import { store } from '../redux/store';

import ErrorBoundary from '../components/ErrorBoundary';
import { initCrashReporting } from '../bootstrap/crashReporting';
import { initPushNotifications, setupNotificationTapHandling } from '../bootstrap/pushNotifications';
import { syncCartOnBoot } from '../bootstrap/syncCartOnBoot';
import { useBoot } from '../bootstrap/useBoot';
import { usePostLoginEffects } from '../features/auth/usePostLoginEffects';
import SplashScreen from '../features/splash/SplashScreen';

function AppSplash() {
  return <SplashScreen />;
}

function AppContent() {
  const boot = useBoot();
  usePostLoginEffects();

  useEffect(() => {
    if (boot.status !== 'ready') return;
    if (!boot.isAuthenticated) return;

    syncCartOnBoot();
  }, [boot.status, boot.isAuthenticated]);
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
