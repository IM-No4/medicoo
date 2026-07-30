import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, ChevronRight, Package } from 'lucide-react-native';
import { RootState } from '../../redux/store';
import { navigationRef } from '../../navigation/navigationRef';

const STATUS_LABELS: Record<string, string> = {
  pending:        'Awaiting Confirmation',
  accepted:       'Preparing Medicines',
  preparing:      'Preparing Medicines',
  readyForPickup: 'Assigning Rider',
  pickedUp:       'Out for Delivery',
  dispatched:     'Out for Delivery',
  delivered:      'Delivered!',
};

const STATUS_COLORS: Record<string, string> = {
  pending:        '#F59E0B',
  accepted:       '#F59E0B',
  preparing:      '#F59E0B',
  readyForPickup: '#3B82F6',
  pickedUp:       '#10B981',
  dispatched:     '#10B981',
  delivered:      '#10B981',
};

export default function GlobalTrackingBanner() {
  const insets = useSafeAreaInsets();
  const activeOrder = useSelector((state: RootState) => state.order.activeOrder);

  const [currentRouteName, setCurrentRouteName] = useState<string | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isInProfileScreen, setIsInProfileScreen] = useState(false);

  useEffect(() => {
    const checkRoute = () => {
      if (navigationRef.isReady()) {
        const state = navigationRef.getState();
        const route = navigationRef.getCurrentRoute();
        const currentName = route?.name ?? null;
        setCurrentRouteName(currentName);

        // Traverse the navigation tree to check if the 'Profile' navigator stack is active
        const checkIfProfileActive = (navState: any): boolean => {
          if (!navState || !navState.routes) return false;
          const activeIndex = navState.index ?? 0;
          const activeRoute = navState.routes[activeIndex];
          
          if (activeRoute?.name === 'Profile') {
            return true;
          }
          if (activeRoute?.state) {
            return checkIfProfileActive(activeRoute.state);
          }
          return false;
        };
        setIsInProfileScreen(checkIfProfileActive(state));

        // Explicit list of known tab root screens to match instantly on boot
        const TAB_ROOT_SCREENS = [
          'HomeMain',
          'CalendarMain',
          'RecordsHome',
          'HealthMain',
          'ProfileMain',
          'Home',
          'Calendar',
          'Records',
          'Health',
          'Profile'
        ];

        if (currentName && TAB_ROOT_SCREENS.includes(currentName)) {
          setIsTabVisible(true);
        } else {
          // Traverse the navigation tree to check if the 'Tabs' navigator is currently active
          const checkIfTabsActive = (navState: any): boolean => {
            if (!navState || !navState.routes) return false;
            const activeIndex = navState.index ?? 0;
            const activeRoute = navState.routes[activeIndex];
            
            if (activeRoute?.name === 'Tabs') {
              return true;
            }
            if (activeRoute?.state) {
              return checkIfTabsActive(activeRoute.state);
            }
            return false;
          };
          setIsTabVisible(checkIfTabsActive(state));
        }
      }
    };

    // Run check immediately
    checkRoute();

    // Set up listeners for navigation ready state and routing changes
    const unsubscribeState = navigationRef.addListener('state', checkRoute);
    const unsubscribeReady = navigationRef.addListener('ready', checkRoute);

    // Bootstrap fallback checks to guarantee correct alignment after startup finishes
    const timer1 = setTimeout(checkRoute, 500);
    const timer2 = setTimeout(checkRoute, 1200);

    return () => {
      unsubscribeState();
      unsubscribeReady();
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const translateY = useRef(new Animated.Value(120)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const prevVisible = useRef(false);

  // Slide in / slide out
  useEffect(() => {
    const shouldShow = !!activeOrder && activeOrder.status !== 'delivered' && currentRouteName !== 'LiveTracking' && !isInProfileScreen;
    if (shouldShow === prevVisible.current) return;
    prevVisible.current = shouldShow;

    Animated.spring(translateY, {
      toValue: shouldShow ? 0 : 120,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeOrder, currentRouteName, isInProfileScreen, translateY]);

  // Subtle pulse on the status dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  if (!activeOrder || activeOrder.status === 'delivered' || currentRouteName === 'LiveTracking' || isInProfileScreen) {
    return null;
  }

  const statusLabel = STATUS_LABELS[activeOrder.status] ?? 'Tracking Order';
  const statusColor = STATUS_COLORS[activeOrder.status] ?? '#089643';

  const handlePress = () => {
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('CartStack', { screen: 'LiveTracking' });
    }
  };

  // Adjust bottom offset dynamically depending on whether bottom tabs are visible
  const bottomOffset = isTabVisible
    ? (insets.bottom > 0 ? insets.bottom + 72 : 80) // Above bottom tab bar
    : (insets.bottom > 0 ? insets.bottom + 16 : 16); // Normal floating banner at bottom of screen

  return (
    <Animated.View
      style={[
        styles.bannerWrapper,
        { bottom: bottomOffset, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.92}
      >
        {/* Left: icon + info */}
        <View style={styles.left}>
          <View style={[styles.iconCircle, { backgroundColor: statusColor + '20' }]}>
            {activeOrder.status === 'dispatched' || activeOrder.status === 'pickedUp' ? (
              <MapPin size={16} color={statusColor} />
            ) : (
              <Package size={16} color={statusColor} />
            )}
          </View>
          <View style={styles.info}>
            <View style={styles.statusRow}>
              <Animated.View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusColor, transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <Text style={styles.storeText} numberOfLines={1}>
              {activeOrder.storeName}
            </Text>
          </View>
        </View>

        {/* Right: amount + chevron */}
        <View style={styles.right}>
          <Text style={styles.amountText}>₹{activeOrder.amount.toLocaleString('en-IN')}</Text>
          <ChevronRight size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bannerWrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  storeText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
    fontWeight: '500',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
});
