import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medicoo_profile_summary';

// Just enough of the profile to personalize the app while offline (the
// greeting on OfflineHomeHeader) - not a general profile cache, so it's
// intentionally this small rather than mirroring the full API response.
export interface ProfileSummary {
    name: string | null;
}

export async function saveProfileSummary(summary: ProfileSummary): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
    } catch {
        // silent fail - not critical
    }
}

export async function loadProfileSummary(): Promise<ProfileSummary | null> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
