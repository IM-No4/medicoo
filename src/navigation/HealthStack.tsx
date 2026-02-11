import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HealthScreen from '../features/health/HealthScreen';

export type HealthStackParamList = {
  HealthMain: undefined;
};

const Stack = createNativeStackNavigator<HealthStackParamList>();

export default function HealthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HealthMain"
        component={HealthScreen}
      />
    </Stack.Navigator>
  );
}
