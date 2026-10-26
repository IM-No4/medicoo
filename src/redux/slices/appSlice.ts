import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  appReady: boolean;
  homeBootstrapped: boolean;
  // true while the home screen is still loading its first screenful: the tab bar waits for it too, so everything appears together
  homeInitialLoading: boolean;
  prescriptionModalVisible: boolean;
}

const initialState: AppState = {
  appReady: false,
  homeBootstrapped: false,
  homeInitialLoading: true,
  prescriptionModalVisible: false,
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
    },
    setHomeInitialLoading(state, action) {
      state.homeInitialLoading = !!action.payload;
    },
    setPrescriptionModalVisible(state, action) {
      state.prescriptionModalVisible = action.payload;
    }
  },
});

export const { setAppReady, setHomeBootstrapped, setHomeInitialLoading, setPrescriptionModalVisible } = appSlice.actions;
export default appSlice.reducer;
