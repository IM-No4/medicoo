import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medicoo_active_activity';
const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface TrackedActivity {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    progress?: number; // 0–1
    stack: string;
    screen: string;
    params?: Record<string, any>;
    timestamp: number;
}

export async function saveActivity(activity: Omit<TrackedActivity, 'timestamp'>): Promise<void> {
    try {
        const data: TrackedActivity = { ...activity, timestamp: Date.now() };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // silent fail – not critical
    }
}

export async function loadActivity(): Promise<TrackedActivity | null> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const data: TrackedActivity = JSON.parse(raw);
        // Auto-expire after 2 hours
        if (Date.now() - data.timestamp > EXPIRY_MS) {
            await clearActivity();
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export async function clearActivity(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
        // silent fail
    }
}
