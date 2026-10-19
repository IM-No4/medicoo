import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  Event,
  EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';

// An incoming consultation call shows as a full-screen "phone is ringing" screen with Answer and Decline, even when the app is closed
// or the phone is locked - so a family member can simply pick up, like a phone call. The server sends it as a high-priority
// data-only message (see the backend's call_incoming template); index.js hands that message to showIncomingCall.
//
// Android only for now. On iOS the same notification arrives as an ordinary alert until CallKit is added.

export const CALL_CHANNEL_ID = 'incoming_calls';
const RING_MS = 45000;

export interface IncomingCallData {
  requestId: string;
  consultationType?: string;
  callerName?: string;
  patientName?: string;
  bookedByName?: string;
  calleeRole?: string;
  title?: string;
  body?: string;
}

const idFor = (requestId: string) => `incoming-call-${requestId}`;

// A call someone answered from the lock screen before the app finished starting: the app picks it up once navigation is ready.
let pendingAnsweredCall: IncomingCallData | null = null;
export const takePendingAnsweredCall = () => {
  const call = pendingAnsweredCall;
  pendingAnsweredCall = null;
  return call;
};

async function ensureChannel() {
  return notifee.createChannel({
    id: CALL_CHANNEL_ID,
    name: 'Incoming consultation calls',
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'incoming_call', // res/raw/incoming_call.wav
    vibration: true,
    vibrationPattern: [400, 600, 400, 600],
    bypassDnd: true,
  });
}

const readData = (raw?: { [key: string]: string | object | number } | null): IncomingCallData | null => {
  if (!raw || typeof raw.requestId !== 'string' || !raw.requestId) return null;
  const text = (key: string) => (typeof raw[key] === 'string' ? (raw[key] as string) : undefined);
  return {
    requestId: raw.requestId,
    consultationType: text('consultationType'),
    callerName: text('callerName'),
    patientName: text('patientName'),
    bookedByName: text('bookedByName'),
    calleeRole: text('calleeRole'),
    title: text('title'),
    body: text('body'),
  };
};

/** Show the ringing call. Safe to call from the headless background handler. */
export async function showIncomingCall(raw?: { [key: string]: string | object | number } | null) {
  if (Platform.OS !== 'android') return;
  const call = readData(raw);
  if (!call) return;

  const channelId = await ensureChannel();
  const data: { [key: string]: string } = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    data[key] = String(value);
  });
  data.type = 'call_incoming';

  await notifee.displayNotification({
    id: idFor(call.requestId),
    title: call.title || (call.consultationType === 'voice' ? 'Incoming voice call' : 'Incoming video call'),
    body: call.body || `${call.callerName || 'Your doctor'} is calling.`,
    data,
    android: {
      channelId,
      category: AndroidCategory.CALL,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      ongoing: true,
      autoCancel: false,
      loopSound: true,
      timeoutAfter: RING_MS,
      pressAction: { id: 'answer', launchActivity: 'default' },
      fullScreenAction: { id: 'answer', launchActivity: 'default' },
      actions: [
        { title: 'Answer', pressAction: { id: 'answer', launchActivity: 'default' } },
        { title: 'Decline', pressAction: { id: 'decline' } },
      ],
    },
  });
}

export async function cancelIncomingCall(requestId?: string) {
  if (!requestId) return;
  try {
    await notifee.cancelNotification(idFor(requestId));
  } catch {
    // nothing to cancel
  }
}

/**
 * A press on the ringing notification, in the foreground or the headless background. "Decline" just stops the ringing; anything
 * else (the notification, Answer, or the full-screen screen) is an answer: remember it so the app can open the call.
 */
export async function handleCallEvent(event: Event, onAnswer?: (call: IncomingCallData) => void) {
  const notification = event.detail.notification;
  if (!notification || notification.data?.type !== 'call_incoming') return;
  const call = readData(notification.data as any);
  if (!call) return;

  if (event.type === EventType.ACTION_PRESS && event.detail.pressAction?.id === 'decline') {
    await cancelIncomingCall(call.requestId);
    return;
  }

  if (event.type === EventType.PRESS || event.type === EventType.ACTION_PRESS) {
    await cancelIncomingCall(call.requestId);
    pendingAnsweredCall = call;
    onAnswer?.(call);
  }
}

/** The call that opened the app (answered from the lock screen while the app was closed), if any. */
export async function getAnsweredCallThatOpenedApp(): Promise<IncomingCallData | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const initial = await notifee.getInitialNotification();
    if (initial?.notification?.data?.type !== 'call_incoming') return null;
    if (initial.pressAction?.id === 'decline') return null;
    return readData(initial.notification.data as any);
  } catch {
    return null;
  }
}
