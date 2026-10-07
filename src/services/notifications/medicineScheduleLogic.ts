// Client-side port of the backend's MedicineSchedule.shouldTakeOnDate
// (models/MedicineSchedule.js) - needed so the local reminder scheduler can
// figure out which days a dose is actually due WITHOUT a network call. Keep
// this in exact lockstep with the backend method if that logic ever
// changes; it's deliberately a line-for-line mirror, not a reinterpretation.
export interface RecurringSchedule {
    scheduleType: string;
    startDate?: string;
    endDate?: string | null;
    selectedDays?: number[];
    intervalValue?: number;
    intervalType?: string;
    cycleDaysOn?: number;
    cycleDaysOff?: number;
    cycleStartDate?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldTakeOnDate(schedule: RecurringSchedule, dateStr: string): boolean {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const scheduleStartDate = new Date(schedule.startDate || dateStr);
    scheduleStartDate.setHours(0, 0, 0, 0);

    if (scheduleStartDate > targetDate) return false;

    if (schedule.endDate) {
        const scheduleEndDate = new Date(schedule.endDate);
        scheduleEndDate.setHours(23, 59, 59, 999);
        if (scheduleEndDate < targetDate) return false;
    }

    switch (schedule.scheduleType) {
        case 'Every Day':
            return true;

        case 'On Specific Days of the Week': {
            const dayOfWeek = targetDate.getDay();
            return (schedule.selectedDays || []).includes(dayOfWeek);
        }

        case 'Every Few Days': {
            const daysDiff = Math.floor((targetDate.getTime() - scheduleStartDate.getTime()) / DAY_MS);
            const intervalValue = schedule.intervalValue || 1;
            if (schedule.intervalType === 'Day') {
                return daysDiff % intervalValue === 0;
            }
            const weeksDiff = Math.floor(daysDiff / 7);
            return weeksDiff % intervalValue === 0 && daysDiff % 7 === 0;
        }

        case 'On a Cyclical Schedule': {
            // Client doesn't track a separate cycleStartDate field (see
            // AddMedicationScreen.tsx's payload) - same fallback the
            // backend method itself uses when one isn't set.
            const cycleStart = new Date(schedule.cycleStartDate || schedule.startDate || dateStr);
            cycleStart.setHours(0, 0, 0, 0);

            const daysSinceCycleStart = Math.floor((targetDate.getTime() - cycleStart.getTime()) / DAY_MS);
            if (daysSinceCycleStart < 0) return false;

            const cycleLength = (schedule.cycleDaysOn || 1) + (schedule.cycleDaysOff || 0);
            const positionInCycle = daysSinceCycleStart % cycleLength;
            return positionInCycle < (schedule.cycleDaysOn || 1);
        }

        case 'As Needed':
            // Matches getScheduledTimesForDate's own explicit carve-out -
            // "as needed" has no fixed times to remind about at all.
            return true;

        default:
            return false;
    }
}
