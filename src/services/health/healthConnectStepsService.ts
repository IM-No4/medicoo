import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  requestPermission,
  aggregateRecord,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

const TRACKING_ENABLED_KEY = '@medicoo_health_connect_steps_enabled';
const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

// Deep-links into the Play Store app if installed, falls back to the web
// listing otherwise - same pattern as any other "open this app" action.
export function openHealthConnectInPlayStore(): void {
  Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`).catch(() => {
    Linking.openURL(`https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`);
  });
}

export const isHealthConnectSupported = Platform.OS === 'android';

// Whether the user has explicitly opted in to Health Connect step tracking
// (prompted when they create a "steps" goal - see enableStepsTracking).
// This is our own record of intent, checked before any Health Connect call
// so we never silently re-surface a permission prompt the user didn't ask
// for on this visit.
export async function isStepsTrackingEnabled(): Promise<boolean> {
  if (!isHealthConnectSupported) return false;
  try {
    const value = await AsyncStorage.getItem(TRACKING_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

async function setStepsTrackingEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(TRACKING_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // silent fail - not critical
  }
}

export type EnableStepsTrackingResult =
  | { success: true }
  | { success: false; reason: 'unsupported' | 'not_installed' | 'update_required' | 'permission_denied' };

// Called when the user creates a "steps" goal and agrees to enable tracking.
// Walks through SDK availability -> init -> permission request, and only
// persists the opt-in flag if every step actually succeeded - a partial
// failure here must never be recorded as "tracking enabled".
export async function enableStepsTracking(): Promise<EnableStepsTrackingResult> {
  if (!isHealthConnectSupported) return { success: false, reason: 'unsupported' };

  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
      return { success: false, reason: 'update_required' };
    }
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      // Below Android 14, Health Connect is a separate Play Store app - this
      // is the common case, not just a generic failure.
      return { success: false, reason: 'not_installed' };
    }

    const initialized = await initialize();
    if (!initialized) return { success: false, reason: 'not_installed' };

    const granted = await requestPermission([{ accessType: 'read', recordType: 'Steps' }]);
    const hasStepsPermission = granted.some((p) => p.recordType === 'Steps');
    if (!hasStepsPermission) {
      return { success: false, reason: 'permission_denied' };
    }

    await setStepsTrackingEnabled(true);
    return { success: true };
  } catch (error) {
    console.warn('[healthConnectStepsService] Failed to enable step tracking', error);
    return { success: false, reason: 'not_installed' };
  }
}

// Lets a user turn tracking back off from within the app (e.g. disabling
// the steps goal) - only clears our own opt-in record. The OS-level
// permission itself can only really be revoked from Health Connect's own
// settings (see react-native-health-connect's revokeAllPermissions docs on
// why the library discourages using it as an in-app "disconnect" toggle).
export async function disableStepsTracking(): Promise<void> {
  await setStepsTrackingEnabled(false);
}

// Reads today's aggregated step count from Health Connect - a real "steps
// since midnight" total maintained by whatever app/OS component is writing
// to Health Connect, not something estimated or inferred by this app.
export async function getTodayHealthConnectSteps(): Promise<number | null> {
  if (!isHealthConnectSupported) return null;

  const enabled = await isStepsTrackingEnabled();
  if (!enabled) return null;

  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return null;

    const initialized = await initialize();
    if (!initialized) return null;

    const granted = await getGrantedPermissions();
    const hasStepsPermission = granted.some((p) => p.recordType === 'Steps');
    if (!hasStepsPermission) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfToday.toISOString(),
        endTime: now.toISOString(),
      },
    });

    return result?.COUNT_TOTAL ?? 0;
  } catch (error) {
    console.warn('[healthConnectStepsService] Failed to read step count', error);
    return null;
  }
}
