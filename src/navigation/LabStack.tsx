import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import LabDetailScreen from '../features/labs/LabDetailScreen';
import LabListScreen from '../features/labs/LabListScreen';

export type LabStackParamList = {
  LabList: undefined;
  LabDetail: {
    labId: string;
  };
};

const Stack = createNativeStackNavigator<LabStackParamList>();

export default function LabStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LabList" component={LabListScreen} />
      <Stack.Screen name="LabDetail" component={LabDetailScreen} />
    </Stack.Navigator>
  );
}
