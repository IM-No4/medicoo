import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  appReady: boolean;
  homeBootstrapped: boolean;
  prescriptionModalVisible: boolean;
}

const initialState: AppState = {
  appReady: false,
  homeBootstrapped: false,
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
    setPrescriptionModalVisible(state, action) {
      state.prescriptionModalVisible = action.payload;
    }
  },
});

export const { setAppReady, setHomeBootstrapped, setPrescriptionModalVisible } = appSlice.actions;
export default appSlice.reducer;
