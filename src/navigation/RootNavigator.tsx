import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { useSystemUI } from '../bootstrap/useSystemUI';
import CommandPalette from '../command/CommandPalette';
import OnboardingStack from '../features/onboarding/OnboardingStack';
import SplashScreen from '../features/splash/SplashScreen';
import { RootState } from '../redux/store';
import AuthStack from './AuthStack';
import MainStack from './MainStack';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  useSystemUI();

  const boot = useSelector((state: RootState) => state.boot);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // 🔒 Absolute gate: nothing renders until boot is READY
  if (boot.status !== 'ready') {
    return <SplashScreen />;
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
    </>
  );
}
