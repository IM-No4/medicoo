import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VitalRecord {
  id: string;
  timestamp: string; // ISO date string
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  weight?: number;
}

interface VitalsState {
  records: VitalRecord[];
}

const initialState: VitalsState = {
  records: [], // Starts empty to display the placeholder invite
};

const vitalsSlice = createSlice({
  name: 'vitals',
  initialState,
  reducers: {
    addVitalRecord: (state, action: PayloadAction<VitalRecord>) => {
      // Add new record at the beginning of the list
      state.records.unshift(action.payload);
    },
    clearVitals: (state) => {
      state.records = [];
    },
  },
});

export const { addVitalRecord, clearVitals } = vitalsSlice.actions;
export default vitalsSlice.reducer;
