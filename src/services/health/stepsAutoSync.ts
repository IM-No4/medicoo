import { AppState, AppStateStatus } from 'react-native';
import type { AppDispatch, RootState } from '../../redux/store';
import { loadOnDeviceSteps, selectTodaySteps } from '../../redux/slices/deviceSlice';
import { loadIncomingFriendRequests } from '../../redux/slices/friendsSlice';
import { pushTodayStepsToServer } from './stepsServerSync';

const MIN_GAP_MS = 30 * 1000;

/**
 * Keeps steps and friend invites current whenever the app is opened or brought back, from any screen - not only when the Health screen
 * happens to be on display. (With the app closed the background task does the steps part; see nativeStepsBackgroundTask.ts.)
 * Returns a function that stops it.
 */
export function startForegroundSync(dispatch: AppDispatch, getState: () => RootState): () => void {
  let lastRun = 0;
  let running = false;

  const run = async () => {
    if (running || Date.now() - lastRun < MIN_GAP_MS) return;
    running = true;
    lastRun = Date.now();
    try {
      await dispatch(loadOnDeviceSteps());
      const state = getState();
      // Only a real reading is sent: with no step source at all the 0 would stomp a good value.
      const hasSource = !!state.device.connectedDevice || state.device.onDeviceSteps !== null;
      if (hasSource) await pushTodayStepsToServer(selectTodaySteps(state));
      dispatch(loadIncomingFriendRequests());
    } finally {
      running = false;
    }
  };

  run();
  const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
    if (next === 'active') run();
  });
  return () => subscription.remove();
}
