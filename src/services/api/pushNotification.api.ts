import { Platform } from 'react-native';
import { apiClient } from './client';

export const registerDeviceToken = async (fcmToken: string, deviceId: string) => {
  const res = await apiClient.post('/api/push-notifications/register-token', {
    fcmToken,
    deviceId,
    userType: 'customer',
    deviceInfo: { platform: Platform.OS },
  });
  return res.data;
};

export const unregisterDeviceToken = async (fcmToken: string) => {
  const res = await apiClient.post('/api/push-notifications/unregister-token', {
    fcmToken,
  });
  return res.data;
};
