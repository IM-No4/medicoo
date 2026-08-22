import { Linking, PermissionsAndroid, Platform } from 'react-native';
import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  requestPermission,
  aggregateRecord,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import {
  isStepsTrackingEnabled,
  setStepsTrackingEnabled,
  setNativeStepsWriteEnabled,
} from './stepsTrackingFlags';
import {
  ensureNativeStepsBackgroundTaskRegistered,
  unregisterNativeStepsBackgroundTask,
} from './nativeStepsBackgroundTask';

export { isStepsTrackingEnabled };

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';

// Deep-links into the Play Store app if installed, falls back to the web
// listing otherwise - same pattern as any other "open this app" action.
export function openHealthConnectInPlayStore(): void {
  Linking.openURL(`market://details?id=${HEALTH_CONNECT_PACKAGE}`).catch(() => {
    Linking.openURL(`https://play.google.com/store/apps/details?id=${HEALTH_CONNECT_PACKAGE}`);
  });
}

export const isHealthConnectSupported = Platform.OS === 'android';

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

    // Requesting read+write together shows one combined Health Connect
    // permission prompt instead of several. Calories read is bundled in
    // here too (see caloriesService.ts) so calorie burn can show real
    // data from another app/device if any exists, without a second prompt.
    const granted = await requestPermission([
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'write', recordType: 'Steps' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
    ]);
    const hasReadPermission = granted.some((p) => p.recordType === 'Steps' && p.accessType === 'read');
    const hasWritePermission = granted.some((p) => p.recordType === 'Steps' && p.accessType === 'write');
    if (!hasReadPermission) {
      return { success: false, reason: 'permission_denied' };
    }

    await setStepsTrackingEnabled(true);

    // Native background step counting (see nativeStepsSyncService.ts) is a
    // bonus on top of read-tracking, not required for it - a user who
    // denies write/ACTIVITY_RECOGNITION still gets the already-shipped
    // read-only "show whatever Health Connect has" behavior, unregressed.
    if (hasWritePermission) {
      const activityRecognitionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );
      if (activityRecognitionResult === PermissionsAndroid.RESULTS.GRANTED) {
        await setNativeStepsWriteEnabled(true);
        await ensureNativeStepsBackgroundTaskRegistered();
      }
    }

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
  await setNativeStepsWriteEnabled(false);
  await unregisterNativeStepsBackgroundTask();
}

// Shared readiness check (opt-in flag + SDK + init + granted permission) -
// every Health Connect steps read goes through this first so a missing
// permission or uninitialized SDK fails the same way everywhere.
async function ensureHealthConnectReady(): Promise<boolean> {
  if (!isHealthConnectSupported) return false;

  const enabled = await isStepsTrackingEnabled();
  if (!enabled) return false;

  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;

    const initialized = await initialize();
    if (!initialized) return false;

    const granted = await getGrantedPermissions();
    return granted.some((p) => p.recordType === 'Steps');
  } catch (error) {
    console.warn('[healthConnectStepsService] Failed readiness check', error);
    return false;
  }
}

// Reads today's aggregated step count from Health Connect - a real "steps
// since midnight" total maintained by whatever app/OS component is writing
// to Health Connect, not something estimated or inferred by this app.
export async function getTodayHealthConnectSteps(): Promise<number | null> {
  const ready = await ensureHealthConnectReady();
  if (!ready) return null;

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return await aggregateStepsInRange(startOfToday, now);
  } catch (error) {
    console.warn('[healthConnectStepsService] Failed to read step count', error);
    return null;
  }
}

