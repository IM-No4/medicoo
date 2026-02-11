import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import PrescriptionUploadModal from '@/src/components/modals/PrescriptionUploadModal';
import NotificationBell from '@/src/components/notification/NotificationBell';
import { setCurrentLocation } from '@/src/redux/slices/locationSlice';
import { RootState } from '@/src/redux/store';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';

import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicHeaderFeedItem } from '../feed/feed.types';

type Props = {
  scrollY: Animated.Value;
  maxHeight: number;
  onOpenCommandPalette: () => void;
  dynamicConfig?: DynamicHeaderFeedItem;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeHeader({ scrollY, maxHeight, onOpenCommandPalette, dynamicConfig }: Props) {
  const insets = useSafeAreaInsets();
  const [uploadVisible, setUploadVisible] = useState(false);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, maxHeight],
    outputRange: [0, -maxHeight],
    extrapolate: 'clamp',
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, maxHeight * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const gradientOverlayOpacity = scrollY.interpolate({
    inputRange: [0, maxHeight * 0.6, maxHeight],
    outputRange: [0, 0.18, 0.35],
    extrapolate: 'clamp',
  });

  const gradientStart = Platform.select({
    ios: { x: 0, y: 0 },
    android: { x: 0.2, y: 0 },
  });

  const gradientEnd = Platform.select({
    ios: { x: 1, y: 0.9 },
    android: { x: 0.8, y: 1 },
  });

  const dispatch = useDispatch();

  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress
  );

  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation
  );

  React.useEffect(() => {
    const initLocation = async () => {
      // If user already selected an address, do nothing
      if (selectedAddress) return;

      // If we already have GPS location, do nothing
      if (currentLocation) return;

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.warn('Location permission denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      dispatch(
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
      );
    };

    initLocation();
  }, [selectedAddress, currentLocation, dispatch]);
  const userName = dynamicConfig?.userName || 'Amrit';
  const greeting = dynamicConfig?.greeting || getGreeting();
  const headerColors = dynamicConfig?.colors || ['#2FA561', '#0E7439'];

  return (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: maxHeight + insets.top,
            paddingTop: insets.top,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={headerColors as any}
          start={gradientStart}
          end={gradientEnd}
          style={StyleSheet.absoluteFill}
        />

        <Image
          source={require('../../../assets/images/noise.png')}
          resizeMode="repeat"
          blurRadius={1}
          style={[StyleSheet.absoluteFill, { opacity: 0.04 }]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#ffffff', opacity: gradientOverlayOpacity },
          ]}
        />

        <Animated.View style={{ opacity: contentOpacity }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => executeAction('OPEN_ADDRESS_SELECTOR')}
          >
            <View style={styles.addressRow}>
              <AppIcon name="map-pin" size={16} color="#ffffff" />

              <Text
                style={styles.addressText}
                numberOfLines={1}
              >
                {selectedAddress?.label ||
                  selectedAddress?.fullAddress ||
                  'Delivering to current location'}
              </Text>

              <AppIcon
                name="chevron-down"
                size={16}
                color="#ffffff"
              />
            </View>

            <Text style={styles.addressSub}>
              Tap to change delivery address
            </Text>
          </TouchableOpacity>

          {/* 🔍 GLOBAL SEARCH */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.searchBar}
            onPress={() => executeAction('OPEN_GLOBAL_SEARCH')}
          >
            <View style={styles.searchLeft}>
              <AppIcon name="search" size={18} color="#6B7280" />
              <Text style={styles.searchPlaceholder}>
                Search medicines, doctors, labs
              </Text>
            </View>

            {/* 📄 SCAN / UPLOAD RX */}
            <TouchableOpacity
              style={styles.scannerButton}
              activeOpacity={0.8}
              onPress={() => setUploadVisible(true)}
            >
              <AppIcon name="scan" size={18} color="#1a998e" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.iconWrapper}>
          <NotificationBell
            onPress={() => executeAction('OPEN_NOTIFICATIONS')}
          />
        </View>
      </Animated.View>

      {/* 📄 PRESCRIPTION MODAL */}
      <PrescriptionUploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        existingPrescriptions={[
          {
            id: 'RX001',
            doctorName: 'Dr. Rajesh Kumar',
            prescriptionDate: '2025-01-15',
            items: 3,
            diagnosis: 'Common Cold & Fever',
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    zIndex: 10,
    justifyContent: 'flex-end',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  greeting: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
  },
  name: {
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  searchBar: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchPlaceholder: {
    color: '#6B7280',
    fontSize: 14,
  },
  scannerButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'absolute',
    right: 16,
    top: 52,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  addressText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '80%',
  },

  addressSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 12,
  },
});
