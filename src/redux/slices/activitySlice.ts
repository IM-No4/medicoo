import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    clearActivity as clearStoredActivity,
    loadActivity,
    saveActivity,
    TrackedActivity,
} from '../../services/storage/activityStorage';

interface ActivityState {
    activity: TrackedActivity | null;
}

const initialState: ActivityState = {
    activity: null,
};

/** Load persisted activity from AsyncStorage on app startup */
export const loadActivityFromStorage = createAsyncThunk(
    'activity/loadFromStorage',
    async () => {
        return await loadActivity();
    }
);

/** Persist and set a new in-progress activity */
export const trackActivity = createAsyncThunk(
    'activity/track',
    async (activity: Omit<TrackedActivity, 'timestamp'>) => {
        await saveActivity(activity);
        return { ...activity, timestamp: Date.now() } as TrackedActivity;
    }
);

/** Clear the tracked activity (on completion or dismiss) */
export const dismissActivity = createAsyncThunk(
    'activity/dismiss',
    async () => {
        await clearStoredActivity();
    }
);

const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        setActivity(state, action: PayloadAction<TrackedActivity | null>) {
            state.activity = action.payload;
        },
        clearActivity(state) {
            state.activity = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadActivityFromStorage.fulfilled, (state, action) => {
                state.activity = action.payload;
            })
            .addCase(trackActivity.fulfilled, (state, action) => {
                state.activity = action.payload;
            })
            .addCase(dismissActivity.fulfilled, (state) => {
                state.activity = null;
            });
    },
});

export const { setActivity, clearActivity } = activitySlice.actions;
export default activitySlice.reducer;