async function aggregateStepsInRange(start: Date, end: Date): Promise<number> {
  if (start >= end) return 0;
  try {
    const result = await aggregateRecord({
      recordType: 'Steps',
      timeRangeFilter: {
        operator: 'between',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
    return result?.COUNT_TOTAL ?? 0;
  } catch (error) {
    console.warn('[healthConnectStepsService] Failed to aggregate step range', error);
    return 0;
  }
}

export type StepsRangeType = 'day' | 'week' | 'month' | 'year';

export interface StepsBucket {
  label: string;
  value: number;
}

export interface StepsRangeData {
  buckets: StepsBucket[];
  periodLabel: string;
  total: number;
  canGoNext: boolean;
  // Index of the bucket containing "now", or null if the viewed period
  // doesn't include the current moment (e.g. a past week).
  currentIndex: number | null;
  // Average is over buckets whose window has actually started - future
  // buckets in an in-progress period (e.g. Sep-Dec of the current year)
  // are real zeros for "steps so far", but averaging them in would understate
  // the real per-bucket average rather than reflect it.
  average: number;
  // How many of those started buckets have any steps logged at all.
  activeCount: number;
  elapsedCount: number;
  bestBucket: StepsBucket | null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Monday-start week, matching the reference "Mon..Sun" layout.
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun .. 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = startOfDay(d);
  monday.setDate(monday.getDate() + diffToMonday);
  return monday;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHour12(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  let h = hour % 12;
  if (h === 0) h = 12;
  return `${h}${period}`;
}

interface BucketBoundary {
  start: Date;
  end: Date;
  label: string;
}

// Every bucket is a real, non-overlapping time window - "8 bars" for a day
// means 8 real 3-hour aggregate queries, not a guess split from one total.
function buildBucketBoundaries(rangeType: StepsRangeType, anchorDate: Date): BucketBoundary[] {
  const boundaries: BucketBoundary[] = [];

  if (rangeType === 'day') {
    const dayStart = startOfDay(anchorDate);
    for (let i = 0; i < 8; i++) {
      const start = new Date(dayStart);
      start.setHours(i * 3);
      const end = new Date(dayStart);
      end.setHours((i + 1) * 3);
      boundaries.push({ start, end, label: formatHour12(i * 3) });
    }
  } else if (rangeType === 'week') {
    const weekStart = startOfWeek(anchorDate);
    for (let i = 0; i < 7; i++) {
      const start = new Date(weekStart);
      start.setDate(start.getDate() + i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      boundaries.push({ start, end, label: WEEKDAY_LABELS[i] });
    }
  } else if (rangeType === 'month') {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 1);
    let cursor = new Date(monthStart);
    while (cursor < monthEnd) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 7);
      if (end > monthEnd) end.setTime(monthEnd.getTime());
      boundaries.push({ start, end, label: String(start.getDate()) });
      cursor = end;
    }
  } else {
    const year = anchorDate.getFullYear();
    for (let i = 0; i < 12; i++) {
      boundaries.push({
        start: new Date(year, i, 1),
        end: new Date(year, i + 1, 1),
        label: MONTH_LABELS[i],
      });
    }
  }

  return boundaries;
}

function buildPeriodLabel(rangeType: StepsRangeType, anchorDate: Date): string {
  if (rangeType === 'day') {
    const today = startOfDay(new Date());
    if (startOfDay(anchorDate).getTime() === today.getTime()) return 'Today';
    return `${MONTH_LABELS[anchorDate.getMonth()]} ${anchorDate.getDate()}, ${anchorDate.getFullYear()}`;
  }
  if (rangeType === 'week') {
    const weekStart = startOfWeek(anchorDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const startLabel = `${MONTH_LABELS[weekStart.getMonth()]} ${weekStart.getDate()}`;
    const endLabel = sameMonth ? `${weekEnd.getDate()}` : `${MONTH_LABELS[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
    return `${startLabel} - ${endLabel}, ${weekEnd.getFullYear()}`;
  }
  if (rangeType === 'month') {
    return `${MONTH_LABELS[anchorDate.getMonth()]} ${anchorDate.getFullYear()}`;
  }
  return `${anchorDate.getFullYear()}`;
}

// Moves the anchor by one whole period - used both internally (to know
// whether "next" would cross into the future) and by the history screen's
// prev/next controls.
export function shiftAnchorDate(rangeType: StepsRangeType, anchorDate: Date, direction: 1 | -1): Date {
  const next = new Date(anchorDate);
  if (rangeType === 'day') next.setDate(next.getDate() + direction);
  else if (rangeType === 'week') next.setDate(next.getDate() + direction * 7);
  else if (rangeType === 'month') next.setMonth(next.getMonth() + direction);
  else next.setFullYear(next.getFullYear() + direction);
  return next;
}

// Reads a real bucketed step history from Health Connect for the given
// range - each bucket is its own aggregate query over a real time window.
// Buckets entirely in the future (e.g. Thu-Sun of the current, in-progress
// week) are left at 0 without a wasted query; the bucket "now" falls inside
// is capped at the current time so it reflects steps-so-far.
export async function getStepsRange(
  rangeType: StepsRangeType,
  anchorDate: Date = new Date()
): Promise<StepsRangeData | null> {
  const ready = await ensureHealthConnectReady();
  if (!ready) return null;

  const now = new Date();
  const boundaries = buildBucketBoundaries(rangeType, anchorDate);

  const results = await Promise.all(
    boundaries.map(async ({ start, end }) => {
      if (start > now) return { value: 0, elapsed: false };
      const value = await aggregateStepsInRange(start, end > now ? now : end);
      return { value, elapsed: true };
    })
  );

  const buckets: StepsBucket[] = boundaries.map((b, i) => ({ label: b.label, value: results[i].value }));
  const currentIndex = boundaries.findIndex((b) => b.start <= now && now < b.end);

  const elapsed = results.filter((r) => r.elapsed);
  const elapsedTotal = elapsed.reduce((sum, r) => sum + r.value, 0);
  const average = elapsed.length > 0 ? Math.round(elapsedTotal / elapsed.length) : 0;
  const activeCount = elapsed.filter((r) => r.value > 0).length;

  let bestBucket: StepsBucket | null = null;
  buckets.forEach((b, i) => {
    if (results[i].elapsed && b.value > 0 && (bestBucket === null || b.value > bestBucket.value)) {
      bestBucket = b;
    }
  });

  const nextAnchor = shiftAnchorDate(rangeType, anchorDate, 1);
  const nextBoundaries = buildBucketBoundaries(rangeType, nextAnchor);

  return {
    buckets,
    periodLabel: buildPeriodLabel(rangeType, anchorDate),
    total: elapsedTotal,
    canGoNext: nextBoundaries[0].start <= now,
    currentIndex: currentIndex === -1 ? null : currentIndex,
    average,
    activeCount,
    elapsedCount: elapsed.length,
    bestBucket,
  };
}
