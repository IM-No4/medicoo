import messaging from '@react-native-firebase/messaging';
import { Linking } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { setUnreadCount } from '../redux/slices/notificationSlice';
import { store } from '../redux/store';
import { getUnreadCustomerNotificationCount } from '../services/api/notification.api';
import { registerDeviceToken } from '../services/api/pushNotification.api';
import { getDeviceId, getFCMToken } from '../utils/deviceUtils';

/** Fetches a real FCM token/device id and registers them with the backend. */
export async function syncPushToken() {
  if (!store.getState().boot.isAuthenticated) return;

  const fcmToken = await getFCMToken();
  if (!fcmToken) return;

  const deviceId = await getDeviceId();
  try {
    await registerDeviceToken(fcmToken, deviceId);
  } catch (error) {
    console.warn('Failed to register push token:', error);
  }
}

const refreshUnreadCount = async () => {
  try {
    const response = await getUnreadCustomerNotificationCount();
    store.dispatch(setUnreadCount(response?.data?.unreadCount || 0));
  } catch (error) {
    console.warn('Failed to refresh unread notification count:', error);
  }
};

// Matches the `type` field set by each template in the backend's
// notificationTemplates (services/pushNotificationService.js).
const ORDER_TRACKING_TYPES = new Set(['order_placed', 'order_confirmed', 'order_shipped']);
const ORDER_HISTORY_TYPES = new Set(['order_delivered', 'order_cancelled', 'payment_success', 'payment_failed']);

const goToNotifications = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', {
    screen: 'Home',
    params: { screen: 'Notifications' },
  });
};

// Ongoing order - LiveTracking reads the active order straight from Redux
// (already populated by the order socket listener), so no params needed.
const goToOrderTracking = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('CartStack', { screen: 'LiveTracking' });
};

// Finished order (delivered/cancelled) or a payment result tied to one -
// the historical order detail screen, which does need an orderId.
const goToOrderHistory = (orderId: string) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', {
    screen: 'Profile',
    params: { screen: 'MedicineOrderDetail', params: { orderId } },
  });
};

const goToCalendar = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', { screen: 'Calendar' });
};

const goToDoctorChat = (requestId: string, senderName?: string) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('DoctorChat', { requestId, title: senderName });
};

// Patient's own appointment detail screen - shows the "Pay Now" prompt once
// approved, or the rejection status, for this specific request.
const goToConsultationDetail = (requestId: string) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', {
    screen: 'Profile',
    params: { screen: 'ConsultationDetail', params: { requestId } },
  });
};

// Doctor's side of the same reminder - there's no single-request detail
// fetch on the doctor side (only the paginated list), so land on the list
// pre-filtered to upcoming appointments rather than guessing a deep link.
const goToManageAppointments = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', {
    screen: 'Profile',
    params: { screen: 'ManageAppointments', params: { initialTab: 'upcoming' } },
  });
};

// Jumps straight into the call screen. Works for either the patient or the
// doctor unchanged - joining/permission is resolved by requestId server-side
// (getCallToken), so no role disambiguation is needed here.
const goToIncomingCall = (requestId: string, consultationType?: string, callerName?: string) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('DoctorCall', {
    appointment: { requestId },
    type: consultationType === 'voice' ? 'voice' : 'video',
    displayName: callerName,
  });
};

function routeNotificationTap(data?: { [key: string]: string | object } | undefined) {
  const type = typeof data?.type === 'string' ? data.type : undefined;
  const orderId = typeof data?.orderId === 'string' ? data.orderId : undefined;

  if (type && ORDER_TRACKING_TYPES.has(type)) {
    goToOrderTracking();
    return;
  }

  // Payment results only carry an orderId when one was actually attached
  // server-side (payment_success/failed aren't always order-linked) - fall
  // through to the notifications inbox rather than guess.
  if (type && ORDER_HISTORY_TYPES.has(type) && orderId) {
    goToOrderHistory(orderId);
    return;
  }

  if (type === 'medicine_reminder') {
    goToCalendar();
    return;
  }

  if (type === 'app_update' && typeof data?.updateUrl === 'string' && data.updateUrl) {
    Linking.openURL(data.updateUrl).catch(() => goToNotifications());
    return;
  }

  if (type === 'chat_message' && typeof data?.requestId === 'string' && data.requestId) {
    const senderName = typeof data?.senderName === 'string' ? data.senderName : undefined;
    goToDoctorChat(data.requestId, senderName);
    return;
  }

  if (
    (type === 'appointment_approved' || type === 'appointment_rejected' || type === 'appointment_reminder' || type === 'appointment_completed') &&
    typeof data?.requestId === 'string' &&
    data.requestId
  ) {
    // appointment_completed is always sent to the patient (see
    // completeAppointmentRequest in customerController.js) - the detail
    // screen already shows the "Write a Review" prompt once a consultation
    // is completed, so this is where the "Share your feedback!" notification
    // should actually land instead of falling through to the generic inbox.
    goToConsultationDetail(data.requestId);
    return;
  }

  if (type === 'doctor_appointment_reminder' || type === 'new_appointment_request') {
    goToManageAppointments();
    return;
  }

  if (type === 'call_incoming' && typeof data?.requestId === 'string' && data.requestId) {
    const consultationType = typeof data?.consultationType === 'string' ? data.consultationType : undefined;
    const callerName = typeof data?.callerName === 'string' ? data.callerName : undefined;
    goToIncomingCall(data.requestId, consultationType, callerName);
    return;
  }

  // system_alert/promotional/custom carry no fixed target - the inbox is
  // always a correct place to land.
  goToNotifications();
}

/** Foreground message + token-refresh listeners. Call once for the app's lifetime. */
export function initPushNotifications() {
  messaging().onMessage(async () => {
    refreshUnreadCount();
  });

  messaging().onTokenRefresh(async () => {
    syncPushToken();
  });
}

/** Notification-tap navigation. Call once boot/navigation is ready. */
export function setupNotificationTapHandling() {
  messaging().onNotificationOpenedApp((remoteMessage) => {
    routeNotificationTap(remoteMessage?.data);
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        routeNotificationTap(remoteMessage.data);
      }
    });
}
