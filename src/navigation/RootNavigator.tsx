import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { continueOffline, runBootSequence } from '../bootstrap/BootCoordinator';
import { useSystemUI } from '../bootstrap/useSystemUI';
import CommandPalette from '../command/CommandPalette';
import GlobalTrackingBanner from '../features/cart/GlobalTrackingBanner';
import LegalAcceptanceModal from '../components/modals/LegalAcceptanceModal';
import UpdateAvailableModal from '../components/modals/UpdateAvailableModal';
import MandatoryUpdateScreen from '../features/update/MandatoryUpdateScreen';
import MaintenanceScreen from '../features/maintenance/MaintenanceScreen';
import MaintenanceRestrictedBanner from '../features/maintenance/MaintenanceRestrictedBanner';
import OfflineGateScreen from '../features/offline/OfflineGateScreen';
import OnboardingStack from '../features/onboarding/OnboardingStack';
import { AppDispatch, RootState } from '../redux/store';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  useSystemUI();

  const dispatch = useDispatch<AppDispatch>();
  const boot = useSelector((state: RootState) => state.boot);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // The installed build is below the backend's minimumSupportedVersion
  // (BootCoordinator.ts) - no skip, blocks even a logged-out user, checked
  // before the offline branch below since an unsupported build is
  // unsupported regardless (in practice this only ever fires after a
  // successful config fetch, so the two are mutually exclusive anyway).
  if (boot.status === 'mandatoryUpdate') {
    return <MandatoryUpdateScreen />;
  }

  // Maintenance is on AND this user was confirmed to have no in-progress
  // order/consultation to protect (BootCoordinator.ts) - a user who does
  // is let in below, restricted, instead of reaching this branch at all.
  if (boot.status === 'maintenance') {
    return <MaintenanceScreen />;
  }

  // No internet reachable at launch (BootCoordinator's upfront check, before
  // anything else was even attempted) - "Try Again" re-runs the full boot
  // sequence, "Use in Offline Mode" trusts local state and proceeds without
  // requiring a network call to succeed. Neither of these touches
  // navigation state, so once past this gate the user lands on whatever
  // screen they'd normally land on - not stuck here again mid-session.
  if (boot.status === 'offline') {
    return (
      <OfflineGateScreen
        onRetry={() => runBootSequence(dispatch, { showLoadingState: false })}
        onUseOffline={() => continueOffline(dispatch)}
      />
    );
  }

  // 🔒 Absolute gate: nothing renders until boot is READY (App.tsx's
  // AppContent already guarantees this before RootNavigator ever mounts;
  // kept here too as a defensive no-op render, not a splash screen).
  if (boot.status !== 'ready') {
    return null;
  }

  return (
    <>
      <Stack.Navigator
        key={
          !boot.isAuthenticated
            ? 'auth'
            : boot.onboardingCompleted
            ? 'main'
            : 'onboarding'
        }
        screenOptions={{ headerShown: false }}
      >
        {!boot.isAuthenticated && (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}

        {boot.isAuthenticated && !boot.onboardingCompleted && (
          <Stack.Screen
            name="Onboarding"
            component={OnboardingStack}
          />
        )}

        {boot.isAuthenticated && boot.onboardingCompleted && (
          <Stack.Screen name="Main">
            {(props) => (
              <MainStack
                {...props}
                onOpenCommandPalette={() =>
                  setPaletteOpen(true)
                }
              />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>

      {/* 🌍 GLOBAL COMMAND PALETTE (outside navigation) */}
      <CommandPalette
        visible={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      {/* 📦 GLOBAL ORDER TRACKING BANNER (floats above bottom nav when order is active) */}
      {boot.isAuthenticated && boot.onboardingCompleted && (
        <GlobalTrackingBanner />
      )}

      {/* 🛠️ MAINTENANCE-RESTRICTED BANNER - decides for itself whether to
          render based on appConfig.restricted */}
      {boot.isAuthenticated && boot.onboardingCompleted && (
        <MaintenanceRestrictedBanner />
      )}

      {/* ⚖️ TERMS & PRIVACY RE-ACCEPTANCE GATE - decides for itself whether
          to actually render based on Redux state + local snooze timestamp */}
      {boot.isAuthenticated && boot.onboardingCompleted && (
        <LegalAcceptanceModal />
      )}

      {/* ⬆️ OPTIONAL UPDATE PROMPT - decides for itself whether to render
          based on appConfig.update + the version-specific dismissed state.
          Not gated on auth - a logged-out user on the Login screen should
          still see this. */}
      <UpdateAvailableModal />
    </>
  );
}
