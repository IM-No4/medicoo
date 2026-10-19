import { useMemo } from 'react';
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
import { reverseGeocode } from "@/src/services/api/maps.api";
import { getUnreadCustomerNotificationCount } from "@/src/services/api/notification.api";
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
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

type Props = {
  scrollY: Animated.Value;
  // The header's TRUE total on-screen height in px - i.e. the collapsible
  // content height PLUS the safe-area top inset PLUS
  // HOME_HEADER_ANDROID_EXTRA_TOP, all already summed by the caller
  // (HomeScreen.tsx). Every scroll-collapse calculation below
  // (headerTranslateY/contentOpacity/gradientOverlayOpacity) measures
  // against this one number, so the header always fully translates off
  // screen with nothing left stuck, no matter what that total actually
  // comes out to on a given device/OS. Passing anything smaller than the
  // header's real rendered height (e.g. just the collapsible content
  // height, ignoring the safe-area inset) is exactly what used to leave a
  // sliver of the header stuck on screen after a full scroll.
  maxHeight: number;
  onOpenCommandPalette: () => void;
  dynamicConfig?: DynamicHeaderFeedItem;
};

// Manually bounding the length (rather than leaning on numberOfLines'
// pixel-width ellipsis alone) is what lets the chevron sit right beside
// the label instead of miles away at the end of a flexed, full-width row.
const truncateAddressLabel = (label: string): string =>
  label.length > 25 ? `${label.slice(0, 25)}...` : label;

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

// How close (metres) the user must be to a saved address for it to be auto-selected.
const SAVED_ADDRESS_MATCH_METERS = 100;

let hasInitializedSession = false;

// Extra breathing room above the address row on Android. Exported (rather
// than each caller guessing a number) because HomeScreen.tsx needs this
// exact same value to compute the header's TRUE total on-screen height -
// see the big comment on `maxHeight` below for why that matters.
export const HOME_HEADER_ANDROID_EXTRA_TOP = Platform.OS === 'android' ? 24 : 0;

