import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import {
    initializeSocket,
    resetSocketState,
} from '../../services/socketService';

export function usePostLoginEffects() {
  const { isAuthenticated, onboardingComplete } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // User is fully ready → start services
    if (isAuthenticated && onboardingComplete) {
      initializeSocket();
      // syncCartFromServer(); ← later
      return;
    }

    // User logged out OR not onboarded → clean up
    resetSocketState();
  }, [isAuthenticated, onboardingComplete]);
}
