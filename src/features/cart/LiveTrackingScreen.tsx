import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from '@/src/components/ThemedStatusBar';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  HelpCircle,
  MoreVertical,
  Compass,
  Home,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Pill,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Animated,
  Easing,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AdaptiveStatusBar } from "../../components/ThemedStatusBar";
import { Modal } from "../../components/ThemedModal";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  clearActiveOrder,
  updateOrderStatus,
} from "../../redux/slices/orderSlice";
import { RootState } from "../../redux/store";
import { apiClient } from "../../services/api/client";
import { onDeliveryLocationUpdate } from "../../services/socketService";
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

type DeliveryPartnerInfo = { partnerId: string; name: string; phone: string | null };

const { width, height } = Dimensions.get("window");

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

// Within this distance of the drop point the rider counts as arriving.
const ARRIVING_RADIUS_METERS = 50;

const getHeaderMessages = (status: string, partnerName?: string) => {
  switch (status) {
    case "pending":
      return {
        title: "Awaiting Confirmation",
        subtitle: "Waiting for the store to confirm",
        alert: "We have asked the pharmacy to confirm your order.",
      };
    case "accepted":
    case "preparing":
      return {
        title: "Preparing your order",
        subtitle: "15 mins • On time",
        alert: "Pharmacist is packaging your items with care.",
      };
    case "readyForPickup":
      return {
        title: "Ready for Pickup",
        subtitle: "Assigning delivery partner",
        alert: "Medicines prepared! Waiting for delivery partner assignment.",
      };
    case "pickedUp":
    case "dispatched":
      return {
        title: "Order is on the way 🛵",
        subtitle: "Arriving in 8 mins",
        alert: `${partnerName || "Your delivery partner"} is carrying your package to your location.`,
      };
    case "delivered":
      return {
        title: "Order Delivered 🎉",
        subtitle: "Delivered successfully",
        alert: "Your medicines have been handed over.",
      };
    case "rejected":
      return {
        title: "Order Rejected",
        subtitle: "Not confirmed by pharmacy",
        alert: "The pharmacy was unable to fulfill this order.",
      };
    case "cancelled":
      return {
        title: "Order Cancelled",
        subtitle: "This order was cancelled",
        alert: "This order has been cancelled.",
      };
    default:
      return {
        title: "Tracking Order",
        subtitle: "Awaiting updates",
        alert: "We are tracking your order live.",
      };
  }
};

const cleanMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#F1F5F9" }],
  },
  {
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#BAE6FD" }],
  },
];

