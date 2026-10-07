import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createVitalRecord as createVitalRecordApi,
  deleteVitalRecord as deleteVitalRecordApi,
  fetchVitalRecords,
  VitalRecordDto,
  VitalRecordPayload,
} from '../../services/api/vitals.api';
import { loadVitals as loadVitalsCacheFromDisk, saveVitals as saveVitalsCacheToDisk } from '../../services/storage/vitalsStorage';
import { StorageService } from '../../services/storage';

export interface VitalRecord {
  id: string;
  timestamp: string; // ISO date string
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
  temperature?: number; // Fahrenheit
}

const mapDtoToRecord = (dto: VitalRecordDto): VitalRecord => ({
  id: dto._id,
  timestamp: dto.timestamp,
  heartRate: dto.heartRate,
  systolic: dto.systolic,
  diastolic: dto.diastolic,
  weight: dto.weight,
  temperature: dto.temperature,
});

interface VitalsState {
  records: VitalRecord[];
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: VitalsState = {
  records: [], // Starts empty to display the placeholder invite until loadVitalRecords resolves
  loading: false,
  saving: false,
  error: null,
};

/* =======================
   Thunks
======================= */

// Instant paint from the last known-good snapshot while loadVitalRecords
// resolves - same cache-then-refresh pattern as goalsSlice's
// loadGoalsCache/loadGoalsFromServer and calendarSlice's
// loadCalendarCache/loadCalendarData.
export const loadVitalsCache = createAsyncThunk('vitals/loadCache', async () => {
  return await loadVitalsCacheFromDisk();
});

export const loadVitalRecords = createAsyncThunk<VitalRecord[], void, { rejectValue: string }>(
  'vitals/load',
  async (_, { rejectWithValue }) => {
    try {
      const dtos = await fetchVitalRecords();
      const records = dtos.map(mapDtoToRecord);
      await saveVitalsCacheToDisk(records);
      return records;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Unable to load vitals');
    }
  }
);

export const addVitalRecord = createAsyncThunk<VitalRecord, VitalRecordPayload, { rejectValue: string }>(
  'vitals/add',
  async (payload, { rejectWithValue, getState }) => {
    try {
      const dto = await createVitalRecordApi(payload);
      const record = mapDtoToRecord(dto);
      const state = getState() as { vitals: VitalsState };
      await saveVitalsCacheToDisk([record, ...state.vitals.records]);
      return record;
    } catch (err: any) {
      // No response at all (vs a real 4xx/5xx from the server) means this
      // never reached the backend - almost always no internet. Logging a
      // vital reading is exactly the kind of thing that shouldn't fail just
      // because the user is offline right now: queue it for
      // syncOfflineQueue to actually send once back online, and apply it
      // optimistically (a client-side id, swapped for the real one on next
      // successful loadVitalRecords) so it shows immediately either way.
      if (!err?.response) {
        console.warn('Vital record sync failed (offline?), queuing', payload);
        await StorageService.addToSyncQueue('LOG_VITAL', payload);

        const optimisticRecord: VitalRecord = {
          id: `offline_${Date.now()}`,
          timestamp: payload.timestamp || new Date().toISOString(),
          heartRate: payload.heartRate,
          systolic: payload.systolic,
          diastolic: payload.diastolic,
          weight: payload.weight,
          temperature: payload.temperature,
        };
        const state = getState() as { vitals: VitalsState };
        await saveVitalsCacheToDisk([optimisticRecord, ...state.vitals.records]);
        return optimisticRecord;
      }

      // Surfaces the server's real validation message (e.g. an out-of-range
      // value) instead of axios's generic "Request failed with status code
      // 400", matching the fix already applied to EditRecordModal.tsx.
      const serverMessage = err?.response?.data?.message;
      return rejectWithValue(serverMessage || err?.message || 'Failed to save vital record');
    }
  }
);

export const removeVitalRecord = createAsyncThunk<string, string, { rejectValue: string }>(
  'vitals/remove',
  async (id, { rejectWithValue }) => {
    try {
      await deleteVitalRecordApi(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Failed to delete vital record');
    }
  }
);

/* =======================
   Slice
======================= */

const vitalsSlice = createSlice({
  name: 'vitals',
  initialState,
  reducers: {
    clearVitals: (state) => {
      state.records = [];
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- Cache ---------- */
      .addCase(loadVitalsCache.fulfilled, (state, action) => {
        if (action.payload.length > 0) state.records = action.payload;
        // No `loading = false` here on purpose - same reasoning as
        // calendarSlice's loadCalendarCache: the network request still
        // follows, this just paints something instantly first.
      })

      /* ---------- Load ---------- */
      .addCase(loadVitalRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVitalRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(loadVitalRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unable to load vitals';
      })

      /* ---------- Add ---------- */
      .addCase(addVitalRecord.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addVitalRecord.fulfilled, (state, action) => {
        state.saving = false;
        state.records.unshift(action.payload);
      })
      .addCase(addVitalRecord.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? 'Failed to save vital record';
      })

      /* ---------- Remove ---------- */
      .addCase(removeVitalRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(r => r.id !== action.payload);
      });
  },
});

export const { clearVitals } = vitalsSlice.actions;
export default vitalsSlice.reducer;
