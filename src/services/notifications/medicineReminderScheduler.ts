import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMedicineSchedules } from '../api/medicine.api';
import { loadMedicineSchedules, saveMedicineSchedules } from '../storage/medicineSchedulesStorage';
import { getLocalDateString } from '../../utils/dateUtils';
import { shouldTakeOnDate, RecurringSchedule } from './medicineScheduleLogic';

// Local (on-device) medication reminders - scheduled via the OS's own
// notification scheduler, so they fire at the right time regardless of
// whether the app has a network connection right then. This runs alongside
// the existing server-side push (scripts/medicineReminders.js's cron +
// FCM) rather than replacing it - the server push still drives the in-app
// notification history/list; this is what actually alerts the user the
// moment a dose is due, connectivity or not.
//
// A rolling window (not a single far-future recurring rule) because:
//   - iOS caps an app at ~64 pending scheduled notifications at once, and a
//     handful of medicines x multiple times/day x an open-ended recurrence
//     would blow past that fast.
//   - schedules can be edited/deleted/paused, and a short window is cheap
//     to fully re-generate from scratch every time that happens, rather
//     than trying to surgically patch a huge pre-scheduled batch.
const WINDOW_DAYS = 3;
const REMINDER_TAG = 'medicine_reminder';
const CHANNEL_ID = 'medicine-reminders';

interface MedicineScheduleForReminders extends RecurringSchedule {
    _id: string;
    medicineName: string;
    dosage?: string;
    isActive: boolean;
    isDeleted?: boolean;
    times?: string[];
    shape?: string;
    color?: string;
    leftColor?: string;
    rightColor?: string;
}

// Accepts "8:00 AM", "08:00 am", "8:00am" etc - whatever
// toLocaleTimeString/the time picker actually produced (see
// ScheduleStep.tsx) isn't guaranteed to be one exact casing/spacing.
function parseTimeString(time: string): { hours: number; minutes: number } | null {
    const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
    if (!match) return null;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toLowerCase();

    if (meridiem === 'pm' && hours !== 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    return { hours, minutes };
}

export async function ensureNotificationPermissions(): Promise<boolean> {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
}

async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
    });
}

async function cancelExistingReminders() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter((n) => n.content.data?.type === REMINDER_TAG);
    await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

// Re-derives the full rolling window from scratch every call - see the
// module comment for why this is simpler/safer than surgically patching an
// existing schedule. Call this after boot, and after any medication
// create/update/delete (both the online-success path and the
// offline-queued one - see AddMedicationScreen.tsx).
export async function scheduleLocalMedicineReminders(schedules: MedicineScheduleForReminders[]): Promise<void> {
    try {
        const activeSchedules = schedules.filter((s) => s.isActive && !s.isDeleted && s.scheduleType !== 'As Needed');

        // Cancel first regardless - covers the "last medicine just got
        // deleted" case - but don't bother prompting for permission (this
        // runs unconditionally on every boot) unless there's actually
        // something that would need it. A user with no medications set up
        // yet shouldn't see a notification permission dialog before they've
        // ever touched this feature.
        if (activeSchedules.length === 0) {
            await cancelExistingReminders();
            return;
        }

        const granted = await ensureNotificationPermissions();
        if (!granted) return;

        await ensureAndroidChannel();
        await cancelExistingReminders();

        const now = new Date();

        for (let dayOffset = 0; dayOffset < WINDOW_DAYS; dayOffset++) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + dayOffset);
            const dateStr = getLocalDateString(targetDate);

            for (const schedule of activeSchedules) {
                if (!schedule.times || schedule.times.length === 0) continue;
                if (!shouldTakeOnDate(schedule, dateStr)) continue;

                for (const time of schedule.times) {
                    const parsed = parseTimeString(time);
                    if (!parsed) continue;

                    const fireDate = new Date(targetDate);
                    fireDate.setHours(parsed.hours, parsed.minutes, 0, 0);

                    // Already past - nothing to schedule (covers "today,
                    // earlier times" on the first pass through the window).
                    if (fireDate.getTime() <= now.getTime()) continue;

                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: 'Medicine reminder',
                            // Same "name (dosage)" pairing used everywhere
                            // else a dose is mentioned (MedicineCard's
                            // confirm dialog, the server push's own copy).
                            body: `It's time to take ${schedule.medicineName}${schedule.dosage ? ` (${schedule.dosage})` : ''}.`,
                            sound: 'default',
                            data: {
                                type: REMINDER_TAG,
                                scheduleId: schedule._id,
                                date: dateStr,
                                time,
                            },
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DATE,
                            date: fireDate,
                            channelId: CHANNEL_ID,
                        },
                    });
                }
            }
        }
    } catch (error) {
        // Never let a scheduling hiccup surface to the user - worst case,
        // this dose just relies on the server push instead.
        console.warn('[medicineReminderScheduler] Failed to schedule local reminders', error);
    }
}

export async function cancelAllLocalMedicineReminders(): Promise<void> {
    try {
        await cancelExistingReminders();
    } catch (error) {
        console.warn('[medicineReminderScheduler] Failed to cancel local reminders', error);
    }
}

// Convenience wrapper for the common case (boot, and anywhere else that
// doesn't already have a freshly-fetched schedule list to hand in
// directly) - tries the server first for the most accurate/complete list,
// falls back to the last-known cache (same one ManageMedicationsScreen
// reads) if that fails, e.g. offline.
export async function refreshAndScheduleMedicineReminders(): Promise<void> {
    try {
        const res = await getMedicineSchedules();
        const list = res?.data ?? res ?? [];
        await saveMedicineSchedules(list);
        await scheduleLocalMedicineReminders(list);
    } catch {
        const cached = await loadMedicineSchedules();
        await scheduleLocalMedicineReminders(cached);
    }
}
