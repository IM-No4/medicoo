import { createSlice } from '@reduxjs/toolkit';

// A simple counter, not a boolean or timestamp - screens that need to react
// to "the app just came back from being backgrounded for a while" (see
// offlineSync.ts's BACKGROUND_REFRESH_THRESHOLD_MS) put resumeSignal in
// their own refetch effect's dependency array, the same way isOnline or
// selectedAddress already are elsewhere (useHomeFeed.ts, CartScreen.tsx).
// A counter (rather than a timestamp) guarantees every increment is a
// distinct value React actually sees as "changed", even if two resumes
// happened within the same millisecond.
interface AppLifecycleState {
  resumeSignal: number;
}

const initialState: AppLifecycleState = {
  resumeSignal: 0,
};

const appLifecycleSlice = createSlice({
  name: 'appLifecycle',
  initialState,
  reducers: {
    triggerStaleResume(state) {
      state.resumeSignal += 1;
    },
  },
});

export const { triggerStaleResume } = appLifecycleSlice.actions;
export default appLifecycleSlice.reducer;
