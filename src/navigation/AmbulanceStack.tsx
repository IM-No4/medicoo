import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AmbulanceListScreen from '../features/ambulance/AmbulanceListScreen';
import AmbulanceDetailScreen from '../features/ambulance/AmbulanceDetailScreen';

export type AmbulanceStackParamList = {
  AmbulanceMain: undefined;
  AmbulanceDetail: { providerId: string };
};

const Stack = createNativeStackNavigator<AmbulanceStackParamList>();

export default function AmbulanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="AmbulanceMain"
        component={AmbulanceListScreen}
      />
      <Stack.Screen
        name="AmbulanceDetail"
        component={AmbulanceDetailScreen}
      />
    </Stack.Navigator>
  );
}
