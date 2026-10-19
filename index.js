import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { registerRootComponent } from 'expo';
import { FlatList, Platform, ScrollView, SectionList } from 'react-native';
import App from './src/app/App';
import { installGlobalAppFont } from './src/bootstrap/globalFont';
// Registers TaskManager.defineTask as a side effect - must be imported
// unconditionally at module scope, on every JS bundle load (including a
// headless background-task execution that never goes through App.tsx's
// boot effect), same reasoning as the FCM background handler below.
import './src/services/health/nativeStepsBackgroundTask';
import { cancelIncomingCall, handleCallEvent, showIncomingCall } from './src/services/incomingCall';

// Must run before the app's first render - see globalFont.ts for why this
// can't just be Text.defaultProps.
installGlobalAppFont();

// Must be registered outside the React tree - handles data-only FCM messages
// received while the app is backgrounded/killed. Notification-type messages
// are shown by the OS automatically without this.
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // An incoming consultation call arrives as a data-only message: show it as a ringing full-screen call (see incomingCall.ts).
  if (remoteMessage?.data?.type === 'call_incoming') {
    await showIncomingCall(remoteMessage.data);
  }
  // The call was answered on another phone: stop ringing here.
  if (remoteMessage?.data?.type === 'call_cancelled') {
    await cancelIncomingCall(String(remoteMessage.data.requestId || ''));
  }
});

// Answer / Decline pressed on the ringing call while the app is not running in the foreground.
notifee.onBackgroundEvent(async (event) => {
  await handleCallEvent(event);
});

// Apply "luxury" controlled scroll physics globally
// Note: Android completely ignores custom float deceleration rates, it ONLY accepts 'fast' or 'normal'.
const LUXURY_DECELERATION = Platform.OS === 'ios' ? 0.992 : 'fast';

if (ScrollView.defaultProps == null) ScrollView.defaultProps = {};
ScrollView.defaultProps.decelerationRate = LUXURY_DECELERATION;

if (FlatList.defaultProps == null) FlatList.defaultProps = {};
FlatList.defaultProps.decelerationRate = LUXURY_DECELERATION;

if (SectionList.defaultProps == null) SectionList.defaultProps = {};
SectionList.defaultProps.decelerationRate = LUXURY_DECELERATION;

registerRootComponent(App);