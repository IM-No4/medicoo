import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
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
  // Top-level MainStack screen, not nested in the Profile tab's stack - see
  // ActionRegistry's OPEN_CONSULTATION_DETAIL for why.
  navigationRef.navigate('ConsultationDetail', { requestId });
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

// Handles all three blood-request notification types (nearby fan-out to a
// donor, filled notice to a donor who lost the race, accepted notice to the
// requester) - the same top-level screen renders the right view for
// whichever role the tapping user actually has, see BloodRequestDetailScreen.
const goToBloodRequestDetail = (requestId: string) => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('BloodRequestDetail', { requestId });
};

// A family-link request has to actually be accepted/declined somewhere -
// FamilyMembersScreen already renders every incoming request with those
// actions (see its "Requests For You" section), so the notification just
// needs to land there rather than a dedicated detail screen.
const goToFamilyMembers = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('FamilyMembersModal');
};

// Same reasoning as goToFamilyMembers - FriendsScreen already renders
// incoming friend requests with Accept/Decline (its "FRIEND REQUESTS"
// section), previously only reachable via Manage Goals' "Compare with
// Friends" card with no notification ever pointing at it directly.
const goToFriends = () => {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Friends');
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

  if (type === 'call_incoming' && typeof data?.requestId === 'string' && data.requestId) {
    const consultationType = typeof data?.consultationType === 'string' ? data.consultationType : undefined;
    const callerName = typeof data?.callerName === 'string' ? data.callerName : undefined;
    goToIncomingCall(data.requestId, consultationType, callerName);
    return;
  }

  if (
    (type === 'blood_request_nearby' || type === 'blood_request_filled' || type === 'blood_request_accepted') &&
    typeof data?.requestId === 'string' &&
    data.requestId
  ) {
    goToBloodRequestDetail(data.requestId);
    return;
  }

  // family_link_accepted has no pending action left to take (the requester
  // is just being told the other side said yes) - still lands on
  // FamilyMembersScreen so they can see the new member right away.
  if (type === 'family_link_request' || type === 'family_link_accepted') {
    goToFamilyMembers();
    return;
  }

  // Same reasoning as family_link_accepted above - friend_request_accepted
  // just lands on the screen that now shows the new friend.
  if (type === 'friend_request' || type === 'friend_request_accepted') {
    goToFriends();
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

  // Governs whether a notification (server push OR a locally-scheduled
  // medicine reminder - see medicineReminderScheduler.ts) actually displays
  // while the app is open and in the foreground. Without this, the default
  // is to show nothing - a medication reminder firing while the app happens
  // to be open would otherwise go completely unnoticed.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
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

  // Same routing for a tapped local reminder (see
  // medicineReminderScheduler.ts) - it carries the same `{ type:
  // 'medicine_reminder', ... }` data shape the server push does, so
  // routeNotificationTap sends both to the same place with no extra cases.
  Notifications.addNotificationResponseReceivedListener((response) => {
    routeNotificationTap(response.notification.request.content.data as any);
  });

  const lastResponse = Notifications.getLastNotificationResponse();
  if (lastResponse) {
    routeNotificationTap(lastResponse.notification.request.content.data as any);
  }
}