export default function HomeHeader({
  scrollY,
  maxHeight,
  onOpenCommandPalette,
  dynamicConfig,
}: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const hasSelectedRef = React.useRef(false);
  hasSelectedRef.current = !!selectedAddress;
  const carts = useSelector((state: RootState) => state.cart);
  // Distinct items across every store's cart - same count CartScreen.tsx
  // itself uses ("Medicine Order (N items)"), so the badge always agrees
  // with what the Cart screen shows.
  const cartItemCount = Object.values(carts).reduce(
    (sum: number, c: any) => sum + Object.keys(c.items).length,
    0,
  );

  React.useEffect(() => {
    const coordsOf = (addr: any) => ({
      latitude: addr.location?.coordinates?.[1] ?? addr.latitude,
      longitude: addr.location?.coordinates?.[0] ?? addr.longitude,
    });

    const selectSaved = (addr: any) => {
      const { latitude, longitude } = coordsOf(addr);
      dispatch(
        setSelectedAddress({
          id: addr._id || addr.id,
          label: addr.label,
          fullAddress: addr.fullAddress,
          latitude,
          longitude,
        }),
      );
    };

    const initLocation = async () => {
      // Only run auto-selection once per app session (cold start) - but see the
      // reset at the bottom: a run that selected nothing may be retried.
      if (hasInitializedSession) return;
      hasInitializedSession = true;

      let selected = false;
      setIsFetchingLocation(true);
      try {
        // Saved addresses are the primary source and also the fallback below.
        let savedAddresses: any[] = [];
        try {
          savedAddresses = (await getUserAddresses()) || [];
        } catch (err) {
          console.warn("Failed to fetch addresses for proximity check", err);
        }

        // Where is the user right now? (null when permission is denied / no fix)
        let position: { latitude: number; longitude: number } | null = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            // A last-known fix is instant, but only trust it while it is fresh -
            // a stale one can put the user streets away from where they are.
            const last = await Location.getLastKnownPositionAsync({
              maxAge: 2 * 60 * 1000,
              requiredAccuracy: 150,
            }).catch(() => null);
            const loc =
              last ||
              (await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              }));
            position = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            dispatch(setCurrentLocation(position));
          } else {
            console.warn("Location permission denied");
          }
        } catch (err) {
          console.warn("Could not read current location", err);
        }

        // The saved address to use when the live location can't produce one:
        // the default one, else the first (the list is newest/default first).
        const fallbackSaved =
          savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

        if (position) {
          const { latitude, longitude } = position;

          // 1. At (or right next to) a saved address? Use the closest one. GPS
          // is only good to a few tens of metres, and the address list already
          // shows "0.0 km" for anything under ~50 m, so a 25 m cut-off was
          // skipping addresses the user is standing at.
          const nearbyAddress = savedAddresses
            .map((addr) => {
              const c = coordsOf(addr);
              const dist =
                c.latitude && c.longitude
                  ? getDistance(latitude, longitude, c.latitude, c.longitude)
                  : Infinity;
              return { addr, dist };
            })
            .filter((x) => x.dist <= SAVED_ADDRESS_MATCH_METERS)
            .sort((a, b) => a.dist - b.dist)[0]?.addr;
          if (nearbyAddress) {
            selectSaved(nearbyAddress);
            selected = true;
            return;
          }

          // 2. Cached reverse-geocode for this spot (within 25 m)
          try {
            const cachedData = await AsyncStorage.getItem("@cached_current_location");
            if (cachedData) {
              const parsedCache = JSON.parse(cachedData);
              if (parsedCache.latitude && parsedCache.longitude && parsedCache.addressStr) {
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
                  selected = true;
                  return;
                }
                await AsyncStorage.removeItem("@cached_current_location");
              }
            }
          } catch (err) {
            console.warn("Failed to read cached location", err);
          }

          // 3. Reverse geocoding via backend proxy (key stays server-side)
          try {
            const data = await reverseGeocode(latitude, longitude);
            const addressStr = data?.results?.[0]?.formatted_address;
            if (addressStr) {
              dispatch(
                setSelectedAddress({
                  label: "Current Location",
                  fullAddress: addressStr,
                  latitude,
                  longitude,
                }),
              );
              selected = true;
              try {
                await AsyncStorage.setItem(
                  "@cached_current_location",
                  JSON.stringify({ latitude, longitude, addressStr }),
                );
              } catch (err) {
                console.warn("Failed to save cached location", err);
              }
              return;
            }
          } catch (error) {
            console.warn("Reverse geocode failed:", error);
          }

          // Geocoding gave nothing: a saved address beats an empty header.
          if (fallbackSaved) {
            selectSaved(fallbackSaved);
            selected = true;
            return;
          }

          // No saved address and no street address - still show where we are
          // (and keep feed/serviceability working) rather than the generic text.
          dispatch(
            setSelectedAddress({
              label: "Current Location",
              fullAddress: t("delivering_current_location"),
              latitude,
              longitude,
            }),
          );
          selected = true;
          return;
        }

        // No live location (permission denied / no fix): use a saved address.
        if (fallbackSaved) {
          selectSaved(fallbackSaved);
          selected = true;
        }
      } finally {
        setIsFetchingLocation(false);
        // Nothing resolved (e.g. network was down on launch): let the next
        // mount try again instead of staying on the generic text all session.
        if (!selected) hasInitializedSession = false;
      }
    };

    // Don't override an address the user (or a previous mount) already chose.
    if (!hasSelectedRef.current) void initLocation();
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

  const headerColors = dynamicConfig?.colors || ["#10B981", "#007C69"];

  return (
    <>
      <Animated.View
        style={[
          styles.headerContainer,
          {
            // maxHeight IS the true total height now (see the Props
            // comment) - no more adding insets.top on top of it here,
            // which used to make this box taller than the distance
            // headerTranslateY actually moves it by.
            height: maxHeight,
            paddingTop: insets.top + HOME_HEADER_ANDROID_EXTRA_TOP,
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
            { backgroundColor: theme.card, opacity: gradientOverlayOpacity },
          ]}
        />

        {/* Top row: address dropdown (fades on scroll) and cart/bell icons
            (always visible) side by side - these used to be laid out as an
            absolutely-positioned icon row floating over the bottom-anchored
            address block, which overlapped it (worst on Android's shorter
            status bar inset), making the address row's own chevron-down
            appear to sit right on top of the bell icon. */}
        <View style={styles.topRow}>
          <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
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
                  {truncateAddressLabel(
                    isFetchingLocation
                      ? t('fetching_location')
                      : selectedAddress?.label ||
                          selectedAddress?.fullAddress ||
                          t('delivering_current_location'),
                  )}
                </Text>

                <AppIcon name="chevron-down" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.iconWrapper}>
            <TouchableOpacity
              style={styles.cartIconBtn}
              activeOpacity={0.7}
              onPress={() => executeAction("OPEN_CART")}
              hitSlop={10}
            >
              <AppIcon name="shopping-cart" size={20} color="#ffffff" />
              {cartItemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <NotificationBell
              onPress={() => executeAction("OPEN_NOTIFICATIONS")}
            />
          </View>
        </View>

        <Animated.View style={{ opacity: contentOpacity }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setAddressSelectorVisible(true)}
          >
            <Text style={styles.addressSub} numberOfLines={1}>
              {isFetchingLocation
                ? t('please_wait')
                : selectedAddress?.fullAddress &&
                    selectedAddress?.label !== selectedAddress?.fullAddress
                  ? selectedAddress.fullAddress.length > 25
                    ? selectedAddress.fullAddress.substring(0, 25) + "..."
                    : selectedAddress.fullAddress
                  : t('tap_change_address')}
            </Text>
          </TouchableOpacity>

          {/* 🔍 SEARCH BAR CONTAINER */}
          <View style={styles.searchBar}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.searchLeft}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 0 }}
              onPress={() => executeAction("OPEN_GLOBAL_SEARCH")}
            >
              <AppIcon name="search" size={18} color={theme.textSecondary} />
              <Text style={styles.searchPlaceholder}>
                {t('search_medicines_doctors_labs')}
              </Text>
            </TouchableOpacity>

            {/* 📄 SCAN / UPLOAD RX */}
            <TouchableOpacity
              style={styles.scannerButton}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => dispatch(setPrescriptionModalVisible(true))}
            >
              <AppIcon name="scan" size={18} color="#1a998e" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      <AddressSelectorBottomSheet
        visible={addressSelectorVisible}
        onClose={() => setAddressSelectorVisible(false)}
      />
    </>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
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
    backgroundColor: c.card,
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
    color: c.textSecondary,
    fontSize: 14,
  },
  scannerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 12,
  },
  cartIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },

  addressText: {
    flexShrink: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  addressSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginBottom: 12,
  },
});
