import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  enableStepsTracking,
  isHealthConnectSupported,
  isStepsTrackingEnabled,
  openHealthConnectInPlayStore,
} from '../../services/health/healthConnectStepsService';

// Step tracking needs Android's Health Connect permission. It is asked for when the Health screen is first shown (not from a button
// buried in Manage Goals), once - and a row on the steps goal lets the person turn it on later if they said no.

const ASKED_KEY = '@medicoo_steps_access_asked';

export type StepsAccessResult = 'enabled' | 'denied' | 'needs_install' | 'unsupported';

/** Run the permission flow now, telling the person what happened. */
export async function requestStepsAccess(): Promise<StepsAccessResult> {
  if (!isHealthConnectSupported) return 'unsupported';
  const result = await enableStepsTracking();
  if (result.success) {
    Alert.alert('Step tracking is on', 'Your steps will now keep your steps goal up to date, even when the app is closed.');
    return 'enabled';
  }
  if (result.reason === 'not_installed' || result.reason === 'update_required') {
    Alert.alert(
      result.reason === 'not_installed' ? 'Health Connect needed' : 'Health Connect needs an update',
      result.reason === 'not_installed'
        ? 'Automatic step tracking needs the Health Connect app, which is not installed on this phone yet.'
        : 'Health Connect needs an update before Medicoo can read your steps.',
      [{ text: 'Not now', style: 'cancel' }, { text: 'Get Health Connect', onPress: openHealthConnectInPlayStore }],
    );
    return 'needs_install';
  }
  Alert.alert('Permission not given', 'Steps cannot be tracked without access to your activity. You can allow it any time from the steps goal.');
  return 'denied';
}

/**
 * Called when the Health screen shows up: if step tracking is not on yet and the person has not been asked before, explain and ask.
 * Returns true if the explanation was shown.
 */
export async function askForStepsAccessOnce(): Promise<boolean> {
  if (!isHealthConnectSupported) return false;
  try {
    if (await isStepsTrackingEnabled()) return false;
    if ((await AsyncStorage.getItem(ASKED_KEY)) === 'true') return false;
    await AsyncStorage.setItem(ASKED_KEY, 'true');
  } catch {
    return false;
  }

  Alert.alert(
    'Track your steps?',
    'Medicoo can count your steps in the background, even when the app is closed, to keep your steps goal up to date and let you compare with friends. It needs access to your activity.',
    [{ text: 'Not now', style: 'cancel' }, { text: 'Allow', onPress: () => { requestStepsAccess(); } }],
  );
  return true;
}
