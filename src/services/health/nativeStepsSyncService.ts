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

// Health Connect's aggregate SUMS every record overlapping a time range - inserting one record whose interval straddles local midnight
// would let its whole step count bleed into "today" even if most of those steps actually happened yesterday (or vice versa). So the
// steps are split proportionally by elapsed time at EVERY local midnight in the range (a phone that was not synced for a few days has
// several), which keeps each day's share close to what really happened.
function splitAtLocalMidnight(start: Date, end: Date, totalDelta: number): StepsRecord[] {
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return [];

    // Day boundaries inside (start, end)
    const edges: number[] = [start.getTime()];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
    while (cursor.getTime() < end.getTime()) {
        edges.push(cursor.getTime());
        cursor.setDate(cursor.getDate() + 1);
    }
    edges.push(end.getTime());

    const records: StepsRecord[] = [];
    let assigned = 0;
    for (let i = 0; i < edges.length - 1; i += 1) {
        const isLast = i === edges.length - 2;
        const share = isLast ? totalDelta - assigned : Math.round((totalDelta * (edges[i + 1] - edges[i])) / totalMs);
        assigned += share;
        if (share > 0) {
            records.push({
                recordType: 'Steps',
                startTime: new Date(edges[i]).toISOString(),
                endTime: new Date(edges[i + 1]).toISOString(),
                count: share,
            });
        }
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
