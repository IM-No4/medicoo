import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { LanguageProvider } from '../i18n/LanguageContext';

import RootNavigator from '../navigation/RootNavigator';
import { handleDeepLink } from '../navigation/deepLinkHandler';
import { linking } from '../navigation/linking';
import { navigationRef } from '../navigation/navigationRef';
import { AppDispatch, store } from '../redux/store';
import { loadGoalsCache, loadGoalsFromServer } from '../redux/slices/goalsSlice';
import { loadVitalsCache } from '../redux/slices/vitalsSlice';
import { loadProfileCache, loadProfileFromServer } from '../redux/slices/profileSlice';
import { loadConnectedDeviceCache } from '../redux/slices/deviceSlice';
import { loadCalendarCache } from '../redux/slices/calendarSlice';
import { checkLegalAcceptance } from '../redux/slices/legalSlice';
import { loadAppConfig } from '../redux/slices/appConfigSlice';
import { startOfflineSyncCoordinator } from '../services/offlineSync';
import { startForegroundSync } from '../services/health/stepsAutoSync';
import { refreshAndScheduleMedicineReminders } from '../services/notifications/medicineReminderScheduler';
import { getLocalDateString } from '../utils/dateUtils';

import ErrorBoundary from '../components/ErrorBoundary';
import { initCrashReporting } from '../bootstrap/crashReporting';
import { initPushNotifications, setupNotificationTapHandling } from '../bootstrap/pushNotifications';
import { syncCartOnBoot } from '../bootstrap/syncCartOnBoot';
import { useBoot } from '../bootstrap/useBoot';
import { useForegroundRecheck } from '../bootstrap/useForegroundRecheck';
import { usePostLoginEffects } from '../features/auth/usePostLoginEffects';
import { isStepsTrackingEnabled, isNativeStepsWriteEnabled } from '../services/health/stepsTrackingFlags';
import { ensureNativeStepsBackgroundTaskRegistered } from '../services/health/nativeStepsBackgroundTask';
import { FONT_MAP } from '../constants/fonts';
import { useLanguage } from '../i18n/LanguageContext';

// No JS splash screen in the flow anymore - the native splash (configured
// in app.json, same logo/background as the app icon) stays up for the
// entire loading period (fonts + boot sequence) and is hidden exactly once,
// the instant real content is ready to render. One screen, one handoff.
SplashScreen.preventAutoHideAsync().catch(() => {});

// The font itself (which files, which family name) is defined once in
// constants/fonts.ts - this is the only other place that needs to know
// about it, and only to hand the map to useFonts.

