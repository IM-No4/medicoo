import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAppConfig, setMaintenanceRestricted } from '../redux/slices/appConfigSlice';
import { getMaintenanceJourneyStatus } from '../services/api/appConfig.api';
import { getProfileDetails } from '../services/api/user.api';
import { checkInternetConnectivity } from '../utils/connectivity';
import { clearToken, getToken } from '../utils/tokenManagement';
import { bootMaintenance, bootMandatoryUpdate, bootOffline, bootStart, bootSuccess, setBootSlow } from './boot.slice';
import { setOnlineStatus } from '../redux/slices/connectivitySlice';

// Advisory only - the real enforcement is maintenanceGate.js on the
// backend. Any failure here fails toward access (treat as "has a
// journey"), never toward the full block, since a wrong answer here is at
// worst a UX inconsistency, while the backend independently rejects any
// actual attempt to start something new regardless.
const hasActiveJourneyOrUnknown = async (): Promise<boolean> => {
  try {
    const { hasActiveJourney } = await getMaintenanceJourneyStatus();
    return hasActiveJourney;
  } catch {
    return true;
  }
};

// How long boot can run before it's fair to tell the user something's slow,
// rather than leaving them staring at a blank splash with zero feedback.
// Deliberately well above MIN_SPLASH_DURATION below (every normal boot
// already waits out that full 3s on purpose, once online) plus room for the
// connectivity probe/profile fetch's usual latency - this only fires when
// boot is taking longer than that entire normal path, not on every launch.
const SLOW_BOOT_THRESHOLD_MS = 5000;

// Shared by both the automatic offline-tolerance path below (a validation
// call that fails mid-boot) and continueOffline (the user explicitly
// tapping "Use in Offline Mode" on OfflineGateScreen) - trusts whatever's
// stored locally without requiring any network call to succeed.
const bootFromLocalState = async (dispatch: any) => {
  const token = await getToken('access_token');
  const onboarding = await AsyncStorage.getItem('onboarding_completed');
  dispatch(
    bootSuccess({
      isAuthenticated: !!token,
      onboardingCompleted: onboarding === 'true',
      initialRoute: token ? 'MainTabs' : 'Login',
    })
  );
};

// "Use in Offline Mode" on OfflineGateScreen - skips the reachability check
// entirely and proceeds on local state alone, exactly like the silent
// fallback below does when a validation call fails mid-boot.
export const continueOffline = async (dispatch: any) => {
  // Set explicitly, not left to the next 45s-interval offlineSync check -
  // the user just told us they're offline by tapping this exact button, so
  // HomeScreen (and anything else reading connectivity.isOnline) needs to
  // know that from the very first frame, not sit there trying to render a
  // network-fed layout in the meantime.
  dispatch(setOnlineStatus(false));
  await bootFromLocalState(dispatch);
};

