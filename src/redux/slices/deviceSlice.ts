import { createAsyncThunk, createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getTodayOnDeviceSteps } from '../../services/health/stepsService';
import { getTodayHealthConnectSteps } from '../../services/health/healthConnectStepsService';

interface ConnectedDevice {
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
}

const initialState: DeviceState = {
    connectedDevice: null,
    isScanning: false,
    availableDevices: [],
    onDeviceSteps: null,
};

// No fitness band/watch paired - fall back to a real "steps since midnight"
// reading. Health Connect (Android, opt-in via a steps goal - see
// healthConnectStepsService.ts) is tried first since it gives a true daily
// total; getTodayOnDeviceSteps (iOS's CMPedometer) is the fallback there and
// returns null on Android/when Health Connect isn't enabled, so this never
// silently double-counts or picks a wrong source.
export const loadOnDeviceSteps = createAsyncThunk('device/loadOnDeviceSteps', async () => {
    const healthConnectSteps = await getTodayHealthConnectSteps();
    if (healthConnectSteps !== null) return healthConnectSteps;
    return await getTodayOnDeviceSteps();
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
        connectDevice: (state, action: PayloadAction<ConnectedDevice>) => {
            state.connectedDevice = action.payload;
        },
        disconnectDevice: (state) => {
            state.connectedDevice = null;
        },
        updateDeviceData: (state, action: PayloadAction<Partial<ConnectedDevice>>) => {
            if (state.connectedDevice) {
                state.connectedDevice = { ...state.connectedDevice, ...action.payload };
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(loadOnDeviceSteps.fulfilled, (state, action) => {
            state.onDeviceSteps = action.payload;
        });
    },
});

export const {
    setScanning,
    setAvailableDevices,
    addAvailableDevice,
    connectDevice,
    disconnectDevice,
    updateDeviceData
} = deviceSlice.actions;

// Prefer a connected fitness device's steps; if none is connected, fall
// back to the phone's own step sensor; otherwise 0.
export const selectTodaySteps = createSelector(
    [(state: { device: DeviceState }) => state.device.connectedDevice, (state: { device: DeviceState }) => state.device.onDeviceSteps],
    (connectedDevice, onDeviceSteps) => connectedDevice?.data?.steps ?? onDeviceSteps ?? 0
);

export default deviceSlice.reducer;
