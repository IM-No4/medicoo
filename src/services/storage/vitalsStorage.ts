import AsyncStorage from '@react-native-async-storage/async-storage';
import type { VitalRecord } from '../../redux/slices/vitalsSlice';

const STORAGE_KEY = '@medicoo_vitals';

export async function saveVitals(records: VitalRecord[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
        // silent fail - not critical
    }
}

export async function loadVitals(): Promise<VitalRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}
