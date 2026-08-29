import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { EnabledServices, getAppConfig } from '../../services/api/appConfig.api';

interface AppConfigState {
  // Defaults to the current launch state (pharmacy + consultations) so the
  // UI is correct even before the boot-time fetch resolves, and stays
  // correct if that fetch ever fails - never falls open to "show
  // everything" (labTests/homeCare/bloodDonation/ambulance/doctorOnboarding
  // stay off until deliberately launched).
  enabledServices: EnabledServices;
  loaded: boolean;
}

const initialState: AppConfigState = {
  enabledServices: {
    pharmacy: true,
    consultations: true,
    labTests: false,
    homeCare: false,
    bloodDonation: false,
    ambulance: false,
    doctorPrescriptions: false,
    // Apply as Doctor stays hidden even though consultations (the
    // patient-facing side) is now live.
    doctorOnboarding: false,
  },
  loaded: false,
};

export const loadAppConfig = createAsyncThunk('appConfig/load', async () => {
  const config = await getAppConfig();
  return config.enabledServices;
});

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(loadAppConfig.fulfilled, (state, action) => {
      if (action.payload) {
        state.enabledServices = action.payload;
      }
      state.loaded = true;
    });
    // A failed fetch keeps the safe pharmacy-only default rather than
    // leaving the UI in a half-loaded state.
    builder.addCase(loadAppConfig.rejected, (state) => {
      state.loaded = true;
    });
  },
});

export default appConfigSlice.reducer;

// How many distinct services are enabled - the Profile menu's layout
// switches between "single service" (Orders under Account) and "multiple
// services" (full Activity & History section) based on this count, not
// just on pharmacy specifically.
export const selectEnabledServiceCount = (state: { appConfig: AppConfigState }): number =>
  Object.values(state.appConfig.enabledServices).filter(Boolean).length;
