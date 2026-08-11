import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

// expo-sensors' historical getStepCountAsync(start, end) is iOS-only (backed
// by Core Motion / CMPedometer) - Android's public step counter sensor has
// no equivalent "steps since midnight" query without Health Connect, which
// is a separate integration (its own app dependency + permission flow).
// Rather than show a number that's silently wrong on Android (e.g. steps
// only since the app was opened), this only ever returns real data on iOS
// and reports itself as unavailable everywhere else.
export const isOnDeviceStepsSupported = Platform.OS === 'ios';

export async function getTodayOnDeviceSteps(): Promise<number | null> {
  if (!isOnDeviceStepsSupported) return null;

  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return null;

    let { status } = await Pedometer.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Pedometer.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const { steps } = await Pedometer.getStepCountAsync(startOfToday, now);
    return steps;
  } catch (error) {
    console.warn('[stepsService] Failed to read on-device step count', error);
    return null;
  }
}

// Unlike getTodayOnDeviceSteps, watchStepCount works on both platforms - but
// it only ever reports steps taken since the listener was registered, not
// since midnight (Android has no "steps since date X" query without Health
// Connect). Callers must NOT treat this as a full-day total or feed it into
// anything persisted/compared (goals, leaderboards) - it exists purely to
// show a live-updating number while the app is open, distinct from
// "today's steps". Pedometer also doesn't deliver updates while backgrounded,
// so this is only meaningful while the screen holding the subscription is
// actually in the foreground.
export async function watchLiveSteps(
  onUpdate: (steps: number) => void
): Promise<{ remove: () => void } | null> {
  try {
    const available = await Pedometer.isAvailableAsync();
    if (!available) return null;

    let { status } = await Pedometer.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Pedometer.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    return Pedometer.watchStepCount(({ steps }) => onUpdate(steps));
  } catch (error) {
    console.warn('[stepsService] Failed to subscribe to live step count', error);
    return null;
  }
}
