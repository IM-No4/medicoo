import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
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
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  clearActiveOrder,
  updateOrderStatus,
} from "../../redux/slices/orderSlice";
import { RootState } from "../../redux/store";
import { apiClient } from "../../services/api/client";
import { onDeliveryLocationUpdate } from "../../services/socketService";

type DeliveryPartnerInfo = { partnerId: string; name: string; phone: string | null };

const { width, height } = Dimensions.get("window");

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

const getHeaderMessages = (status: string, partnerName?: string) => {
  switch (status) {
    case "pending":
      return {
        title: "Awaiting Confirmation",
        subtitle: "Store is accepting order",
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
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

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

  // Fallback to active order address lat/long, or current location, or Delhi coordinates
  const userLat =
    activeOrder?.address?.latitude ?? currentLocation?.latitude ?? 28.6139;
  const userLng =
    activeOrder?.address?.longitude ?? currentLocation?.longitude ?? 77.209;

  // Use actual store coordinates from backend if available, otherwise shift slightly
  const pharmacyLat =
    activeOrder?.deliveryLocation?.latitude ?? userLat + 0.005;
  const pharmacyLng =
    activeOrder?.deliveryLocation?.longitude ?? userLng + 0.005;

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
  const mapRef = useRef<MapView>(null);

  // Real assigned-partner identity and live GPS position - replaces the
  // previous hardcoded "Aman Verma" + fake 20s linear-interpolation
  // animation. With no real ping yet, the rider marker stays put at the
  // pharmacy rather than fake-animating toward the destination.
  const [deliveryPartner, setDeliveryPartner] = useState<DeliveryPartnerInfo | null>(null);
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

  // Route path coordinates (smooth parabolic curve/arc between Pharmacy and User)
  const routeCoordinates = useMemo(() => {
    const points = [];
    const numPoints = 35;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      // Linear interpolation
      const lat = pharmacyLat + (userLat - pharmacyLat) * t;
      const lng = pharmacyLng + (userLng - pharmacyLng) * t;

      // Calculate parabolic curve offset
      const offsetFactor = 4 * t * (1 - t);
      const arcHeight = 0.0012; // arc peak height offset

      // Add orthogonal offset to create a clean curved parabola arc
      const curvedLat = lat + arcHeight * offsetFactor;
      const curvedLng = lng - arcHeight * offsetFactor;

      points.push({ latitude: curvedLat, longitude: curvedLng });
    }
    return points;
  }, [userLat, userLng, pharmacyLat, pharmacyLng]);

  const handleCallRider = () => {
    if (!deliveryPartner?.phone) {
      alert("Rider's phone number isn't available yet.");
      return;
    }
    Linking.openURL(`tel:${deliveryPartner.phone}`).catch(() => {
      alert("Unable to make call on this device.");
    });
  };

  // If there is no active order, show a premium empty state inviting the user to place an order
  if (!activeOrder) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={styles.emptyIconContainer}>
          <ShoppingBag size={48} color="#089643" />
        </View>
        <Text style={styles.emptyTitle}>No Active Orders</Text>
        <Text style={styles.emptySubtitle}>
          You don't have any active orders right now. Order medicines from a
          pharmacy to track your delivery live here!
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
          activeOpacity={0.8}
        >
          <Text style={styles.browseBtnText}>Order Medicines Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      <StatusBar style="light" />

      {/* Zomato-style Green Header Card */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 10 }]}>
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
          <TouchableOpacity style={styles.headerShareBtn} activeOpacity={0.7}>
            <Compass size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerStatusTitle}>
          {getHeaderMessages(activeOrder.status, deliveryPartner?.name).title}
        </Text>

        <View style={styles.headerPillRow}>
          <View style={styles.headerTimePill}>
            <Clock size={11} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.headerTimePillText}>
              {getHeaderMessages(activeOrder.status, deliveryPartner?.name).subtitle}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.headerSyncBtn}
            onPress={async () => {
              try {
                const res = await apiClient.get(
                  `/api/orders/get-order-status/${activeOrder.orderId}`,
                );
                if (res.data && res.data.success && res.data.status) {
                  dispatch(updateOrderStatus(res.data.status));
                  if (res.data.deliveryPartner) {
                    setDeliveryPartner(res.data.deliveryPartner);
                  }
                  alert("Status synced successfully");
                }
              } catch {
                alert("Failed to sync status");
              }
            }}
            activeOpacity={0.7}
          >
            <RefreshCw size={11} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

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
            {/* Pharmacy Pin */}
            <Marker
              coordinate={{ latitude: pharmacyLat, longitude: pharmacyLng }}
              title={activeOrder.storeName}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {renderMarkerIcon(
                "pharmacy",
                <View style={styles.zomatoMapPin}>
                  <Pill size={14} color="#FFFFFF" />
                </View>,
                styles.dbPinContainer,
              )}
            </Marker>

            {/* Destination User Pin */}
            <Marker
              coordinate={{ latitude: userLat, longitude: userLng }}
              title="Your Home"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {renderMarkerIcon(
                "home",
                <View style={styles.zomatoMapPin}>
                  <Home size={14} color="#FFFFFF" />
                </View>,
                styles.dbPinContainer,
              )}
            </Marker>

            {/* Rider Pin */}
            {(activeOrder.status === "dispatched" ||
              activeOrder.status === "pickedUp") && (
              <Marker
                coordinate={riderCoords}
                title={`Rider - ${deliveryPartner?.name || "Delivery Partner"}`}
                anchor={{ x: 0.5, y: 0.5 }}
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
              Simulating Route Navigation
            </Text>
            <View style={styles.fallbackProgressBarRow}>
              <View style={styles.fallbackIndicatorBox}>
                <ShoppingBag size={18} color="#089643" />
                <Text style={styles.fallbackIndicatorText}>Pharmacy</Text>
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
                <Text style={styles.fallbackIndicatorText}>Your Home</Text>
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
              {activeOrder.deliveryLocation?.address || "Partner Store"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.zomatoPhoneCallBtn}
            onPress={handleCallRider}
            activeOpacity={0.7}
          >
            <Phone
              size={14}
              color="#089643"
              style={{ transform: [{ scaleX: -1 }] }}
            />
          </TouchableOpacity>
        </View>

        {/* Status Strip Alert */}
        {/* <View style={styles.zomatoAlertStrip}>
          <Text style={styles.zomatoAlertStripText}>
            {getHeaderMessages(activeOrder.status, deliveryPartner?.name).alert}
          </Text>
        </View> */}

        {/* Hygiene Instruction Box */}
        <View style={styles.zomatoInstructionBox}>
          <ShieldCheck size={14} color="#475569" />
          <Text style={styles.zomatoInstructionText}>
            We've asked the pharmacy to seal your medicine package securely.
          </Text>
        </View>

        {/* Dynamic Delivery Partner Status Card */}
        {activeOrder.status === "dispatched" ||
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
              <View>
                <Text style={styles.partnerName}>
                  {deliveryPartner?.name || "Delivery Partner"}
                </Text>
                <Text style={styles.partnerRatingText}>On the way to you</Text>
              </View>
            </View>
            <View style={styles.partnerActions}>
              {!!deliveryPartner?.phone && (
                <TouchableOpacity
                  style={styles.actionCircleBtn}
                  onPress={handleCallRider}
                  activeOpacity={0.7}
                >
                  <Phone
                    size={16}
                    color="#089643"
                    style={{ transform: [{ scaleX: -1 }] }}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionCircleBtn}
                activeOpacity={0.7}
              >
                <MessageSquare size={16} color="#089643" />
              </TouchableOpacity>
            </View>
          </View>
        ) : activeOrder.status === "readyForPickup" ? (
          <View style={styles.searchingRiderCard}>
            <View style={styles.pulseContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
            <View style={styles.searchingInfo}>
              <Text style={styles.searchingTitle}>
                Assigning Delivery Partner...
              </Text>
              <Text style={styles.searchingSubtitle}>
                Searching closest delivery rider to accept your package
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.waitingRiderCard}>
            <Clock size={16} color="#64748B" />
            <Text style={styles.waitingRiderText}>
              Delivery partner will be assigned once the pharmacy prepares your
              order.
            </Text>
          </View>
        )}

        {/* Collapsible Order Receipt / Details Accordion */}
        <TouchableOpacity
          style={styles.zomatoAccordionHeader}
          onPress={() => setIsDetailExpanded(!isDetailExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.zomatoAccordionHeaderLeft}>
            <ShoppingBag size={14} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.zomatoAccordionTitle}>
              Order details & receipt
            </Text>
          </View>
          {isDetailExpanded ? (
            <ChevronUp size={16} color="#64748B" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
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
                      <Text style={styles.zomatoBillLabel}>Items Subtotal</Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(itemsCost)}
                      </Text>
                    </View>
                  )}
                  {deliveryCost > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>
                        Delivery Partner Fee
                      </Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(deliveryCost)}
                      </Text>
                    </View>
                  )}
                  {packagingCharges > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>
                        Packaging Charges
                      </Text>
                      <Text style={styles.zomatoBillVal}>
                        ₹{formatPrice(packagingCharges)}
                      </Text>
                    </View>
                  )}
                  {taxes > 0 && (
                    <View style={styles.zomatoBillRow}>
                      <Text style={styles.zomatoBillLabel}>Taxes & GST</Text>
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
                        Coupon Discount
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
                        borderColor: "#F1F5F9",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.zomatoBillLabel,
                        { fontWeight: "700", color: "#1E293B" },
                      ]}
                    >
                      Total Paid
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#089643", // Green theme!
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F1F5F9",
    padding: 24,
  },
  fallbackCompass: {
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1F2937",
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
    color: "#4B5563",
  },
  fallbackLineContainer: {
    flex: 1,
    height: 6,
    backgroundColor: "#E2E8F0",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F0FDF4",
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
    color: "#166534",
  },
  statusSubtitle: {
    fontSize: 11,
    color: "#15803d",
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
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  trackerNodeActive: {
    backgroundColor: "#FEF3C7",
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
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  trackerLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 20,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  partnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  partnerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1E293B",
  },
  partnerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  partnerRatingText: {
    fontSize: 11,
    color: "#64748B",
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
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  searchingRiderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
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
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    gap: 8,
  },
  waitingRiderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
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
  },
  zomatoStoreName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
  },
  zomatoStoreAddress: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  zomatoPhoneCallBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  zomatoAlertStrip: {
    backgroundColor: "#F0FDF4",
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
    color: "#15803D",
  },
  zomatoInstructionBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 14,
  },
  zomatoInstructionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    flex: 1,
  },
  zomatoAccordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginTop: 10,
  },
  zomatoAccordionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  zomatoAccordionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  zomatoAccordionContent: {
    maxHeight: 280,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
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
    color: "#1E293B",
  },
  zomatoBillSummary: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },
  zomatoBillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  zomatoBillLabel: {
    fontSize: 12,
    color: "#64748B",
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
    color: "#64748B",
  },
  sandboxResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#FEF2F2",
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
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748B",
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