function AppContent() {
  const boot = useBoot();
  const dispatch = useDispatch<AppDispatch>();
  usePostLoginEffects();
  useForegroundRecheck();

  useEffect(() => {
    if (boot.status !== 'ready') return;
    if (!boot.isAuthenticated) return;

    syncCartOnBoot();
    dispatch(loadGoalsCache());
    dispatch(loadGoalsFromServer());
    dispatch(loadVitalsCache());
    dispatch(loadProfileCache());
    dispatch(loadProfileFromServer());
    dispatch(loadConnectedDeviceCache());
    // Steps and friend invites: read now and every time the app comes back (from any screen, not just Health).
    const stopForegroundSync = startForegroundSync(dispatch, store.getState);
    // Today's medicines/appointments cache - previously only ever populated
    // by actually opening the Calendar tab (CalendarScreen.tsx is the only
    // other caller), so a session that went offline without visiting it
    // first had nothing to fall back on and OfflineHomeContent's medication
    // list came up empty.
    dispatch(loadCalendarCache(getLocalDateString()));
    dispatch(checkLegalAcceptance());
    dispatch(loadAppConfig());

    // Re-derives the whole rolling 3-day local-reminder window on every
    // app open - cheap, and the only way to make sure it stays fresh even
    // for a session that never touches a medication screen at all today
    // (yesterday's window would otherwise still be sitting there un-rolled).
    refreshAndScheduleMedicineReminders();

    // Flushes anything queued in StorageService's offline write-queue
    // (medicine intake marks, vitals logged while offline) - see
    // offlineSync.ts for why this has to exist at all.
    const stopOfflineSync = startOfflineSyncCoordinator();

    // Defensive re-registration in case the background task was ever lost
    // (e.g. reinstall) - ensureNativeStepsBackgroundTaskRegistered() is a
    // cheap no-op if it's already registered.
    Promise.all([isStepsTrackingEnabled(), isNativeStepsWriteEnabled()]).then(([tracking, nativeWrite]) => {
      if (tracking && nativeWrite) ensureNativeStepsBackgroundTaskRegistered();
    });

    // Without this, logging out (isAuthenticated flips false, re-running
    // this effect) would leak the interval/AppState listener rather than
    // stopping it - it'd keep firing sync attempts for a session that no
    // longer exists.
    return () => {
      stopOfflineSync();
      stopForegroundSync();
    };
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

  // Hide the native splash exactly once, the instant boot is ready - by
  // this point fonts are already guaranteed ready too, since App() below
  // doesn't mount this component (or the Provider it lives under) until
  // fontsReady is true. Real content and splash removal land in the same
  // render, so there's no gap where nothing (or the wrong font) is visible.
  useEffect(() => {
    // 'offline'/'mandatoryUpdate'/'maintenance' also need to hide the splash -
    // that's the whole point of the screens RootNavigator renders for each
    // (OfflineGateScreen/MandatoryUpdateScreen/MaintenanceScreen), and none
    // of them would ever become visible if the native splash stayed up
    // waiting specifically for 'ready', which none of those three reach.
    // boot.isSlow is the same idea for a boot that's none of those yet,
    // just taking unusually long - SlowBootScreen below needs the native
    // splash out of the way to actually become visible too.
    if (
      boot.status === 'ready' ||
      boot.status === 'offline' ||
      boot.status === 'mandatoryUpdate' ||
      boot.status === 'maintenance' ||
      boot.isSlow
    ) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [boot.status, boot.isSlow]);

  // ⛔ Do NOT render navigation until boot is complete - render nothing
  // (leaving the still-visible native splash as the only thing on screen)
  // unless boot has been running long enough that staying silent would just
  // look like a frozen app - see BootCoordinator's SLOW_BOOT_THRESHOLD_MS.
  // Every terminal boot status RootNavigator has its own screen for
  // (offline/mandatoryUpdate/maintenance, alongside the normal 'ready')
  // must reach it - only a boot that's genuinely still in progress stays
  // gated here.
  const TERMINAL_STATUSES = ['ready', 'offline', 'mandatoryUpdate', 'maintenance'];
  if (!TERMINAL_STATUSES.includes(boot.status)) {
    return boot.isSlow ? <SlowBootScreen /> : null;
  }

  return <RootNavigator />;
}

// Only ever shown after SLOW_BOOT_THRESHOLD_MS (BootCoordinator.ts) has
// passed with boot still not resolved - a normal boot (online, healthy
// connection) never reaches this, since it resolves well before then.
// Deliberately reassuring rather than alarming ("slow connection", not
// "error") - being slow isn't a failure state, and this recovers into the
// exact same ready/offline outcome runBootSequence would have reached
// anyway, just later.
function SlowBootScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <View style={[styles.slowBootContainer, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color="#10B981" />
      <Text style={[styles.slowBootTitle, { color: theme.text }]}>{t('hang_tight')}</Text>
      <Text style={[styles.slowBootSubtitle, { color: theme.textSecondary }]}>{t('your_connection_seems_a_little_slow_ri')}</Text>
    </View>
  );
}

// app.json commits to edgeToEdgeEnabled + a fully transparent
// expo-navigation-bar (see ./plugins/withTransparentNavigationBar.js's own
// comment) - on modern Android this means the system nav bar/gesture pill
// is a real overlay drawn on top of whatever the app itself puts there,
// with no OS-level way back to an opaque one. Per-screen solid strips
// (LegalPage.tsx, HealthArticleDetailScreen.tsx, etc.) covered that need
// screen by screen; this is the same trick applied once, globally, so
// every screen - including plain stack/tab screens that never got their
// own strip, like Home - shows a solid white bar instead of a transparent
// one. pointerEvents="none" so it never swallows the edge gesture.
function SystemNavBarBackground() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  if (Platform.OS !== 'android' || insets.bottom <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: insets.bottom,
        backgroundColor: isDark ? '#080E17' : '#FFFFFF',
      }}
    />
  );
}

const styles = StyleSheet.create({
  slowBootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    gap: 12,
  },
  slowBootTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  slowBootSubtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
  },
});

// Gives React Navigation the active palette so screens that don't paint their
// own background (and the transition flash between screens) match the theme.
function ThemedNavigationContainer({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };
  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={navTheme}>
      {children}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_MAP);
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    initCrashReporting();
    initPushNotifications();
  }, []);

  if (fontError) {
    console.warn('[App] Custom font failed to load, falling back to system font', fontError);
  }

  // Keep rendering nothing (native splash stays up) until fonts are ready.
  // AppContent (below, once mounted) keeps the splash up further still,
  // until boot is also ready.
  if (!fontsReady) {
    return null;
  }

  return (
    // Store + language + theme sit OUTSIDE the error boundary so even its crash
    // screen renders in the user's chosen light/dark theme.
    <Provider store={store}>
      <LanguageProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <SafeAreaProvider>
              <ThemedNavigationContainer>
                <AppContent />
              </ThemedNavigationContainer>
              <SystemNavBarBackground />
            </SafeAreaProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </LanguageProvider>
    </Provider>
  );
}
