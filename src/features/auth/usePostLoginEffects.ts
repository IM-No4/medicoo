import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSelector } from 'react-redux';
import { syncPushToken } from '../../bootstrap/pushNotifications';
import { RootState } from '../../redux/store';
import {
    initializeSocket,
    restoreActiveOrders,
    resetSocketState,
} from '../../services/socketService';

export function usePostLoginEffects() {
  const boot = useSelector((state: RootState) => state.boot);
  const auth = useSelector((state: RootState) => state.auth);

  const isReady =
    (boot.status === 'ready' && boot.isAuthenticated && boot.onboardingCompleted) ||
    (auth.isAuthenticated && auth.onboardingComplete);

  useEffect(() => {
    // User is fully ready → start services
    if (isReady) {
      initializeSocket();
      restoreActiveOrders();
      syncPushToken();
      // Coming back to the app: the order may have moved on (or been placed) while it was in the background.
      const sub = AppState.addEventListener('change', (next) => {
        if (next === 'active') restoreActiveOrders();
      });
      return () => sub.remove();
    }

    // User logged out OR not onboarded → clean up
    resetSocketState();
  }, [isReady]);
}
