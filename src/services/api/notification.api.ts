import { apiClient } from './client';

export type CustomerNotification = {
  _id: string;
  type: 'appointment' | 'consultation' | 'order' | 'medicine' | 'reminder' | 'system' | 'promotion' | 'health_reminder' | 'support_request' | 'review';
  title: string;
  message: string;
  isRead: boolean;
  createdOn: string;
  readOn?: string | null;
  actionUrl?: string | null;
  actionText?: string | null;
  metadata?: Record<string, any>;
};

export async function getCustomerNotifications(params?: {
  page?: number;
  limit?: number;
  type?: string;
  isRead?: boolean;
}) {
  const res = await apiClient.get('/api/user/notifications', { params });
  return res.data;
}

export async function getUnreadCustomerNotificationCount() {
  const res = await apiClient.get('/api/user/notifications/unread-count');
  return res.data;
}

export async function markCustomerNotificationsAsRead(notificationIds: string[]) {
  const res = await apiClient.post('/api/user/notifications/mark-read', { notificationIds });
  return res.data;
}

export async function markAllCustomerNotificationsAsRead() {
  const res = await apiClient.post('/api/user/notifications/mark-all-read');
  return res.data;
}
