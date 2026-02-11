import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CalendarScreen from '../features/calendar/CalendarScreen';

export type CalendarStackParamList = {
  CalendarMain: undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export default function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
      />
    </Stack.Navigator>
  );
}
