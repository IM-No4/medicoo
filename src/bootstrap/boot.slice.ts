import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BootState } from './boot.types';

const initialState: BootState = {
  status: 'idle',
  isAuthenticated: false,
  onboardingCompleted: false,
  initialRoute: null,
  deepLinkIntent: null,
};

const bootSlice = createSlice({
  name: 'boot',
  initialState,
  reducers: {
    bootStart(state) {
      state.status = 'loading';
    },
    bootSuccess(state, action: PayloadAction<Partial<BootState>>) {
      Object.assign(state, action.payload);
      state.status = 'ready';
    },
    bootFail(state) {
      state.status = 'error';
    },
    setOnboardingCompleted(state) {
      state.onboardingCompleted = true;
    },
    setDeepLinkIntent(state, action) {
      state.deepLinkIntent = action.payload;
    },
    clearDeepLinkIntent(state) {
      state.deepLinkIntent = null;
    },
  },
});

export const {
  bootStart,
  bootSuccess,
  bootFail,
  setOnboardingCompleted,
  setDeepLinkIntent,
  clearDeepLinkIntent,
} = bootSlice.actions;

export default bootSlice.reducer;
