import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '../components/icons/AppIcon';
import { RootState } from '../redux/store';
import { useTheme } from '../theme/ThemeContext';
import CalendarStack from './CalendarStack';
import HealthStack from './HealthStack';
import HomeStack from './HomeStack';
import ProfileStack from './ProfileStack';
import RecordsStack from './RecordsStack';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#10B981';

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
  const { theme, isDark } = useTheme();
  const inactiveColor = isDark ? '#E2E8F0' : '#151517';

  // Offline mode is a single self-contained hub (see HomeScreen's early
  // return + OfflineHomeContent) rather than a normal tabbed app - there's
  // nothing else offline-specific behind the other tabs to switch to, and
  // the hub's own shortcut cards already push straight into the
  // offline-capable screens (Log Vitals, Manage Medications, etc.) that
  // matter. Hiding the bar removes a set of destinations that would mostly
  // just show their own "couldn't load" states right now.
  const isOnline = useSelector((state: RootState) => state.connectivity.isOnline);
  const friendInviteCount = useSelector((state: RootState) => state.friends.incomingRequests.length);

  const baseTabBarStyle = {
    backgroundColor: theme.card,
    borderTopWidth: 0,
    height: 60 + insets.bottom,
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
        tabBarStyle: (!isOnline || isNestedStackOnSubScreen(route)) ? { display: 'none' } : baseTabBarStyle,
        // With app.json's edgeToEdgeEnabled, Android's system nav bar is
        // fully transparent and the app draws behind it - tabBarStyle's own
        // backgroundColor doesn't reliably survive that on every device
        // (bottom-tabs computes its layout against the transparent inset
        // before applying the style), leaving a see-through strip under the
        // gesture bar. Rendering an explicit solid layer behind the bar's
        // own content is the documented, reliable fix.
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: theme.card }} />,
        tabBarIcon: ({ focused }) => {
          const color = focused ? ACTIVE_COLOR : inactiveColor;
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
      <Tab.Screen
        name="Health"
        component={HealthStack}
        // Friends waiting for an answer. A badge sits over the icon's corner, so nothing in the bar moves.
        options={{
          tabBarBadge: friendInviteCount > 0 ? friendInviteCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: 10, minWidth: 16, height: 16, lineHeight: 15 },
        }}
      />
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
