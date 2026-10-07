import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medicoo_medicine_schedules';

// Kept as `any[]` rather than importing ManageMedicationsScreen's MedSchedule
// type - that type lives in a screen file, not a shared module, and this
// cache is a plain last-known-good snapshot, not something that needs to be
// strictly typed against the screen's exact shape.
export async function saveMedicineSchedules(schedules: any[]): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {
        // silent fail - not critical
    }
}

export async function loadMedicineSchedules(): Promise<any[]> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const data = JSON.parse(raw);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}
