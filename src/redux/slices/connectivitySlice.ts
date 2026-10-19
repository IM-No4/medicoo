import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// The single source of truth for "are we actually online right now" -
// distinct from boot.status (which only ever reflects the ONE check made
// at cold launch, before the app is even usable yet). Screens that need to
// adapt their layout while already running (e.g. HomeScreen swapping to a
// cache/shortcuts-only layout instead of trying to render the
// network-fetched feed) read isOnline from here instead.
//
// Kept updated by two things:
//   - BootCoordinator.ts, the moment either the initial connectivity probe
//     or "Use in Offline Mode" resolves - so a session that starts offline
//     KNOWS it's offline from frame one, not up to 45s later.
//   - offlineSync.ts's periodic reachability probe, for everything after
//     that (going offline mid-session, coming back online, etc).
interface ConnectivityState {
  isOnline: boolean;
  // True when the device has internet but OUR backend can't be reached (server
  // down/restarting). Set by the API client after repeated no-response
  // failures, cleared by the first request that gets any response.
  serverUnreachable: boolean;
}

// Optimistic default (true) rather than "unknown" - avoids every screen
// that reads this needing a third loading state on the very first render,
// before either of the two sources above has reported in yet. Both of them
// run essentially immediately on boot, so this is corrected within
// milliseconds if actually offline.
const initialState: ConnectivityState = {
  isOnline: true,
  serverUnreachable: false,
};

const connectivitySlice = createSlice({
  name: 'connectivity',
  initialState,
  reducers: {
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setServerUnreachable(state, action: PayloadAction<boolean>) {
      state.serverUnreachable = action.payload;
    },
  },
});

export const { setOnlineStatus, setServerUnreachable } = connectivitySlice.actions;
export default connectivitySlice.reducer;
