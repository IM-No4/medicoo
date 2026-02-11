import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  appReady: boolean;
  homeBootstrapped: boolean;
}

const initialState: AppState = {
  appReady: false,
  homeBootstrapped: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAppReady(state, action) {
      state.appReady = action.payload;
    },
    setHomeBootstrapped(state) {
      state.homeBootstrapped = true;
    }
  },
});

export const { setAppReady, setHomeBootstrapped } = appSlice.actions;
export default appSlice.reducer;
