import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
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

const PROFILE_ROOT_SCREEN = 'ProfileMain';

// Only the Profile tab has been asked to hide the bar on its sub-screens -
// other tabs keep their existing always-visible behavior.
const isNestedStackOnSubScreen = (route: RouteProp<any, any>) => {
  if (route.name !== 'Profile') return false;
  const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? PROFILE_ROOT_SCREEN;
  return focusedRouteName !== PROFILE_ROOT_SCREEN;
};

export default function MainTabs({ onOpenCommandPalette }: Props) {
  const insets = useSafeAreaInsets();

  const baseTabBarStyle = {
    backgroundColor: '#ffffff',
    borderTopWidth: 0,
    height: 64 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 8,
  };

  return (
    <Tab.Navigator
      // Default is 'firstRoute', which always sends the back button to
      // whichever tab is declared first (Home) regardless of where the user
      // actually came from. 'history' returns to the last tab that was
      // actually focused instead (e.g. Health -> Calendar -> back -> Health).
      backBehavior="history"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        // Only the tab's own root screen keeps the bar - anything pushed on
        // top within a nested stack (e.g. Profile's sub-screens) hides it,
        // since those are drill-down detail views, not tab destinations.
        tabBarStyle: isNestedStackOnSubScreen(route) ? { display: 'none' } : baseTabBarStyle,
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
