import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createVitalRecord as createVitalRecordApi,
  deleteVitalRecord as deleteVitalRecordApi,
  fetchVitalRecords,
  VitalRecordDto,
  VitalRecordPayload,
} from '../../services/api/vitals.api';

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

export const loadVitalRecords = createAsyncThunk<VitalRecord[], void, { rejectValue: string }>(
  'vitals/load',
  async (_, { rejectWithValue }) => {
    try {
      const dtos = await fetchVitalRecords();
      return dtos.map(mapDtoToRecord);
    } catch (err: any) {
      return rejectWithValue(err?.message || 'Unable to load vitals');
    }
  }
);

export const addVitalRecord = createAsyncThunk<VitalRecord, VitalRecordPayload, { rejectValue: string }>(
  'vitals/add',
  async (payload, { rejectWithValue }) => {
    try {
      const dto = await createVitalRecordApi(payload);
      return mapDtoToRecord(dto);
    } catch (err: any) {
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
