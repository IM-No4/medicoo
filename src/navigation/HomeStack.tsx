import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import HomeScreen from '../features/home/HomeScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Notifications: undefined;
};

type Props = {
  onOpenCommandPalette: () => void;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack({ onOpenCommandPalette }: Props) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain">
        {(props) => (
          <HomeScreen
            {...props}
            onOpenCommandPalette={onOpenCommandPalette}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  );
}
