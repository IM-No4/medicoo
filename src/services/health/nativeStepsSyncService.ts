import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { insertRecords, StepsRecord } from 'react-native-health-connect';
import { readRawStepCounter } from '@/modules/medicoo-step-counter/src';
import { loadConnectedDevice } from '../storage/deviceStorage';
import { isStepsTrackingEnabled, isNativeStepsWriteEnabled } from './stepsTrackingFlags';

const SYNC_STATE_KEY = '@medicoo_native_step_sync_state';

interface SyncState {
    // Raw TYPE_STEP_COUNTER value (cumulative since last device boot) as of
    // the last successful sync.
    lastRawCounter: number;
    // When that value was captured - the start of the next incremental
    // write's time range.
    lastWriteTime: string; // ISO 8601
}

async function getSyncState(): Promise<SyncState | null> {
    try {
        const raw = await AsyncStorage.getItem(SYNC_STATE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as SyncState;
    } catch {
        return null;
    }
}

async function setSyncState(state: SyncState): Promise<void> {
    try {
        await AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(state));
    } catch {
        // silent fail - not critical, worst case the next sync recomputes
        // a delta against a slightly stale baseline
    }
}

// Health Connect's aggregate SUMS every record overlapping a time range -
// inserting one record whose interval straddles local midnight would let
// its whole step count bleed into "today" even if most of those steps
// actually happened yesterday (or vice versa). Splitting proportionally by
// elapsed time bounds that error to a few minutes' worth of steps instead
// of the whole delta.
function splitAtLocalMidnight(start: Date, end: Date, totalDelta: number): StepsRecord[] {
    const midnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    if (start.getTime() >= midnight.getTime()) {
        return [{ recordType: 'Steps', startTime: start.toISOString(), endTime: end.toISOString(), count: totalDelta }];
    }

    const totalMs = end.getTime() - start.getTime();
    const preMs = midnight.getTime() - start.getTime();
    const preSteps = totalMs > 0 ? Math.round((totalDelta * preMs) / totalMs) : 0;
    const postSteps = totalDelta - preSteps;

    const records: StepsRecord[] = [];
    if (preSteps > 0) {
        records.push({ recordType: 'Steps', startTime: start.toISOString(), endTime: midnight.toISOString(), count: preSteps });
    }
    if (postSteps > 0) {
        records.push({ recordType: 'Steps', startTime: midnight.toISOString(), endTime: end.toISOString(), count: postSteps });
    }
    return records;
}

export type NativeStepsSyncResult = 'success' | 'skipped' | 'failed';

// Samples the raw step-counter sensor and writes any new steps since the
// last sync into Health Connect as an incremental record - never the day's
// running total (that would massively over-count once summed with every
// other sync's own insert). Safe to call frequently: it's a fast no-op
// whenever tracking/write isn't enabled or a fitness device is linked, and
// intentionally reads that gate straight from disk (not the redux store)
// since a background-task execution of this file never boots the app or
// hydrates redux.
export async function runNativeStepsSync(): Promise<NativeStepsSyncResult> {
    if (Platform.OS !== 'android') return 'skipped';
    if (!(await isStepsTrackingEnabled())) return 'skipped';
    if (!(await isNativeStepsWriteEnabled())) return 'skipped';

    const connectedDevice = await loadConnectedDevice();
    if (connectedDevice) return 'skipped';

    const rawNow = await readRawStepCounter();
    if (rawNow == null) {
        console.warn('[nativeStepsSyncService] failed: readRawStepCounter returned null (no sensor, or read timed out)');
        return 'failed';
    }

    const now = new Date();
    const prev = await getSyncState();

    if (!prev) {
        // First run ever: no baseline to diff against. rawNow could be
        // "steps since a boot weeks ago" - writing that whole number as if
        // it happened in this window would be nonsense. Just record a
        // baseline; the next run (>=15 min later) has a real, bounded delta.
        await setSyncState({ lastRawCounter: rawNow, lastWriteTime: now.toISOString() });
        return 'success';
    }

    // TYPE_STEP_COUNTER resets to 0 on reboot. If it went down, a reboot
    // happened between syncs - steps between the last sync and the reboot
    // are unrecoverable (inherent sensor limitation, not fixed here).
    // Treat rawNow itself as "steps since reboot up to now."
    const rebooted = rawNow < prev.lastRawCounter;
    const delta = rebooted ? rawNow : rawNow - prev.lastRawCounter;

    if (delta > 0) {
        const start = new Date(prev.lastWriteTime);
        if (now.getTime() > start.getTime()) {
            try {
                await insertRecords(splitAtLocalMidnight(start, now, delta));
            } catch (error) {
                console.warn('[nativeStepsSyncService] Failed to write steps to Health Connect', error);
                return 'failed';
            }
        }
    }

    await setSyncState({ lastRawCounter: rawNow, lastWriteTime: now.toISOString() });
    return 'success';
}
