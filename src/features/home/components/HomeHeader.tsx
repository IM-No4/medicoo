import { executeAction } from "@/src/actions/ActionExecutor";
import AppIcon from "@/src/components/icons/AppIcon";
import AddressSelectorBottomSheet from "@/src/components/modals/AddressSelectorBottomSheet";
import NotificationBell from "@/src/components/notification/NotificationBell";
import { setSelectedAddress } from "@/src/redux/slices/addressSlice";
import { setPrescriptionModalVisible } from "@/src/redux/slices/appSlice";
import { setCurrentLocation } from "@/src/redux/slices/locationSlice";
import { setUnreadCount } from "@/src/redux/slices/notificationSlice";
import { RootState } from "@/src/redux/store";
import { getUserAddresses } from "@/src/services/api/address.api";
import { getUnreadCustomerNotificationCount } from "@/src/services/api/notification.api";
import { reverseGeocode } from "@/src/services/api/maps.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useDispatch, useSelector } from "react-redux";

import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DynamicHeaderFeedItem } from "../feed/feed.types";

type Props = {
  scrollY: Animated.Value;
  maxHeight: number;
  onOpenCommandPalette: () => void;
  dynamicConfig?: DynamicHeaderFeedItem;
};

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

let hasInitializedSession = false;

export default function HomeHeader({
  scrollY,
  maxHeight,
  onOpenCommandPalette,
  dynamicConfig,
}: Props) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const [addressSelectorVisible, setAddressSelectorVisible] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const getAddressIcon = (label?: string) => {
    switch (label) {
      case "Home":
        return "home";
      case "Work":
        return "briefcase";
      default:
        return "map-pin";
    }
  };

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, maxHeight],
    outputRange: [0, -maxHeight],
    extrapolate: "clamp",
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, maxHeight * 0.6],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const gradientOverlayOpacity = scrollY.interpolate({
    inputRange: [0, maxHeight * 0.6, maxHeight],
    outputRange: [0, 0.18, 0.35],
    extrapolate: "clamp",
  });

  const gradientStart = Platform.select({
    ios: { x: 0, y: 0 },
    android: { x: 0.2, y: 0 },
  });

  const gradientEnd = Platform.select({
    ios: { x: 1, y: 0.9 },
    android: { x: 0.8, y: 1 },
  });

  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );

  React.useEffect(() => {
    const initLocation = async () => {
      // Only run auto-selection logic once per app session (cold start)
      if (hasInitializedSession) return;
      hasInitializedSession = true;

      setIsFetchingLocation(true);
      try {
        // First, fetch all saved addresses
        let savedAddresses: any[] = [];
        try {
          savedAddresses = await getUserAddresses();
        } catch (err) {
          console.warn("Failed to fetch addresses for proximity check", err);
        }

        // If no saved addresses exist, do not prompt for location yet
        if (!savedAddresses || savedAddresses.length === 0) {
          return;
        }

        // Saved addresses exist, so check user's current location
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.warn("Location permission denied");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = loc.coords;

        dispatch(
          setCurrentLocation({
            latitude,
            longitude,
          }),
        );

        // Check for any existing location within 25 meters
        const nearbyAddress = savedAddresses.find((addr) => {
          const addrLat = addr.location?.coordinates?.[1] || addr.latitude;
          const addrLng = addr.location?.coordinates?.[0] || addr.longitude;
          if (!addrLat || !addrLng) return false;
          return getDistance(latitude, longitude, addrLat, addrLng) <= 25;
        });

        if (nearbyAddress) {
          dispatch(
            setSelectedAddress({
              id: nearbyAddress._id || nearbyAddress.id,
              label: nearbyAddress.label,
              fullAddress: nearbyAddress.fullAddress,
              latitude:
                nearbyAddress.location?.coordinates?.[1] ||
                nearbyAddress.latitude,
              longitude:
                nearbyAddress.location?.coordinates?.[0] ||
                nearbyAddress.longitude,
            }),
          );
        } else {
          // 1. Check local storage for cached address within 25m
          try {
            const cachedData = await AsyncStorage.getItem(
              "@cached_current_location",
            );
            if (cachedData) {
              const parsedCache = JSON.parse(cachedData);
              if (parsedCache.latitude && parsedCache.longitude) {
                const dist = getDistance(
                  latitude,
                  longitude,
                  parsedCache.latitude,
                  parsedCache.longitude,
                );
                if (dist <= 25) {
                  dispatch(
                    setSelectedAddress({
                      label: "Current Location",
                      fullAddress: parsedCache.addressStr,
                      latitude,
                      longitude,
                    }),
                  );
                  return; // Skip the API call completely
                } else {
                  // Not valid anymore, clear it
                  await AsyncStorage.removeItem("@cached_current_location");
                }
              }
            }
          } catch (err) {
            console.warn("Failed to read cached location", err);
          }

          // 2. Reverse geocoding via backend proxy (key stays server-side)
          try {
            const data = await reverseGeocode(latitude, longitude);

            if (data.results && data.results.length > 0) {
              const addressStr = data.results[0].formatted_address;

              dispatch(
                setSelectedAddress({
                  label: "Current Location",
                  fullAddress: addressStr,
                  latitude,
                  longitude,
                }),
              );

              // 3. Update the local storage with the new fetched location
              try {
                await AsyncStorage.setItem(
                  "@cached_current_location",
                  JSON.stringify({
                    latitude,
                    longitude,
                    addressStr,
                  }),
                );
              } catch (err) {
                console.warn("Failed to save cached location", err);
              }
            }
          } catch (error) {
            console.warn("Google Maps reverse geocode failed:", error);
          }
        }
      } finally {
        setIsFetchingLocation(false);
      }
    };

    initLocation();
  }, [dispatch]); // Run strictly on mount

  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await getUnreadCustomerNotificationCount();
        dispatch(setUnreadCount(response?.data?.unreadCount || 0));
      } catch {
        // Ignore unread count errors; the bell can still work on screen open
      }
    };

    void loadUnreadCount();
  }, [dispatch]);

  const headerColors = dynamicConfig?.colors || ["#2FA561", "#0E7439"];

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
          source={require("../../../assets/images/noise.png")}
          resizeMode="repeat"
          blurRadius={1}
          style={[StyleSheet.absoluteFill, { opacity: 0.04 }]}
        />

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#ffffff", opacity: gradientOverlayOpacity },
          ]}
        />

        <Animated.View style={{ opacity: contentOpacity }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAddressSelectorVisible(true)}
          >
            <View style={styles.addressRow}>
              <AppIcon
                name={getAddressIcon(selectedAddress?.label)}
                size={20}
                color="#ffffff"
              />

              <Text style={styles.addressText} numberOfLines={1}>
                {isFetchingLocation
                  ? "Fetching location..."
                  : selectedAddress?.label ||
                    selectedAddress?.fullAddress ||
                    "Delivering to current location"}
              </Text>

              <AppIcon name="chevron-down" size={16} color="#ffffff" />
            </View>

            <Text style={styles.addressSub} numberOfLines={1}>
              {isFetchingLocation
                ? "Please wait..."
                : selectedAddress?.fullAddress &&
                    selectedAddress?.label !== selectedAddress?.fullAddress
                  ? selectedAddress.fullAddress.length > 50
                    ? selectedAddress.fullAddress.substring(0, 50) + "..."
                    : selectedAddress.fullAddress
                  : "Tap to change delivery address"}
            </Text>
          </TouchableOpacity>

          {/* 🔍 SEARCH BAR CONTAINER */}
          <View style={styles.searchBar}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.searchLeft}
              onPress={() => executeAction("OPEN_GLOBAL_SEARCH")}
            >
              <AppIcon name="search" size={18} color="#6B7280" />
              <Text style={styles.searchPlaceholder}>
                Search medicines, doctors, labs
              </Text>
            </TouchableOpacity>

            {/* 📄 SCAN / UPLOAD RX */}
            <TouchableOpacity
              style={styles.scannerButton}
              activeOpacity={0.8}
              onPress={() => dispatch(setPrescriptionModalVisible(true))}
            >
              <AppIcon name="scan" size={18} color="#1a998e" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.iconWrapper}>
          <NotificationBell
            onPress={() => executeAction("OPEN_NOTIFICATIONS")}
          />
        </View>
      </Animated.View>

      <AddressSelectorBottomSheet
        visible={addressSelectorVisible}
        onClose={() => setAddressSelectorVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 18,
    zIndex: 10,
    justifyContent: "flex-end",
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: "hidden",
  },
  greeting: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  name: {
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  searchBar: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  searchLeft: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchPlaceholder: {
    color: "#6B7280",
    fontSize: 14,
  },
  scannerButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E6F4F1",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "absolute",
    right: 16,
    top: 52,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  addressText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    maxWidth: "80%",
  },

  addressSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 12,
  },
});
