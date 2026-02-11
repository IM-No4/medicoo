import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchCalendarData } from '../../services/api/calendar.api';
import { createMedicineSchedule, markMedicineIntake as markMedicineIntakeApi } from '../../services/api/medicine.api';
import { StorageService } from '../../services/storage';

/* =======================
   Types
======================= */

export interface CalendarProgress {
  taken: number;
  total: number;
}

export interface CalendarData {
  date: string;
  appointments: any[];
  medicines: any[];
  progress: CalendarProgress;
}

// ... existing types ... //

/* =======================
   Thunks
======================= */

// Mark medicine intake (Optimistic + Offline Queue)
export const markMedicineIntake = createAsyncThunk<
  void,
  {
    scheduleId: string;
    date: string;
    time: string;
    status: 'taken' | 'skipped' | 'missed' | 'pending';
  },
  { rejectValue: string }
>('calendar/markIntake', async (payload, { rejectWithValue }) => {
  try {
    // Try API Sync
    await markMedicineIntakeApi(payload as any);
  } catch (err) {
    // If failed, queue for later
    console.warn('Sync failed, adding to queue', payload);
    await StorageService.addToSyncQueue('MARK_INTAKE', payload);
    // We treat this as "success" for the UI (Optimistic)
  }
});

// Sync Offline Queue
export const syncOfflineQueue = createAsyncThunk(
  'calendar/syncQueue',
  async (_, { dispatch }) => {
    const queue = await StorageService.getSyncQueue();
    if (queue.length === 0) return;

    for (const action of queue) {
      if (action.status === 'FAILED' && action.attempts > 5) {
        continue;
      }

      try {
        switch (action.type) {
          case 'MARK_INTAKE':
            await markMedicineIntakeApi(action.payload);
            break;
          default:
            console.warn('[Sync] Unknown action type', action.type);
            break;
        }

        await StorageService.removeFromSyncQueue(action.id);

      } catch (err: any) {
        console.error(`[Sync] Action ${action.id} failed`, err);
        await StorageService.updateSyncAction(action.id, {
          status: 'FAILED',
          attempts: action.attempts + 1,
          lastAttemptAt: Date.now(),
          error: err?.message || 'Unknown error',
        });
      }
    }

    // Refresh data after sync
    dispatch(loadCalendarData());
  }
);

interface CalendarState {
  data: CalendarData;
  loading: boolean;
  error: string | null;
}

/* =======================
   Initial State
======================= */

const initialState: CalendarState = {
  data: {
    date: '',
    appointments: [],
    medicines: [],
    progress: {
      taken: 0,
      total: 0,
    },
  },
  loading: false,
  error: null,
};

/* =======================
   Thunks
======================= */

// Load calendar data (appointments + medicines + progress)
export const loadCalendarData = createAsyncThunk<
  CalendarData,
  string | undefined,
  { rejectValue: string }
>('calendar/load', async (date, { rejectWithValue }) => {
  try {
    const data = await fetchCalendarData(date);
    if (date) {
      await StorageService.saveCalendarCache(date, data);
    }
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Unable to load calendar');
  }
});

// Load calendar cache only
export const loadCalendarCache = createAsyncThunk<
  CalendarData | null,
  string
>('calendar/loadCache', async (date) => {
  const entry = await StorageService.getCalendarCache(date);
  return entry ? entry.data : null;
});

// Add medicine schedule, then refresh calendar
export const addMedicineSchedule = createAsyncThunk<
  void,
  {
    medicineName: string;
    dosage: string;
    times: string[];
    startDate: Date;
    endDate?: Date | null;
    familyVisible: boolean;
    scheduleType: string;
  },
  { rejectValue: string }
>('calendar/addMedicineSchedule', async (payload, { dispatch, rejectWithValue }) => {
  try {
    await createMedicineSchedule(payload);

    // Refresh calendar after successful add
    dispatch(loadCalendarData());
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to add medicine');
  }
});

/* =======================
   Slice
======================= */

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder

      /* ---------- Load Calendar ---------- */
      .addCase(loadCalendarData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCalendarData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadCalendarData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load calendar';
      })

      /* ---------- Load Cache ---------- */
      .addCase(loadCalendarCache.fulfilled, (state, action) => {
        if (action.payload) {
          state.data = action.payload;
          // We do NOT set loading to false here, as network request follows.
          // This ensures fast render.
        }
      })

      /* ---------- Mark Intake (Optimistic) ---------- */
      .addCase(markMedicineIntake.pending, (state, action) => {
        const { scheduleId, status } = action.meta.arg;

        // Find medicine with flexible ID matching
        // scheduleId passed is typically just the UUID prefix (before underscore)
        const medicine = state.data.medicines.find((m: any) =>
          m.id === scheduleId || m.id.startsWith(scheduleId + '_')
        );

        if (medicine) {
          const oldStatus = medicine.status;
          medicine.status = status;

          // Update progress stats
          if (status === 'taken' && oldStatus !== 'taken') {
            state.data.progress.taken += 1;
          } else if (status !== 'taken' && oldStatus === 'taken') {
            state.data.progress.taken = Math.max(0, state.data.progress.taken - 1);
          }
        }
      })

      /* ---------- Add Medicine ---------- */
      .addCase(addMedicineSchedule.pending, state => {
        // do not block UI, calendar reload handles updates
        state.error = null;
      })
      .addCase(addMedicineSchedule.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to add medicine';
      });

  },
});

export default calendarSlice.reducer;
