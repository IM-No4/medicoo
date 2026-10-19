import { Platform } from 'react-native';
import { apiClient } from './client';

export const registerDeviceToken = async (fcmToken: string, deviceId: string) => {
  const res = await apiClient.post('/api/push-notifications/register-token', {
    fcmToken,
    deviceId,
    userType: 'customer',
    // 'ringing_calls': this install shows incoming consultation calls as a full-screen ringing screen (Android)
    deviceInfo: { platform: Platform.OS, capabilities: Platform.OS === 'android' ? ['ringing_calls'] : [] },
  });
  return res.data;
};

export const unregisterDeviceToken = async (fcmToken: string) => {
  const res = await apiClient.post('/api/push-notifications/unregister-token', {
    fcmToken,
  });
  return res.data;
};
