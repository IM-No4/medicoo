import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

// Where the app is in finding out where the customer is - the home feed is location-based, so it waits on this:
//   resolving   - the permission question / the first fix is still in progress (only the header shows)
//   ready       - an address (live location or a saved one) is selected and the feed can load
//   denied      - permission was refused and there is no saved address to fall back on
//   unavailable - permission is fine but no location could be worked out (location switched off, no signal)
export type LocationStatus = 'resolving' | 'ready' | 'denied' | 'unavailable';

type LocationState = {
  currentLocation: LocationCoords | null;
  permissionGranted: boolean;
  status: LocationStatus;
  // false once the system will no longer show the permission dialog (refused with "don't ask again"): only the app settings can change it
  canAskAgain: boolean;
  // bumped to make the home header look for the location again (after the customer allows access, or taps "Try again")
  retrySignal: number;
};

const initialState: LocationState = {
  currentLocation: null,
  permissionGranted: false,
  status: 'resolving',
  canAskAgain: true,
  retrySignal: 0,
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
    setLocationStatus(state, action: PayloadAction<{ status: LocationStatus; canAskAgain?: boolean }>) {
      state.status = action.payload.status;
      if (action.payload.canAskAgain !== undefined) state.canAskAgain = action.payload.canAskAgain;
    },
    retryLocation(state) {
      state.status = 'resolving';
      state.retrySignal += 1;
    },
  },
});

export const {
  setCurrentLocation,
  clearCurrentLocation,
  setLocationStatus,
  retryLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
