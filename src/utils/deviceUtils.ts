import { Platform } from 'react-native';

export async function getFCMToken() {
  // TEMP: real Firebase later
  return 'TEMP_FCM_TOKEN';
}

export function getDeviceId() {
  // TEMP: real device ID later
  return `${Platform.OS}-simulator`;
}
