import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

type LocationState = {
  currentLocation: LocationCoords | null;
  permissionGranted: boolean;
};

const initialState: LocationState = {
  currentLocation: null,
  permissionGranted: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation(
      state,
      action: PayloadAction<LocationCoords>
    ) {
      state.currentLocation = action.payload;
      state.permissionGranted = true;
    },
    clearCurrentLocation(state) {
      state.currentLocation = null;
      state.permissionGranted = false;
    },
  },
});

export const {
  setCurrentLocation,
  clearCurrentLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
