import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import HospitalDetailScreen from '../features/hospitals/HospitalDetailScreen';
import HospitalListScreen from '../features/hospitals/HospitalListScreen';

export type HospitalStackParamList = {
  HospitalList: undefined;
  HospitalDetail: {
    hospitalId: string;
  };
};

const Stack = createNativeStackNavigator<HospitalStackParamList>();

export default function HospitalStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HospitalList" component={HospitalListScreen} />
      <Stack.Screen
        name="HospitalDetail"
        component={HospitalDetailScreen}
      />
    </Stack.Navigator>
  );
}
