import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { OnboardingProvider } from './OnboardingContext';

import HealthProfileScreen from './HealthProfileScreen';
import MedicalDisclaimerOnboardingScreen from './MedicalDisclaimerOnboardingScreen';

const Stack = createNativeStackNavigator();

// MedicalDisclaimer is listed first, so it's this navigator's initial
// route - every user who reaches onboarding (RootNavigator only mounts
// this stack while boot.onboardingCompleted is false) sees it before
// HealthProfile. It always shows on each mount rather than being skipped
// via a persisted flag, deliberately: onboardingCompleted only flips once
// HealthProfile is actually submitted, so re-opening the app mid-onboarding
// re-mounts this stack anyway - showing the disclaimer again in that case
// is a minor one-tap repeat, not a real cost, and guarantees it's never
// silently skipped for a Play Store reviewer's fresh test account.
export default function OnboardingStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MedicalDisclaimerOnboarding" component={MedicalDisclaimerOnboardingScreen} />
        <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
