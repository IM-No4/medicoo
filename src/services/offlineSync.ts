import { AppState, AppStateStatus } from 'react-native';
import { store } from '../redux/store';
import { syncOfflineQueue, loadCalendarData } from '../redux/slices/calendarSlice';
import { loadVitalRecords } from '../redux/slices/vitalsSlice';
import { loadGoalsFromServer } from '../redux/slices/goalsSlice';
import { loadOnDeviceSteps } from '../redux/slices/deviceSlice';
import { setOnlineStatus } from '../redux/slices/connectivitySlice';
import { loadProfileFromServer } from '../redux/slices/profileSlice';
import { triggerStaleResume } from '../redux/slices/appLifecycleSlice';
import { checkInternetConnectivity } from '../utils/connectivity';
import { getLocalDateString } from '../utils/dateUtils';

// How long the app can sit backgrounded before its cached data is treated
// as stale on return - long enough that a quick app-switch (checking a
// notification, copying an OTP) never triggers a refresh, short enough
// that anything genuinely left in the background for a while (appointment
// slots booked elsewhere, a medicine mark from another device, a goal
// nudged by someone else in the family) comes back current instead of
// silently showing what was true a while ago.
const BACKGROUND_REFRESH_THRESHOLD_MS = 60_000;

// The app's offline write-queue (medicine intake, vitals - see
// StorageService.addToSyncQueue) previously had NOTHING that ever actually
// triggered a sync attempt - syncOfflineQueue existed but was never
// dispatched anywhere, so a queued action just sat in AsyncStorage forever
// until something else happened to re-dispatch it. This is the missing
// trigger - and, on top of that, the specific "we just came back online"
// transition also re-pulls the main data screens show (goals, vitals,
// steps, today's calendar), not just the write queue: a screen that showed
// cached/offline data while disconnected should end up with live data once
// reconnected, without the user having to pull-to-refresh it themselves.
//
// Deliberately touches only redux state, never navigation - whatever
// screen the user is on when connectivity returns is exactly where they
// stay; this looks like nothing happened except the data quietly getting
// fresher underneath them.
//
// Ideally the "did we just come back online" transition would be driven by
// a real connectivity-change event (e.g. @react-native-community/netinfo),
// but that package couldn't be installed in this environment (no network
// access to npm). Using a short reachability probe on a timer instead -
// zero new dependencies, no native rebuild required:
//   - checked immediately once, in case a backlog/staleness already exists
//     from a previous offline session
//   - re-checked every time the app is foregrounded (the most common "I
//     just got my signal back" moment)
//   - re-checked every 45s as a fallback while the app stays open
let syncing = false;
// Starts false (assume online) rather than true - if the very first check
// finds we're already online, that's the common case and shouldn't trigger
// a redundant "just reconnected" full refresh on top of whatever the normal
// boot sequence already loaded.
let wasOffline = false;
// Set the moment the app leaves 'active' (see startOfflineSyncCoordinator
// below), cleared the moment it returns - null the rest of the time, so
// "was this backgrounded at all, and for how long" is answerable from a
// single value rather than needing a separate boolean alongside it.
let backgroundedAt: number | null = null;

// Shared by both "just reconnected after being offline" and "just resumed
// after sitting backgrounded a while" - the same real-server data can go
// stale either way, so both transitions pull the same refresh rather than
// each hand-rolling their own partial list.
function refreshLiveData() {
    store.dispatch(loadGoalsFromServer() as any);
    store.dispatch(loadVitalRecords() as any);
    store.dispatch(loadOnDeviceSteps() as any);
    store.dispatch(loadCalendarData(getLocalDateString()) as any);
    store.dispatch(loadProfileFromServer() as any);
}

// Exported (not just called internally on the interval/AppState triggers
// below) so OfflineHomeContent's pull-to-refresh can run this exact same
// check on demand - "check again right now" instead of waiting up to 45s
// for the next automatic pass. If it finds a real connection, isOnline
// flips in Redux and HomeScreen's own render switches out of the offline
// layout on its own - the pull handler doesn't need to know or care that
// happened, it just awaits this and stops spinning.
export async function attemptSync() {
    if (syncing) return;
    syncing = true;
    try {
        const online = await checkInternetConnectivity(3000);
        // Redux-visible connectivity state - so HomeScreen (and anything
        // else) can adapt its layout while already running, not just this
        // coordinator's own write-queue-flushing logic below.
        store.dispatch(setOnlineStatus(online));

        const justReconnected = online && wasOffline;
        wasOffline = !online;

        if (!online) return;

        // Always flush the write queue while online - not just on the
        // transition, since a write can fail and get queued again at any
        // moment (e.g. a brief blip) independent of this coordinator's own
        // view of online/offline.
        await store.dispatch(syncOfflineQueue() as any);

        if (justReconnected) {
            refreshLiveData();
        }
    } catch (error) {
        console.warn('[offlineSync] Sync attempt failed', error);
    } finally {
        syncing = false;
    }
}

export function startOfflineSyncCoordinator(): () => void {
    const intervalId = setInterval(attemptSync, 45_000);

    const handleAppStateChange = (state: AppStateStatus) => {
        if (state === 'active') {
            // Resolved before attemptSync() runs, since that reassigns
            // wasOffline as a side effect - reading it after would make an
            // online-the-whole-time-but-long-backgrounded resume look
            // identical to one that also reconnected.
            const wasBackgroundedLongEnough =
                backgroundedAt !== null && (Date.now() - backgroundedAt) >= BACKGROUND_REFRESH_THRESHOLD_MS;
            backgroundedAt = null;

            attemptSync();

            // A stale-length resume that also happened to reconnect already
            // got its refresh from attemptSync()'s own justReconnected
            // branch above - this only needs to cover the case that branch
            // doesn't: connection never dropped, so nothing else would have
            // refreshed this session's data on the way back in.
            if (wasBackgroundedLongEnough && !wasOffline) {
                refreshLiveData();
            }
            if (wasBackgroundedLongEnough) {
                store.dispatch(triggerStaleResume());
            }
        } else if (state === 'background') {
            backgroundedAt = Date.now();
        }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    attemptSync();

    return () => {
        clearInterval(intervalId);
        subscription.remove();
    };
}
