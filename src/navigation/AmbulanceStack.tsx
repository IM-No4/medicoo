import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AmbulanceScreen from '../features/ambulance/AmbulanceScreen';

export type AmbulanceStackParamList = {
  AmbulanceMain: undefined;
};

const Stack = createNativeStackNavigator<AmbulanceStackParamList>();

export default function AmbulanceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="AmbulanceMain"
        component={AmbulanceScreen}
      />
    </Stack.Navigator>
  );
}
