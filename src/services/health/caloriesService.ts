import { getGrantedPermissions, getSdkStatus, initialize, aggregateRecord, SdkAvailabilityStatus } from 'react-native-health-connect';
import { isHealthConnectSupported, isStepsTrackingEnabled } from './healthConnectStepsService';
import { getProfileDetails } from '../api/user.api';

const DEFAULT_WEIGHT_KG = 70;

// Reference point widely cited by pedometer/fitness apps: a ~73kg adult
// walking at a normal pace burns roughly 100 kcal per 2,000 steps
// (~0.05 kcal/step), scaled linearly by body weight. Not lab-grade, but a
// meaningful number instead of a permanent "--" when no fitness app/device
// is actually providing real calorie data.
function estimateCaloriesFromSteps(steps: number, weightKg: number): number {
    return Math.round(steps * 0.05 * (weightKg / 73));
}

// Reads the user's weight from their health profile for a per-person
// estimate rather than a flat constant - falls back to an average adult
// weight if the profile has none set (new users) or the request fails.
// Cached in-memory for the process lifetime since it rarely changes and
// this can be called on every steps refresh.
let cachedWeightKg: number | null = null;
async function getUserWeightKg(): Promise<number> {
    if (cachedWeightKg != null) return cachedWeightKg;
    try {
        const profile = await getProfileDetails();
        const parsed = profile?.weight ? parseFloat(profile.weight) : NaN;
        cachedWeightKg = !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_WEIGHT_KG;
    } catch {
        cachedWeightKg = DEFAULT_WEIGHT_KG;
    }
    return cachedWeightKg;
}

// Real calorie data, if Health Connect already has some for today - either
// from another app (Samsung Health, Google Fit, a wearable's companion
// app), or from Android's own platform-level basal metabolic rate tracking
// (dataOrigins "_platform"), which runs continuously in the background and
// legitimately makes "today so far" much larger than an activity-only
// estimate would be. Reuses the same read-permission grant as steps
// (requested together in one prompt, see healthConnectStepsService.ts).
async function getTodayCaloriesFromHealthConnect(): Promise<number | null> {
    if (!isHealthConnectSupported) return null;

    const enabled = await isStepsTrackingEnabled();
    if (!enabled) return null;

    try {
        const status = await getSdkStatus();
        if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return null;

        const initialized = await initialize();
        if (!initialized) return null;

        const granted = await getGrantedPermissions();
        const hasPermission = granted.some((p) => p.recordType === 'TotalCaloriesBurned');
        if (!hasPermission) return null;

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const result = await aggregateRecord({
            recordType: 'TotalCaloriesBurned',
            timeRangeFilter: {
                operator: 'between',
                startTime: startOfToday.toISOString(),
                endTime: now.toISOString(),
            },
        });

        return result?.ENERGY_TOTAL?.inKilocalories ?? null;
    } catch (error) {
        console.warn('[caloriesService] Failed to read calories from Health Connect', error);
        return null;
    }
}

// Today's calorie burn: real Health Connect data if another app/device has
// actually written some, otherwise a weight-based estimate from today's
// step count. Returns null only when there's truly nothing to show (no HC
// data AND no steps yet today).
export async function getTodayCalories(todaySteps: number): Promise<number | null> {
    const fromHealthConnect = await getTodayCaloriesFromHealthConnect();
    if (fromHealthConnect != null && fromHealthConnect > 0) {
        return Math.round(fromHealthConnect);
    }

    if (todaySteps <= 0) return null;

    const weightKg = await getUserWeightKg();
    return estimateCaloriesFromSteps(todaySteps, weightKg);
}
