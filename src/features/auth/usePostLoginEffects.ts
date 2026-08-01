import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { syncPushToken } from '../../bootstrap/pushNotifications';
import { RootState } from '../../redux/store';
import {
    initializeSocket,
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
      syncPushToken();
      return;
    }

    // User logged out OR not onboarded → clean up
    resetSocketState();
  }, [isReady]);
}