export default function LiveTrackingScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const activeOrder = useSelector(
    (state: RootState) => state.order.activeOrder,
  );
  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );

  // Intercept hardware back button on Android to redirect to Home tab
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Tabs", { screen: "Home" });
        return true; // Prevents default pop action
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => {
        subscription.remove();
      };
    }, [navigation]),
  );

  // The server is the source of truth for both ends of the trip: the store's real coordinates and the
  // delivery address the order was actually placed with (the cart's selection may have changed since).
  type GeoPoint = { latitude: number; longitude: number; address?: string };
  const [serverGeo, setServerGeo] = useState<{ store?: GeoPoint; drop?: GeoPoint }>({});
  const usable = (p?: { latitude?: any; longitude?: any } | null): p is GeoPoint =>
    !!p && Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude)) && (Number(p.latitude) !== 0 || Number(p.longitude) !== 0);
  const drop = usable(serverGeo.drop) ? serverGeo.drop : usable(activeOrder?.address) ? (activeOrder!.address as GeoPoint) : usable(currentLocation) ? (currentLocation as GeoPoint) : null;
  const store = usable(serverGeo.store) ? serverGeo.store : usable(activeOrder?.deliveryLocation) ? (activeOrder!.deliveryLocation as GeoPoint) : null;

  const userLat = Number(drop?.latitude ?? 28.6139);
  const userLng = Number(drop?.longitude ?? 77.209);
  // Only if the store's position is genuinely unknown is it drawn near the drop point.
  const pharmacyLat = Number(store?.latitude ?? userLat + 0.005);
  const pharmacyLng = Number(store?.longitude ?? userLng + 0.005);

  const latDiff = Math.abs(pharmacyLat - userLat);
  const lngDiff = Math.abs(pharmacyLng - userLng);

  const [mapKey, setMapKey] = useState<string | null>(null);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMapConfig = async () => {
      try {
        const [keyRes, markersRes] = await Promise.all([
          apiClient.get("/api/app/map-key"),
          apiClient.get("/api/app/map-markers"),
        ]);
        if (keyRes.data && keyRes.data.success) {
          setMapKey(keyRes.data.key);
        }
        if (markersRes.data && markersRes.data.success) {
          setMapMarkers(markersRes.data.markers);
        }
      } catch (err) {
        console.warn(
          "Failed to load map/marker configuration from server:",
          err,
        );
      }
    };
    fetchMapConfig();
  }, []);

  // Animation and status state
  const [riderCoords, setRiderCoords] = useState({
    latitude: pharmacyLat,
    longitude: pharmacyLng,
  });
  const [hasMapError, setHasMapError] = useState(false);
  // Map markers made of React views are drawn to a bitmap; freezing them before that happens makes them vanish.
  const [markersSettled, setMarkersSettled] = useState(false);
  useEffect(() => {
    setMarkersSettled(false);
    const timer = setTimeout(() => setMarkersSettled(true), 1200);
    return () => clearTimeout(timer);
  }, [pharmacyLat, pharmacyLng, userLat, userLng]);
  const mapRef = useRef<MapView>(null);

  // Real assigned-partner identity and live GPS position - replaces the
  // previous hardcoded "Aman Verma" + fake 20s linear-interpolation
  // animation. With no real ping yet, the rider marker stays put at the
  // pharmacy rather than fake-animating toward the destination.
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartnerInfo | null>(null);
  // 'self': the pharmacy's own person delivers, so there is no separate rider - the pharmacy is the contact.
  const [deliveryMode, setDeliveryMode] = useState<'self' | 'partner'>('partner');
  const [storePhone, setStorePhone] = useState<string | null>(null);
  // The code the delivery person will ask for at the door. The server shows it only once the order is on its way.
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);

  // Delivered: leave tracking for the "order delivered" screen (and stop tracking this order).
  const deliveredHandled = useRef(false);
  useEffect(() => {
    if (!activeOrder || activeOrder.status !== "delivered" || deliveredHandled.current) return;
    deliveredHandled.current = true;
    const itemCount = Array.isArray(activeOrder.items)
      ? activeOrder.items.reduce((n: number, i: any) => n + (Number(i?.quantity) || 1), 0)
      : undefined;
    navigation.replace("OrderDelivered", {
      orderId: activeOrder.orderId,
      orderNumber: activeOrder.orderNumber,
      storeName: activeOrder.storeName,
      itemCount,
      deliveryMode,
      partnerName: deliveryPartner?.name,
    });
    dispatch(clearActiveOrder());
  }, [activeOrder, deliveryMode, deliveryPartner, navigation, dispatch]);

  // Refresh button: always spins long enough to be seen, even when the answer comes back instantly.
  const [syncing, setSyncing] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!syncing) return;
    spin.setValue(0);
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [syncing, spin]);
  const spinStyle = { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] };
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setDeliveryPartner(null);
    setLiveLocation(null);
  }, [activeOrder?.orderId]);

  useEffect(() => {
    const unsubscribe = onDeliveryLocationUpdate((payload) => {
      if (deliveryPartner && payload.partnerId === deliveryPartner.partnerId) {
        setLiveLocation({ latitude: payload.location.latitude, longitude: payload.location.longitude });
      }
    });
    return unsubscribe;
  }, [deliveryPartner]);

  // Update rider coordinate position on status/live-location changes
  useEffect(() => {
    if (!activeOrder) return;

    if (
      activeOrder.status === "dispatched" ||
      activeOrder.status === "pickedUp"
    ) {
      const coords = liveLocation || riderCoords;
      if (liveLocation) setRiderCoords(liveLocation);

      if (mapRef.current && !hasMapError) {
        mapRef.current.fitToCoordinates(
          [
            coords,
            { latitude: userLat, longitude: userLng },
          ],
          {
            edgePadding: { top: 110, right: 40, bottom: 40, left: 40 },
            animated: true,
          },
        );
      }
    } else if (activeOrder.status === "delivered") {
      setRiderCoords({ latitude: userLat, longitude: userLng });
    } else {
      setRiderCoords({ latitude: pharmacyLat, longitude: pharmacyLng });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeOrder?.status,
    liveLocation,
    userLat,
    userLng,
    pharmacyLat,
    pharmacyLng,
  ]);

  // Zoom to fit pharmacy and user home markers when coordinates are available
  useEffect(() => {
    if (activeOrder?.status === "dispatched" || activeOrder?.status === "pickedUp") {
      return; // Handled by the transit animation effect
    }
    if (mapRef.current && !hasMapError) {
      mapRef.current.fitToCoordinates(
        [
          { latitude: pharmacyLat, longitude: pharmacyLng },
          { latitude: userLat, longitude: userLng },
        ],
        {
          edgePadding: { top: 110, right: 40, bottom: 40, left: 40 },
          animated: true,
        },
      );
    }
  }, [pharmacyLat, pharmacyLng, userLat, userLng, hasMapError, activeOrder?.status]);

  // Poll status from backend (or run simulation if mockup sandbox order)
  useEffect(() => {
    if (!activeOrder) return;

    // Local simulation for sandbox order (starts with CF_ORD_)
    if (activeOrder.orderId.startsWith("CF_ORD_")) {
      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor(
          (Date.now() - activeOrder.timestamp) / 1000,
        );
        let currentStatus: typeof activeOrder.status = "pending";

        if (elapsedSeconds >= 45) {
          currentStatus = "delivered";
        } else if (elapsedSeconds >= 25) {
          currentStatus = "dispatched";
        } else if (elapsedSeconds >= 12) {
          currentStatus = "preparing";
        } else if (elapsedSeconds >= 5) {
          currentStatus = "accepted";
        }

        if (activeOrder.status !== currentStatus) {
          dispatch(updateOrderStatus(currentStatus));
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    // Real backend database order status polling
    const pollStatus = async () => {
      try {
        const res = await apiClient.get(
          `/api/orders/get-order-status/${activeOrder.orderId}`,
        );
        if (res.data && res.data.success && res.data.status) {
          if (activeOrder.status !== res.data.status) {
            dispatch(updateOrderStatus(res.data.status));
          }
          if (res.data.deliveryPartner) {
            setDeliveryPartner(res.data.deliveryPartner);
          }
          if (res.data.deliveryMode) setDeliveryMode(res.data.deliveryMode);
          setDeliveryCode(res.data.deliveryCode || null);
          if (res.data.storePhone) setStorePhone(res.data.storePhone);
          if (res.data.storeLocation || res.data.dropLocation) {
            setServerGeo((prev) => {
              const next = { store: res.data.storeLocation || prev.store, drop: res.data.dropLocation || prev.drop };
              return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
            });
          }
          if (res.data.lastKnownLocation) {
            const loc = res.data.lastKnownLocation;
            setLiveLocation((prev) => prev ?? { latitude: loc.latitude, longitude: loc.longitude });
          }
        }
      } catch (err) {
        console.warn("Failed to poll order status from server:", err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 4000);
    return () => clearInterval(interval);
  }, [activeOrder, dispatch]);

  // A soft quadratic curve between store and drop point. The bend is a fixed fraction of the distance, drawn
  // perpendicular to the trip, so it looks the same for 300 m and 5 km (a fixed offset made short trips
  // loop wildly and long ones look flat).
  const routeCoordinates = useMemo(() => {
    const points: { latitude: number; longitude: number }[] = [];
    const steps = 40;
    const midLat = (pharmacyLat + userLat) / 2;
    const midLng = (pharmacyLng + userLng) / 2;
    const dLat = userLat - pharmacyLat;
    const dLng = userLng - pharmacyLng;
    const bend = 0.12;
    const ctrlLat = midLat + -dLng * bend;
    const ctrlLng = midLng + dLat * bend;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      points.push({
        latitude: a * pharmacyLat + b * ctrlLat + c * userLat,
        longitude: a * pharmacyLng + b * ctrlLng + c * userLng,
      });
    }
    return points;
  }, [userLat, userLng, pharmacyLat, pharmacyLng]);

  const dial = (phone: string | null | undefined, missing: string) => {
    if (!phone) {
      alert(missing);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert("Unable to make call on this device.");
    });
  };
  const handleCallRider = () => dial(deliveryPartner?.phone, "Rider's phone number isn't available yet.");
  const handleCallStore = () => dial(storePhone, "The pharmacy's phone number isn't available.");

  const syncStatus = async () => {
    if (!activeOrder || syncing) return;
    setSyncing(true);
    const minSpin = new Promise((resolve) => setTimeout(resolve, 2500));
    try {
      const res = await apiClient.get(`/api/orders/get-order-status/${activeOrder.orderId}`);
      if (res.data && res.data.success && res.data.status) {
        dispatch(updateOrderStatus(res.data.status));
        if (res.data.deliveryPartner) setDeliveryPartner(res.data.deliveryPartner);
        if (res.data.deliveryMode) setDeliveryMode(res.data.deliveryMode);
        setDeliveryCode(res.data.deliveryCode || null);
        if (res.data.storePhone) setStorePhone(res.data.storePhone);
        if (res.data.lastKnownLocation) setLiveLocation(res.data.lastKnownLocation);
      }
      await minSpin;
    } catch {
      await minSpin;
      alert("Couldn't refresh right now. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  // If there is no active order, show a premium empty state inviting the user to place an order
  if (!activeOrder) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.emptyIconContainer}>
          <ShoppingBag size={48} color="#089643" />
        </View>
        <Text style={styles.emptyTitle}>{t('no_active_orders')}</Text>
        <Text style={styles.emptySubtitle}>
          You don't have any active orders right now. Order medicines from a
          pharmacy to track your delivery live here!
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
          activeOpacity={0.8}
        >
          <Text style={styles.browseBtnText}>{t('order_medicines_now')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // The rider's real GPS position vs the drop point (great-circle distance, metres).
  const metersBetween = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const rad = Math.PI / 180;
    const h = Math.sin(((bLat - aLat) * rad) / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(((bLng - aLng) * rad) / 2) ** 2;
    return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const riderReaching =
    (activeOrder.status === "dispatched" || activeOrder.status === "pickedUp") &&
    !!liveLocation &&
    metersBetween(liveLocation.latitude, liveLocation.longitude, userLat, userLng) <= ARRIVING_RADIUS_METERS;
  const headerMsg = riderReaching
    ? {
        title: "Reaching your location 📍",
        subtitle: "Your delivery partner is almost there",
        alert: "Your delivery partner is within 50 metres of you.",
      }
    : getHeaderMessages(activeOrder.status, deliveryPartner?.name);

  const renderMarkerIcon = (
    markerId: string,
    fallbackIcon: React.ReactNode,
    pinStyle: any,
  ) => {
    const customMarker = mapMarkers.find((m) => m.markerId === markerId);
    if (customMarker?.imageUrl) {
      return (
        <View style={pinStyle}>
          <Image
            source={{ uri: customMarker.imageUrl }}
            style={{ width: 32, height: 32 }}
          />
        </View>
      );
    }
    return fallbackIcon;
  };

  return (
    <View style={styles.container}>
      <AdaptiveStatusBar barStyle="light-content" />

      {/* Header - same surface as the rest of the app */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
        <LinearGradient colors={["#10B981", "#007C69"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
            activeOpacity={0.7}
          >
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerStoreName} numberOfLines={1}>
            {activeOrder.storeName}
          </Text>
          <TouchableOpacity style={styles.headerShareBtn} activeOpacity={0.7} onPress={() => setMenuVisible(true)}>
            <MoreVertical size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerStatusTitle}>
          {headerMsg.title}
        </Text>

        <View style={styles.headerPillRow}>
          <View style={styles.headerTimePill}>
            <Clock size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.headerTimePillText}>
              {headerMsg.subtitle}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerSyncBtn}
            onPress={syncStatus}
            disabled={syncing}
            activeOpacity={0.7}
          >
            <Animated.View style={syncing ? spinStyle : undefined}>
              <RefreshCw size={11} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuCard, { top: insets.top + 52 }]}>
            {[
              {
                key: "details",
                label: "Order details",
                Icon: FileText,
                run: () => navigation.navigate("Tabs", { screen: "Profile", params: { screen: "MedicineOrderDetail", params: { orderId: activeOrder.orderId } } }),
              },
              {
                key: "help",
                label: "Need help?",
                Icon: HelpCircle,
                run: () => navigation.navigate("Tabs", { screen: "Profile", params: { screen: "OrderSupport", params: { orderId: activeOrder.orderId, orderStatus: activeOrder.status } } }),
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.key}
                style={[styles.menuItem, index > 0 && styles.menuItemDivider]}
                activeOpacity={0.7}
                onPress={() => {
                  setMenuVisible(false);
                  setTimeout(action.run, 150);
                }}
              >
                <action.Icon size={18} color={theme.text} />
                <Text style={styles.menuItemText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Map Segment / Visual Route Simulator */}
      <View style={styles.mapContainer}>
        {!hasMapError ? (
          <MapView
            key={`${userLat}-${userLng}-${pharmacyLat}-${pharmacyLng}`}
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            customMapStyle={cleanMapStyle}
            initialRegion={{
              latitude: (pharmacyLat + userLat) / 2,
              longitude: (pharmacyLng + userLng) / 2,
              latitudeDelta: Math.max(latDiff * 2.5, 0.012),
              longitudeDelta: Math.max(lngDiff * 2.5, 0.012),
            }}
            onMapReady={() => {
              setTimeout(() => {
                if (mapRef.current) {
                  mapRef.current.fitToCoordinates(
                    [
                      { latitude: pharmacyLat, longitude: pharmacyLng },
                      { latitude: userLat, longitude: userLng },
                    ],
                    {
                      edgePadding: { top: 110, right: 40, bottom: 40, left: 40 },
                      animated: true,
                    },
                  );
                }
              }, 600);
            }}
          >
            {/* The 50 m "arriving" zone around the delivery location */}
            <Circle
              center={{ latitude: userLat, longitude: userLng }}
              radius={ARRIVING_RADIUS_METERS}
              strokeColor="rgba(16, 185, 129, 0.6)"
              strokeWidth={1.5}
              fillColor="rgba(16, 185, 129, 0.15)"
            />

            {/* Pharmacy Pin */}
            <Marker
              coordinate={{ latitude: pharmacyLat, longitude: pharmacyLng }}
              title={activeOrder.storeName}
              image={require("../../assets/images/map-pharmacy.png")}
              anchor={{ x: 0.5, y: 0.5 }}
            />

            {/* Destination User Pin */}
            <Marker
              coordinate={{ latitude: userLat, longitude: userLng }}
              title={t('your_home')}
              image={require("../../assets/images/map-customer.png")}
              anchor={{ x: 0.5, y: 0.92 }}
            />

            {/* Rider Pin */}
            {(activeOrder.status === "dispatched" ||
              activeOrder.status === "pickedUp") && (
              <Marker
                coordinate={riderCoords}
                title={`Rider - ${deliveryPartner?.name || "Delivery Partner"}`}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges
              >
                {renderMarkerIcon(
                  "rider",
                  <View style={styles.riderPin}>
                    <Navigation
                      size={14}
                      color="#FFFFFF"
                      style={{ transform: [{ rotate: "45deg" }] }}
                    />
                  </View>,
                  styles.dbPinContainer,
                )}
              </Marker>
            )}

            {/* Beautiful dashed light grey curved route line */}
            <Polyline
              coordinates={routeCoordinates}
              strokeColor="#94A3B8"
              strokeWidth={2.5}
              lineDashPattern={[6, 4]}
            />
          </MapView>
        ) : (
          /* Graphical Route Fallback if Maps fails */
          <View style={styles.fallbackRouteContainer}>
            <Compass size={40} color="#089643" style={styles.fallbackCompass} />
            <Text style={styles.fallbackTitle}>
              {t('simulating_route_navigation')}
            </Text>
            <View style={styles.fallbackProgressBarRow}>
              <View style={styles.fallbackIndicatorBox}>
                <ShoppingBag size={18} color="#089643" />
                <Text style={styles.fallbackIndicatorText}>{t('pharmacy')}</Text>
              </View>
              <View style={styles.fallbackLineContainer}>
                <View style={styles.fallbackLineLine} />
                <View
                  style={[
                    styles.fallbackLineProgress,
                    {
                      width:
                        activeOrder.status === "delivered"
                          ? "100%"
                          : activeOrder.status === "dispatched" ||
                              activeOrder.status === "pickedUp"
                            ? "60%"
                            : activeOrder.status === "preparing"
                              ? "30%"
                              : "10%",
                    },
                  ]}
                />
              </View>
              <View style={styles.fallbackIndicatorBox}>
                <MapPin size={18} color="#1A73E8" />
                <Text style={styles.fallbackIndicatorText}>{t('your_home')}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Details Sheet Drawer */}
      <View
        style={[styles.detailsDrawer, { paddingBottom: insets.bottom + 12 }]}
      >
        {/* Pharmacy Details Row */}
        <View style={styles.zomatoStoreInfoRow}>
          <View style={styles.zomatoStoreDetails}>
            <Text style={styles.zomatoStoreName}>{activeOrder.storeName}</Text>
            <Text style={styles.zomatoStoreAddress}>
              {store?.address || activeOrder.deliveryLocation?.address || "Partner Store"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallStore}
            activeOpacity={0.8}
          >
            <Phone size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Status Strip Alert */}
        {/* <View style={styles.zomatoAlertStrip}>
          <Text style={styles.zomatoAlertStripText}>
            {headerMsg.alert}
          </Text>
        </View> */}

        {/* The delivery code: shared at the door, after the medicines have been received and checked */}
        {deliveryCode ? (
          <View style={styles.otpCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.otpTitle}>Your delivery code</Text>
              <Text style={styles.otpHint}>Give this code to the delivery person only after you have received and checked your medicines.</Text>
            </View>
            <View style={styles.otpDigits}>
              {deliveryCode.split("").map((digit, index) => (
                <View key={index} style={styles.otpDigit}>
                  <Text style={styles.otpDigitText}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Dynamic Delivery Partner Status Card */}
        {deliveryMode === "self" && !["delivered", "rejected", "cancelled"].includes(activeOrder.status) ? (
          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.avatarBox}>
                <ShoppingBag size={18} color="#089643" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.partnerName}>Delivered by {activeOrder.storeName}</Text>
                <Text style={styles.partnerRatingText}>
                  {activeOrder.status === "dispatched" || activeOrder.status === "pickedUp"
                    ? "Their delivery person is on the way to you"
                    : "Their own delivery person will bring your order"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallStore} activeOpacity={0.8}>
              <Phone size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : activeOrder.status === "dispatched" ||
        activeOrder.status === "pickedUp" ||
        activeOrder.status === "delivered" ? (
          <View style={styles.partnerCard}>
            <View style={styles.partnerInfo}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>
                  {(deliveryPartner?.name || "DP")
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.partnerName}>
                  {deliveryPartner?.name || "Delivery Partner"}
                </Text>
                <Text style={styles.partnerRatingText}>{t('on_the_way_to_you')}</Text>
              </View>
            </View>
            {!!deliveryPartner?.phone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallRider} activeOpacity={0.8}>
                <Phone size={17} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ) : activeOrder.status === "readyForPickup" ? (
          <View style={styles.searchingRiderCard}>
            <View style={styles.pulseContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
            <View style={styles.searchingInfo}>
              <Text style={styles.searchingTitle}>
                {t('assigning_delivery_partner')}
              </Text>
              <Text style={styles.searchingSubtitle}>
                {t('searching_closest_delivery_rider_to_ac')}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.waitingRiderCard}>
            <Clock size={16} color={theme.textSecondary} />
            <Text style={styles.waitingRiderText}>
              Delivery partner will be assigned once the pharmacy prepares your
              order.
            </Text>
          </View>
        )}

        {/* Hygiene Instruction Box */}
        <View style={styles.zomatoInstructionBox}>
          <ShieldCheck size={14} color={theme.textSecondary} />
          <Text style={styles.zomatoInstructionText}>
            {t('we_ve_asked_the_pharmacy_to_seal_your')}
          </Text>
        </View>

        {/* Collapsible Order Receipt / Details Accordion */}
        <TouchableOpacity
          style={styles.zomatoAccordionHeader}
          onPress={() => setIsDetailExpanded(!isDetailExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.zomatoAccordionHeaderLeft}>
            <ShoppingBag size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.zomatoAccordionTitle}>
              {t('order_details_receipt')}
            </Text>
          </View>
          {isDetailExpanded ? (
            <ChevronUp size={16} color={theme.textSecondary} />
          ) : (
            <ChevronDown size={16} color={theme.textSecondary} />
          )}
        </TouchableOpacity>

        {isDetailExpanded &&
          (() => {
            const itemsToRender = activeOrder.items
              ? Array.isArray(activeOrder.items[0])
                ? activeOrder.items[0]
                : activeOrder.items
              : [];
            const bill = activeOrder.billData || {};
            const itemsCost = bill.itemsCost || 0;
            const deliveryCost = bill.deliveryCost || 0;
            const taxes = bill.taxes || 0;
            const packagingCharges = bill.packagingCharges || 0;
            const platformFee =
              bill.platformFee !== undefined ? bill.platformFee : 5;
            const couponDiscount = bill.couponDiscount || 0;
            const finalTotal =
              activeOrder.amount || bill.finalTotal || bill.totalAmount || 0;

            return (
              <ScrollView
                style={styles.zomatoAccordionContent}
                contentContainerStyle={{ paddingBottom: 24 }}
                nestedScrollEnabled
              >
                {itemsToRender.map((item: any, idx: number) => {
                  const itemPrice =
                    item.discountPrice !== undefined
                      ? item.discountPrice
                      : item.price;
                  return (
                    <View key={idx} style={styles.zomatoItemRow}>
                      <Text style={styles.zomatoItemQty}>{item.quantity}x</Text>
                      <Text style={styles.zomatoItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.zomatoItemPrice}>
                        ₹{formatPrice(itemPrice * item.quantity)}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.zomatoBillSummary}>
                  {itemsCost > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>{t('items_subtotal')}</Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(itemsCost)}
                      </Text>
                    </View>
                  )}
                  {deliveryCost > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>
                        {t('delivery_partner_fee')}
                      </Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(deliveryCost)}
                      </Text>
                    </View>
                  )}
                  {packagingCharges > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>
                        {t('packaging_charges')}
                      </Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(packagingCharges)}
                      </Text>
                    </View>
                  )}
                  {taxes > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>{t('taxes_gst')}</Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(taxes)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.zomatoBillRow}>
                    <Text style={styles.zomatoBillLabel}>Platform Fee</Text>
                    <Text style={styles.zomatoBillVal}>
                      ₹{formatPrice(platformFee)}
                    </Text>
                  </View>
                  {couponDiscount > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text
                        style={[styles.zomatoBillLabel, { color: "#089643" }]}
                      >
                        {t('coupon_discount')}
                      </Text>
                      <Text
                        style={[styles.zomatoBillVal, { color: "#089643" }]}
                      >
                        -₹{formatPrice(couponDiscount)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.zomatoBillRow,
                      {
                        marginTop: 6,
                        paddingTop: 6,
                        borderTopWidth: 1,
                        borderColor: theme.borderLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.zomatoBillLabel,
                        { fontWeight: "700", color: theme.text },
                      ]}
                    >
                      {t('total_paid')}
                    </Text>
                    <Text style={styles.zomatoBillValBold}>
                      ₹{formatPrice(finalTotal)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            );
          })()}


      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: "hidden",
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStoreName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  headerShareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerStatusTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  headerPillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTimePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerTimePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSyncBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  dbPinContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  otpCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginBottom: 12, borderRadius: 12, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  otpTitle: { fontSize: 14, fontWeight: "800", color: "#065F46" },
  otpHint: { fontSize: 11, color: "#047857", lineHeight: 15, marginTop: 2 },
  otpDigits: { flexDirection: "row", gap: 6 },
  otpDigit: { width: 30, height: 38, borderRadius: 8, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#10B981", alignItems: "center", justifyContent: "center" },
  otpDigitText: { fontSize: 20, fontWeight: "900", color: "#065F46" },
  menuBackdrop: { flex: 1 },
  menuCard: {
    position: "absolute",
    right: 16,
    minWidth: 200,
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuItemDivider: { borderTopWidth: 1, borderTopColor: c.borderLight },
  menuItemText: { fontSize: 14, fontWeight: "600", color: c.text },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  riderPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#089643",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  zomatoMapPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  fallbackRouteContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.cardSecondary,
    padding: 24,
  },
  fallbackCompass: {
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: c.text,
    marginBottom: 24,
  },
  fallbackProgressBarRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  fallbackIndicatorBox: {
    alignItems: "center",
    gap: 4,
  },
  fallbackIndicatorText: {
    fontSize: 11,
    fontWeight: "700",
    color: c.textSecondary,
  },
  fallbackLineContainer: {
    flex: 1,
    height: 6,
    backgroundColor: c.infoBg,
    borderRadius: 3,
    marginHorizontal: 12,
    position: "relative",
    overflow: "hidden",
  },
  fallbackLineLine: {
    ...StyleSheet.absoluteFillObject,
  },
  fallbackLineProgress: {
    height: "100%",
    backgroundColor: "#089643",
    borderRadius: 3,
  },
  detailsDrawer: {
    backgroundColor: c.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.successBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  statusTextCol: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: c.success,
  },
  statusSubtitle: {
    fontSize: 11,
    color: c.success,
    marginTop: 2,
  },
  trackerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginVertical: 20,
  },
  trackerStep: {
    alignItems: "center",
    width: "28%",
  },
  trackerStepDone: {
    opacity: 1,
  },
  trackerNode: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: c.infoBg,
    alignItems: "center",
    justifyContent: "center",
  },
  trackerNodeActive: {
    backgroundColor: c.warningBg,
    borderWidth: 2,
    borderColor: "#D97706",
  },
  trackerNodeDone: {
    backgroundColor: "#089643",
  },
  trackerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#64748B",
  },
  trackerText: {
    fontSize: 11,
    fontWeight: "700",
    color: c.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: c.infoBg,
    marginBottom: 20,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.borderLight,
  },
  partnerInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 12,
  },
  callBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#10B981",
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: c.border,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: c.textSecondary,
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "800",
    color: c.text,
  },
  partnerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  partnerRatingText: {
    fontSize: 11,
    color: c.textSecondary,
    fontWeight: "600",
  },
  partnerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  searchingRiderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.infoBg,
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  pulseContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchingInfo: {
    flex: 1,
  },
  searchingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E40AF",
  },
  searchingSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 2,
  },
  waitingRiderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    gap: 8,
  },
  waitingRiderText: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textSecondary,
    flex: 1,
  },
  zomatoStoreInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  zomatoStoreDetails: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  zomatoStoreName: {
    fontSize: 16,
    fontWeight: "800",
    color: c.text,
  },
  zomatoStoreAddress: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
  },
  zomatoPhoneCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  zomatoAlertStrip: {
    backgroundColor: c.successBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  zomatoAlertStripText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.success,
  },
  zomatoInstructionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
  },
  zomatoInstructionText: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textSecondary,
    flex: 1,
  },
  zomatoAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.borderLight,
    marginTop: 10,
  },
  zomatoAccordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  zomatoAccordionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: c.textSecondary,
  },
  zomatoAccordionContent: {
    maxHeight: 280,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: c.borderLight,
  },
  zomatoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  zomatoItemQty: {
    fontSize: 12,
    fontWeight: "800",
    color: "#089643",
    marginRight: 6,
  },
  zomatoItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  zomatoItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
  },
  zomatoBillSummary: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: c.borderLight,
  },
  zomatoBillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  zomatoBillLabel: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: "500",
  },
  zomatoBillVal: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600",
  },
  zomatoBillValBold: {
    fontSize: 12,
    color: "#089643",
    fontWeight: "800",
  },
  billBriefBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  billBriefLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
  },
  sandboxResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: c.errorBg,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 6,
  },
  sandboxResetBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#EF4444",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.card,
    padding: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: c.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  browseBtn: {
    backgroundColor: "#089643",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
