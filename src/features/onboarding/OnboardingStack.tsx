import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { OnboardingProvider } from './OnboardingContext';

import HealthProfileScreen from './HealthProfileScreen';

const Stack = createNativeStackNavigator();

export default function OnboardingStack() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HealthProfile" component={HealthProfileScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
