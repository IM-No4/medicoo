import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getTodayOnDeviceSteps } from '../../services/health/stepsService';
import { getTodayHealthConnectSteps } from '../../services/health/healthConnectStepsService';
import { runNativeStepsSync } from '../../services/health/nativeStepsSyncService';
import { getTodayCalories } from '../../services/health/caloriesService';
import { loadConnectedDevice, saveConnectedDevice } from '../../services/storage/deviceStorage';

export interface ConnectedDevice {
    id: string;
    name: string;
    type: 'apple_watch' | 'fitness_band' | 'other';
    batteryLevel?: number;
    status: 'connected' | 'connecting' | 'disconnected';
    lastSynced?: string;
    data?: {
        steps?: number;
        heartRate?: number;
        calories?: number;
    };
}

interface DeviceState {
    connectedDevice: ConnectedDevice | null;
    isScanning: boolean;
    availableDevices: { id: string, name: string }[];
    // Steps read directly from the phone's own motion sensor, used only
    // when there's no connected fitness device to source steps from.
    onDeviceSteps: number | null;
    // Real Health Connect calorie data if some other app/device provides
    // it, otherwise a weight-based estimate from onDeviceSteps - see
    // caloriesService.ts. null only when there's truly nothing to show.
    onDeviceCalories: number | null;
}

const initialState: DeviceState = {
    connectedDevice: null,
    isScanning: false,
    availableDevices: [],
    onDeviceSteps: null,
    onDeviceCalories: null,
};

// No fitness band/watch paired - fall back to a real "steps since midnight"
// reading. A best-effort native sync runs first (see
// nativeStepsSyncService.ts - itself a no-op unless a steps goal has native
// write-tracking enabled and no device is linked), so Health Connect has
// the freshest possible data before it's read. Health Connect is tried
// first since it gives a true daily total; getTodayOnDeviceSteps (iOS's
// CMPedometer) is the fallback there and returns null on Android/when
// Health Connect isn't enabled, so this never silently double-counts or
// picks a wrong source. Calories are derived from whatever steps total
// this resolves to, so both are computed together in one thunk.
export const loadOnDeviceSteps = createAsyncThunk('device/loadOnDeviceSteps', async () => {
    await runNativeStepsSync();
    const healthConnectSteps = await getTodayHealthConnectSteps();
    const steps = healthConnectSteps !== null ? healthConnectSteps : await getTodayOnDeviceSteps();
    const calories = await getTodayCalories(steps ?? 0);
    return { steps, calories };
});

// Rehydrates the linked-device UI state on cold launch - deviceSlice's
// redux state alone always starts at null, so without this the "Compare
// with Friends"-adjacent device UI (and the steps-source selector below)
// would briefly/incorrectly show "no device" even when one is actually
// paired, until the user re-opens the connect flow.
export const loadConnectedDeviceCache = createAsyncThunk('device/loadConnectedDeviceCache', async () => {
    return await loadConnectedDevice();
});

export const connectDevice = createAsyncThunk('device/connect', async (device: ConnectedDevice) => {
    await saveConnectedDevice(device);
    return device;
});

export const disconnectDevice = createAsyncThunk('device/disconnect', async () => {
    await saveConnectedDevice(null);
});

const deviceSlice = createSlice({
    name: 'device',
    initialState,
    reducers: {
        setScanning: (state, action: PayloadAction<boolean>) => {
            state.isScanning = action.payload;
        },
        setAvailableDevices: (state, action: PayloadAction<{ id: string, name: string }[]>) => {
            state.availableDevices = action.payload;
        },
        addAvailableDevice: (state, action: PayloadAction<{ id: string, name: string }>) => {
            const exists = state.availableDevices.find(d => d.id === action.payload.id);
            if (!exists) {
                state.availableDevices.push(action.payload);
            }
        },
        updateDeviceData: (state, action: PayloadAction<Partial<ConnectedDevice>>) => {
            if (state.connectedDevice) {
                state.connectedDevice = { ...state.connectedDevice, ...action.payload };
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadOnDeviceSteps.fulfilled, (state, action) => {
            state.onDeviceSteps = action.payload.steps;
            state.onDeviceCalories = action.payload.calories;
        });
        builder.addCase(loadConnectedDeviceCache.fulfilled, (state, action) => {
            state.connectedDevice = action.payload;
        });
        builder.addCase(connectDevice.fulfilled, (state, action) => {
            state.connectedDevice = action.payload;
        });
        builder.addCase(disconnectDevice.fulfilled, (state) => {
            state.connectedDevice = null;
        });
    },
});

export const {
    setScanning,
    setAvailableDevices,
    addAvailableDevice,
    updateDeviceData
} = deviceSlice.actions;

// Prefer a connected fitness device's steps; if none is connected, fall
// back to the phone's own step sensor; otherwise 0.
export const selectTodaySteps = createSelector(
    [(state: { device: DeviceState }) => state.device.connectedDevice, (state: { device: DeviceState }) => state.device.onDeviceSteps],
    (connectedDevice, onDeviceSteps) => connectedDevice?.data?.steps ?? onDeviceSteps ?? 0
);

// Same precedence as steps. null (not 0) when there's genuinely nothing to
// show yet, so the UI can render "--" instead of a misleading "0 kcal".
export const selectTodayCalories = createSelector(
    [(state: { device: DeviceState }) => state.device.connectedDevice, (state: { device: DeviceState }) => state.device.onDeviceCalories],
    (connectedDevice, onDeviceCalories) => connectedDevice?.data?.calories ?? onDeviceCalories ?? null
);

export default deviceSlice.reducer;
