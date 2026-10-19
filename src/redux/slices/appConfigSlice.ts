import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AppUpdateInfo, EnabledServices, getAppConfig, MaintenanceInfo, PaymentGateway } from '../../services/api/appConfig.api';

interface AppConfigState {
  // Defaults to the current launch state (pharmacy + consultations) so the
  // UI is correct even before the boot-time fetch resolves, and stays
  // correct if that fetch ever fails - never falls open to "show
  // everything" (labTests/homeCare/bloodDonation/ambulance/doctorOnboarding
  // stay off until deliberately launched).
  enabledServices: EnabledServices;
  // null means "no update known" - a failed/pending fetch must never be
  // read as update-required or update-available by any consumer of this.
  update: AppUpdateInfo | null;
  // null means "no maintenance info known" - treated the same as "not in
  // maintenance" by every consumer, never as "maintenance is on."
  maintenance: MaintenanceInfo | null;
  // Computed by BootCoordinator.ts (not server-sent directly) once
  // maintenance.enabled is true: true means "let this user into the app,
  // but hide/disable starting anything new" - set only after a specific
  // journey-status check for THIS user, never inferred from `maintenance`
  // alone.
  restricted: boolean;
  loaded: boolean;
  // Defaults to 'razorpay' (the only gateway before this toggle existed)
  // and stays there on any failed/pending fetch - same fail-safe
  // convention as `maintenance`/`enabledServices` above.
  activePaymentGateway: PaymentGateway;
}

const initialState: AppConfigState = {
  enabledServices: {
    pharmacy: true,
    consultations: true,
    labTests: false,
    homeCare: false,
    hospitals: false,
    bloodDonation: false,
    ambulance: false,
    doctorPrescriptions: false,
    // Apply as Doctor stays hidden even though consultations (the
    // patient-facing side) is now live.
    doctorOnboarding: false,
  },
  update: null,
  maintenance: null,
  restricted: false,
  loaded: false,
  activePaymentGateway: 'razorpay',
};

export const loadAppConfig = createAsyncThunk('appConfig/load', async () => {
  const config = await getAppConfig();
  return config;
});

const appConfigSlice = createSlice({
  name: 'appConfig',
  initialState,
  reducers: {
    setMaintenanceRestricted(state, action: { payload: boolean }) {
      state.restricted = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadAppConfig.fulfilled, (state, action) => {
      if (action.payload?.enabledServices) {
        state.enabledServices = action.payload.enabledServices;
      }
      state.update = action.payload?.update ?? null;
      state.maintenance = action.payload?.maintenance ?? null;
      // Every fresh config fetch (cold boot, foreground recheck) starts
      // from "not restricted" and lets BootCoordinator re-derive it - a
      // stale `restricted: true` from a previous session must never
      // survive maintenance being turned off.
      if (!action.payload?.maintenance?.enabled) {
        state.restricted = false;
      }
      state.activePaymentGateway = action.payload?.activePaymentGateway === 'cashfree' ? 'cashfree' : 'razorpay';
      state.loaded = true;
    });
    // A failed fetch keeps the safe pharmacy-only default, `update: null`,
    // and `maintenance: null` rather than leaving the UI in a half-loaded
    // state or guessing.
    builder.addCase(loadAppConfig.rejected, (state) => {
      state.update = null;
      state.maintenance = null;
      state.restricted = false;
      state.activePaymentGateway = 'razorpay';
      state.loaded = true;
    });
  },
});

export const { setMaintenanceRestricted } = appConfigSlice.actions;

export default appConfigSlice.reducer;

// How many distinct services are enabled - the Profile menu's layout
// switches between "single service" (Orders under Account) and "multiple
// services" (full Activity & History section) based on this count, not
// just on pharmacy specifically.
export const selectEnabledServiceCount = (state: { appConfig: AppConfigState }): number =>
  Object.values(state.appConfig.enabledServices).filter(Boolean).length;
