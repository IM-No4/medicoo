import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { deleteRecordsByUuids, getGrantedPermissions, initialize, insertRecords, readRecords, StepsRecord } from 'react-native-health-connect';
import { readRawStepCounter } from '@/modules/medicoo-step-counter/src';
import { loadConnectedDevice } from '../storage/deviceStorage';
import { isStepsTrackingEnabled, isNativeStepsWriteEnabled } from './stepsTrackingFlags';

const SYNC_STATE_KEY = '@medicoo_native_step_sync_state';
const REPAIR_FLAG_KEY = '@medicoo_steps_hourly_repair_v1';
const APP_PACKAGE = 'com.medicootech.medicoo'; // the data origin of the records this app writes
const HOUR_MS = 60 * 60 * 1000;

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

// Health Connect's aggregate SUMS every record overlapping a time range - a record whose interval covers several hours counts IN FULL in every
// bucket it touches. One record from the last sync to now (hours, if the phone slept) made the history screen show the same number in every
// 3-hour block of the day, and let a record straddling midnight bleed into the wrong day. So the steps are split proportionally by elapsed
// time at EVERY local hour boundary in the range: no record is longer than one clock hour, so each bucket gets its own share. (The sensor only
// gives a running total, so within a gap the steps are spread evenly; that is the most that can be known.)
export function splitAtLocalHours(start: Date, end: Date, totalDelta: number): StepsRecord[] {
    const totalMs = end.getTime() - start.getTime();
    if (totalMs <= 0) return [];

    // Hour boundaries inside (start, end)
    const edges: number[] = [start.getTime()];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate(), start.getHours() + 1);
    while (cursor.getTime() < end.getTime()) {
        edges.push(cursor.getTime());
        cursor.setHours(cursor.getHours() + 1);
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

/**
 * One-time repair: records this app wrote earlier can span many hours (see splitAtLocalHours), which makes the history screen repeat the
 * same figure in every block they touch. Each such record of the last 35 days is replaced by hourly pieces carrying the same total. A new record is
 * written BEFORE the old one is deleted (and removed again if the delete fails), so steps are never lost and never doubled. Does nothing, and
 * tries again next time, when Health Connect or its permissions are not there yet.
 */
export async function repairLongStepRecordsOnce(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
        if (await AsyncStorage.getItem(REPAIR_FLAG_KEY)) return;
        if (!(await initialize())) return;
        const granted = await getGrantedPermissions();
        const can = (accessType: string) => granted.some((p: any) => p.recordType === 'Steps' && p.accessType === accessType);
        if (!can('read') || !can('write')) return;

        const now = new Date();
        const since = new Date(now.getTime() - 35 * 24 * HOUR_MS);
        const long: { id: string; start: Date; end: Date; count: number }[] = [];
        let pageToken: string | undefined;
        do {
            const page: any = await readRecords('Steps', {
                timeRangeFilter: { operator: 'between', startTime: since.toISOString(), endTime: now.toISOString() },
                dataOriginFilter: [APP_PACKAGE],
                ascendingOrder: true,
                pageSize: 500,
                pageToken,
            });
            (page.records || []).forEach((r: any) => {
                const start = new Date(r.startTime);
                const end = new Date(r.endTime);
                const id = r.metadata && r.metadata.id;
                if (id && r.count > 0 && end.getTime() - start.getTime() > HOUR_MS + 5 * 60 * 1000) long.push({ id, start, end, count: Number(r.count) });
            });
            pageToken = page.pageToken || undefined;
        } while (pageToken);

        for (const record of long) {
            const pieces = splitAtLocalHours(record.start, record.end, record.count);
            if (pieces.length < 2) continue;
            // eslint-disable-next-line no-await-in-loop
            const newIds = await insertRecords(pieces);
            try {
                // eslint-disable-next-line no-await-in-loop
                await deleteRecordsByUuids('Steps', [record.id], []);
            } catch (error) {
                // could not remove the original: take the new pieces back out rather than count the steps twice
                // eslint-disable-next-line no-await-in-loop
                await deleteRecordsByUuids('Steps', newIds, []).catch(() => undefined);
                throw error;
            }
        }
        await AsyncStorage.setItem(REPAIR_FLAG_KEY, new Date().toISOString());
    } catch (error) {
        console.warn('[nativeStepsSyncService] Step history repair did not finish; it will be tried again', error);
    }
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

    await repairLongStepRecordsOnce();

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
                // The Health Connect client must be initialised in THIS process before it is used. A background run (or the first run after
                // the app process was recreated) has not been through the screens that initialise it, and insertRecords then throws
                // "client is not initialized". Initialising again is harmless. Nothing is recorded as synced if it cannot be set up, so the
                // same steps are written on the next run.
                const ready = await initialize();
                if (!ready) {
                    console.warn('[nativeStepsSyncService] Health Connect is not available; steps will be written on a later run');
                    return 'failed';
                }
                await insertRecords(splitAtLocalHours(start, now, delta));
            } catch (error) {
                console.warn('[nativeStepsSyncService] Failed to write steps to Health Connect', error);
                return 'failed';
            }
        }
    }

    await setSyncState({ lastRawCounter: rawNow, lastWriteTime: now.toISOString() });
    return 'success';
}
