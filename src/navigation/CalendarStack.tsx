import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CalendarScreen from '../features/calendar/CalendarScreen';
import CalendarMonthScreen from '../features/calendar/CalendarMonthScreen';

export type CalendarStackParamList = {
  CalendarMain: undefined;
  CalendarMonth: { initialDate?: Date; onSelectDate?: (date: Date) => void } | undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export default function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
      />
      <Stack.Screen
        name="CalendarMonth"
        component={CalendarMonthScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
}
