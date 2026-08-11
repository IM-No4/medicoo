import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal } from '../../redux/slices/goalsSlice';

const STORAGE_KEY = '@medicoo_goals';

export async function saveGoals(goals: Goal[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {
        // silent fail - not critical
    }
}

export async function loadGoals(): Promise<Goal[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}
