import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: DeviceState = {
    connectedDevice: null,
    isScanning: false,
    availableDevices: [],
};

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
});

export const {
    setScanning,
    setAvailableDevices,
    addAvailableDevice,
    connectDevice,
    disconnectDevice,
    updateDeviceData
} = deviceSlice.actions;

export default deviceSlice.reducer;
