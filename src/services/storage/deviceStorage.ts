import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConnectedDevice } from '../../redux/slices/deviceSlice';

const STORAGE_KEY = '@medicoo_connected_device';

// Persists which fitness device (if any) is linked, so it survives app
// restarts - deviceSlice's redux state alone resets to null on every cold
// launch (no redux-persist in this app), which would otherwise make the
// "skip native step tracking if a device is linked" gate
// (nativeStepsSyncService.ts) wrong immediately after opening the app.
export async function saveConnectedDevice(device: ConnectedDevice | null): Promise<void> {
    try {
        if (device) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(device));
        } else {
            await AsyncStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // silent fail - not critical
    }
}

export async function loadConnectedDevice(): Promise<ConnectedDevice | null> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as ConnectedDevice;
    } catch {
        return null;
    }
}
