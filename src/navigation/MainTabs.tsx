import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '../components/icons/AppIcon';
import CalendarStack from './CalendarStack';
import HealthStack from './HealthStack';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack';
import RecordsStack from './RecordsStack';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#2FA561';
const INACTIVE_COLOR = '#151517';

type Props = {
  onOpenCommandPalette: () => void;
};

export default function MainTabs({ onOpenCommandPalette }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => {
          const color = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const opacity = focused ? 1 : 0.45;

          let iconName: any;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Calendar':
              iconName = 'calendar';
              break;
            case 'Records':
              iconName = 'records';
              break;
            case 'Health':
              iconName = 'health';
              break;
            case 'Profile':
              iconName = 'profile';
              break;
            default:
              return null;
          }

          return (
            <View style={{ opacity }}>
              <AppIcon name={iconName} color={color} size={24} />
            </View>
          );
        },
      })}
    >
      {/* 👇 HOME TAB — PASS CALLBACK */}
      <Tab.Screen name="Home">
        {(props) => (
          <HomeStack
            {...props}
            onOpenCommandPalette={onOpenCommandPalette}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Calendar" component={CalendarStack} />
      <Tab.Screen name="Records" component={RecordsStack} />
      <Tab.Screen name="Health" component={HealthStack} />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', {
              screen: 'ProfileMain',
            });
          },
        })}
      />
    </Tab.Navigator>
  );
}
