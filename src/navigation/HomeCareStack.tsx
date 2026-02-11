import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import HomeCareDetailScreen from '../features/homecare/HomeCareDetailScreen';
import HomeCareListScreen from '../features/homecare/HomeCareListScreen';

export type HomeCareStackParamList = {
  HomeCareList: undefined;
  HomeCareDetail: {
    serviceId: string;
  };
};

const Stack = createNativeStackNavigator<HomeCareStackParamList>();

export default function HomeCareStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HomeCareList"
        component={HomeCareListScreen}
      />
      <Stack.Screen
        name="HomeCareDetail"
        component={HomeCareDetailScreen}
      />
    </Stack.Navigator>
  );
}