// `showLoadingState` defaults to true for the normal cold-boot call (App
// mounts with boot.status 'idle') - that transient 'loading' status is
// harmless there because the native splash screen is still covering the
// screen at that point (App.tsx only hides it once status becomes 'ready'
// or 'offline'). OfflineGateScreen's "Try Again" passes false: the splash
// is long gone by then, so dispatching bootStart() would flip status away
// from 'offline' (RootNavigator stops rendering OfflineGateScreen) and
// straight into App.tsx's "not ready yet" blank-render gate - a visible
// blink for however long this recheck takes, on every single retry tap.
// Staying on 'offline' throughout instead means OfflineGateScreen just
// keeps rendering (with its own local retrying-spinner state) until the
// result is in, then moves on to bootOffline() (still down) or bootSuccess()
// (back online) - never a blank frame in between.
export const runBootSequence = async (dispatch: any, { showLoadingState = true }: { showLoadingState?: boolean } = {}) => {
  // Only armed on the real cold-boot path - OfflineGateScreen's "Try Again"
  // (showLoadingState: false) already has its own local retrying-spinner
  // feedback, so there's nothing for this to add there.
  const slowTimer = showLoadingState
    ? setTimeout(() => dispatch(setBootSlow(true)), SLOW_BOOT_THRESHOLD_MS)
    : null;

  try {
    if (showLoadingState) {
      dispatch(bootStart());
    }

    // Checked before anything else - a cold launch with no internet at all
    // shouldn't sit through the (up to 15s) token-validation call's own
    // timeout before the user finds out; this is a much shorter, dedicated
    // probe. OfflineGateScreen's "Try Again" just re-runs this whole
    // function, and "Use in Offline Mode" calls continueOffline above
    // directly, bypassing this check on purpose.
    const online = await checkInternetConnectivity();
    dispatch(setOnlineStatus(online));
    if (!online) {
      dispatch(bootOffline());
      return;
    }

    // Fired now so its own network round-trip overlaps with the
    // token/profile checks below instead of running after them - resolved
    // just below, before any login/main routing decision, since a
    // mandatory update must block even a logged-out user from reaching
    // Login. A rejected fetch (any error) is swallowed here - this must
    // never be able to fail boot on its own, only an explicit
    // `updateRequired: true` from a successfully-parsed response does.
    const configPromise = dispatch(loadAppConfig()).catch(() => null);

    // Start timer for minimum splash screen duration
    const startTime = Date.now();
    const MIN_SPLASH_DURATION = 3000; // 3 seconds

    const token = await getToken('access_token');
    const onboarding = await AsyncStorage.getItem('onboarding_completed');

    const configResult: any = await configPromise;
    if (configResult?.payload?.update?.updateRequired) {
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
      dispatch(bootMandatoryUpdate());
      return;
    }

    const maintenanceEnabled = Boolean(configResult?.payload?.maintenance?.enabled);

    // If no token, user is not authenticated
    if (!token) {
      // Ensure minimum splash duration
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // A logged-out user has no journey to protect by definition.
      if (maintenanceEnabled) {
        dispatch(bootMaintenance());
        return;
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

      // Authenticated and confirmed valid - now safe to ask "does THIS
      // user specifically have something to protect" (an unauthenticated
      // or not-yet-validated token never reaches this call).
      let maintenanceBlocksEntry = false;
      if (maintenanceEnabled) {
        const hasJourney = await hasActiveJourneyOrUnknown();
        dispatch(setMaintenanceRestricted(hasJourney));
        maintenanceBlocksEntry = !hasJourney;
      }

      // Ensure minimum splash duration
      const elapsed = Date.now() - startTime;
      const remaining = MIN_SPLASH_DURATION - elapsed;
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      if (maintenanceBlocksEntry) {
        dispatch(bootMaintenance());
        return;
      }

      // Token is valid
      dispatch(
        bootSuccess({
          isAuthenticated: true,
          onboardingCompleted: onboarding === 'true',
          initialRoute: 'MainTabs',
        })
      );
    } catch (error: any) {
      // A network error (no internet, timeout, DNS failure, 5xx - anything
      // where the server never actually said "this token is invalid") must
      // NEVER destroy the session - opening the app offline is not the same
      // thing as being logged out. Only a genuine 401 from the server means
      // the token itself is invalid/expired. Same distinction
      // client.ts's response interceptor already makes for every other
      // request; this boot-time check was bypassing it with its own,
      // cruder "any error = log out" logic.
      if (error?.response?.status !== 401) {
        // The internet probe above already passed, so a failure here means
        // our backend is unreachable (down, 5xx, timeout) - not that the
        // device is offline. Connectivity state is deliberately left alone.
        const elapsed = Date.now() - startTime;
        const remaining = MIN_SPLASH_DURATION - elapsed;
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }

        // Trust the locally stored token and let the user into the app -
        // individual screens that need live data will fail/retry on their
        // own instead of the whole session being wiped just because this
        // one validation call couldn't reach the server.
        dispatch(
          bootSuccess({
            isAuthenticated: true,
            onboardingCompleted: onboarding === 'true',
            initialRoute: 'MainTabs',
          })
        );
        return;
      }

      // Token is genuinely invalid/expired (401) - clear it and send to login.
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
  } finally {
    if (slowTimer) clearTimeout(slowTimer);
  }
};
