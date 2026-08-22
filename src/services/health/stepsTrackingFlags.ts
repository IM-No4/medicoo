import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Split out from healthConnectStepsService.ts / nativeStepsSyncService.ts /
// nativeStepsBackgroundTask.ts (all three need these flags) so none of them
// have to import each other for just a flag read - keeps that trio a clean
// one-directional chain instead of a cycle.
const isAndroid = Platform.OS === 'android';

const TRACKING_ENABLED_KEY = '@medicoo_health_connect_steps_enabled';
const NATIVE_WRITE_ENABLED_KEY = '@medicoo_native_steps_write_enabled';

// Whether the user has explicitly opted in to Health Connect step *reading*
// (prompted when they create a "steps" goal). Kept separate from the write
// flag below so a user who grants read but denies write/ACTIVITY_RECOGNITION
// keeps the already-shipped read-only behavior working, unregressed.
export async function isStepsTrackingEnabled(): Promise<boolean> {
    if (!isAndroid) return false;
    try {
        const value = await AsyncStorage.getItem(TRACKING_ENABLED_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

export async function setStepsTrackingEnabled(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(TRACKING_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {
        // silent fail - not critical
    }
}

// Whether Medicoo's own native step-counter sync is allowed to write into
// Health Connect - true only once both the Health Connect write permission
// and ACTIVITY_RECOGNITION have actually been granted.
export async function isNativeStepsWriteEnabled(): Promise<boolean> {
    if (!isAndroid) return false;
    try {
        const value = await AsyncStorage.getItem(NATIVE_WRITE_ENABLED_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}

export async function setNativeStepsWriteEnabled(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(NATIVE_WRITE_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch {
        // silent fail - not critical
    }
}
