import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import {
  Briefcase,
  Check,
  ChevronLeft,
  Edit,
  Home,
  MapPin,
  Plus,
  Share2,
  Trash2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import StatusModal, {
  StatusType,
} from "../../../../components/modals/StatusModal";
import { WEB_APP_URL } from "../../../../config/env";
import {
  clearSelectedAddress,
  setSelectedAddress,
} from "../../../../redux/slices/addressSlice";
import { RootState } from "../../../../redux/store";
import {
  deleteUserAddress,
  getUserAddresses,
} from "../../../../services/api/address.api";
import { getProfileDetails } from "../../../../services/api/user.api";
import { getDistanceKm } from "../../../../utils/geo";

type AddressType = "Home" | "Work" | "Other";

export default function AddressBookScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );
  // Redux's currentLocation is only ever set once, at app launch
  // (HomeHeader.tsx's fetch is gated behind a module-level "run once per
  // session" flag) - it never updates again as the user actually moves, so
  // the distance-to-address shown here was always stuck at wherever the
  // app happened to be opened. liveLocation is a fresh GPS fix fetched
  // every time this screen gains focus, and takes priority when available.
  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const effectiveLocation = liveLocation || currentLocation;
  const authMobile = useSelector((state: any) => state.auth.mobile);

  // Fallback so a "receiver" line still shows for addresses saved as
  // "I am the receiver" - those store the user's own name/number now (see
  // AddAddressScreen.tsx), but older addresses saved before that fix have
  // nothing stored, so this fills in from the live profile instead.
  const [myProfile, setMyProfile] = useState<{ name?: string; mobile?: string } | null>(null);
  useEffect(() => {
    getProfileDetails().then((p: any) => {
      setMyProfile({ name: p?.name, mobile: p?.mobile || p?.phone });
    }).catch(() => {});
  }, []);
  const myMobile = myProfile?.mobile || authMobile;

  const handleSelectAddress = (item: any) => {
    // Normalized before it goes into redux - the raw item has GeoJSON
    // location.coordinates (not flat latitude/longitude), which is why
    // distance/delivery-time never changed when the delivery address was
    // switched: every consumer reading selectedAddress.latitude was
    // silently getting undefined regardless of which address was picked.
    dispatch(setSelectedAddress({
      id: item._id || item.id,
      label: item.label || item.type,
      fullAddress: item.fullAddress || item.address,
      latitude: item.location?.coordinates?.[1] || item.latitude,
      longitude: item.location?.coordinates?.[0] || item.longitude,
      receiverName: item.receiverName || myProfile?.name,
      receiverNumber: item.receiverNumber || item.receiverPhone || myMobile,
    }));
    navigation.goBack();
  };

  // Status Modal State
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    type: "idle",
    title: "",
    message: "",
  });

  const showStatus = (
    type: StatusType,
    title: string,
    message: string,
    primaryAction?: () => void,
    primaryActionText?: string,
  ) => {
    setStatus({
      visible: true,
      type,
      title,
      message,
      primaryAction,
      primaryActionText,
    });
  };

  const hideStatus = () => setStatus((prev) => ({ ...prev, visible: false }));

  // Real Data State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();

      (async () => {
        try {
          const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
          if (permStatus !== "granted") return;
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLiveLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        } catch {
          // Keep whatever we already have (redux's stale snapshot, or
          // nothing) rather than blocking the screen on a location error.
        }
      })();
    }, []),
  );

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await getUserAddresses();
      setAddresses(data);
    } catch (error) {
      showStatus("error", "Error", "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    showStatus(
      "warning",
      "Remove Address?",
      "Are you sure you want to delete this address from your book?",
      async () => {
        hideStatus();
        setLoading(true);
        try {
          await deleteUserAddress(id);
          if (
            selectedAddress &&
            (selectedAddress._id === id || selectedAddress.id === id)
          ) {
            dispatch(clearSelectedAddress());
          }
          await fetchAddresses(); // Refresh the list
          showStatus("success", "Deleted", "Address deleted successfully.");
        } catch (error) {
          showStatus("error", "Error", "Failed to delete address.");
        } finally {
          setLoading(false);
        }
      },
      "Delete",
    );
  };

  const handleShare = async (item: any) => {
    try {
      const latitude = item.location?.coordinates?.[1] || item.latitude || "";
      const longitude = item.location?.coordinates?.[0] || item.longitude || "";

      const queryParts = [];
      if (item.fullAddress || item.address) {
        queryParts.push(
          `fullAddress=${encodeURIComponent(item.fullAddress || item.address)}`,
        );
      }
      if (item.flatHouseNumber || item.houseNo) {
        queryParts.push(
          `houseNo=${encodeURIComponent(item.flatHouseNumber || item.houseNo)}`,
        );
      }
      if (item.nearBy || item.landmark) {
        queryParts.push(
          `landmark=${encodeURIComponent(item.nearBy || item.landmark)}`,
        );
      }
      if (item.label || item.type) {
        queryParts.push(`tag=${encodeURIComponent(item.label || item.type)}`);
      }
      if (item.receiverName) {
        queryParts.push(
          `receiverName=${encodeURIComponent(item.receiverName)}`,
        );
      }
      if (item.receiverNumber || item.receiverPhone) {
        queryParts.push(
          `receiverPhone=${encodeURIComponent(item.receiverNumber || item.receiverPhone)}`,
        );
      }
      if (latitude) {
        queryParts.push(`latitude=${encodeURIComponent(String(latitude))}`);
      }
      if (longitude) {
        queryParts.push(`longitude=${encodeURIComponent(String(longitude))}`);
      }

      const baseUrl = WEB_APP_URL || "https://medicoo.in";
      const deepLink = `${baseUrl}/add-address?${queryParts.join("&")}`;

      await Share.share({
        message: `Here is my address on Medicoo: ${item.fullAddress || item.address}. Tap the link to save it: ${deepLink}`,
        title: "Share Address",
      });
    } catch (error) {
      showStatus("error", "Error", "Failed to share address");
    }
  };

  const getIconColor = (type: AddressType) => {
    switch (type) {
      case "Home":
        return { bg: "#ECFDF5", icon: "#10B981" };
      case "Work":
        return { bg: "#EEF2FF", icon: "#4F46E5" };
      default:
        return { bg: "#F3F4F6", icon: "#6B7280" };
    }
  };

  const getIcon = (type: AddressType) => {
    const colors = getIconColor(type);
    switch (type) {
      case "Home":
        return <Home size={18} color={colors.icon} />;
      case "Work":
        return <Briefcase size={18} color={colors.icon} />;
      default:
        return <MapPin size={18} color={colors.icon} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Address Book</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 100,
            }}
          >
            <ActivityIndicator size="large" color="#2FA561" />
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MapPin size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Addresses Found</Text>
            <Text style={styles.emptyText}>
              Add an address to make checking out faster.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {addresses.map((item) => {
              const isSelected = !!(
                selectedAddress &&
                ((selectedAddress._id &&
                  item._id &&
                  selectedAddress._id === item._id) ||
                  (selectedAddress.id &&
                    item.id &&
                    selectedAddress.id === item.id) ||
                  (selectedAddress._id &&
                    item.id &&
                    selectedAddress._id === item.id) ||
                  (selectedAddress.id &&
                    item._id &&
                    selectedAddress.id === item._id) ||
                  (selectedAddress.latitude &&
                    item.latitude &&
                    selectedAddress.latitude === item.latitude &&
                    selectedAddress.longitude &&
                    item.longitude &&
                    selectedAddress.longitude === item.longitude))
              );

              const itemLat = item.location?.coordinates?.[1] || item.latitude;
              const itemLong = item.location?.coordinates?.[0] || item.longitude;
              const distanceKm =
                effectiveLocation?.latitude && effectiveLocation?.longitude && itemLat && itemLong
                  ? getDistanceKm(
                      effectiveLocation.latitude,
                      effectiveLocation.longitude,
                      itemLat,
                      itemLong,
                    )
                  : null;

              const receiverName = item.receiverName || myProfile?.name;
              const receiverContact =
                item.receiverNumber || item.receiverPhone || myMobile;

              return (
                <View
                  key={item._id || item.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor: getIconColor(
                              item.label || item.type,
                            ).bg,
                          },
                        ]}
                      >
                        {getIcon(item.label || item.type)}
                      </View>
                      <View>
                        <View style={styles.typeRow}>
                          <Text style={styles.typeText}>
                            {item.label || item.type}
                          </Text>
                          {distanceKm !== null && (
                            <Text style={styles.distanceText}>
                              {distanceKm < 1
                                ? `${Math.round(distanceKm * 1000)}m away`
                                : `${distanceKm.toFixed(1)}km away`}
                            </Text>
                          )}
                        </View>
                        <View
                          style={{ flexDirection: "row", gap: 6, marginTop: 2 }}
                        >
                          {item.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultText}>Default</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        style={styles.headerActionBtn}
                        activeOpacity={0.6}
                        onPress={() => handleShare(item)}
                      >
                        <Share2 size={15} color="#64748B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.headerActionBtn}
                        activeOpacity={0.6}
                        onPress={() =>
                          navigation.navigate("AddAddress", {
                            id: item._id || item.id,
                            fullAddress: item.fullAddress || item.address,
                            houseNo: item.flatHouseNumber || item.houseNo || "",
                            landmark: item.nearBy || item.landmark || "",
                            tag: item.label || item.type || "Home",
                            receiverName: item.receiverName || "",
                            receiverPhone:
                              item.receiverNumber || item.receiverPhone || "",
                            latitude:
                              item.location?.coordinates?.[1] || item.latitude,
                            longitude:
                              item.location?.coordinates?.[0] || item.longitude,
                          })
                        }
                      >
                        <Edit size={15} color="#64748B" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.headerActionBtn, styles.deleteHeaderBtn]}
                        activeOpacity={0.6}
                        onPress={() => handleDelete(item._id || item.id)}
                      >
                        <Trash2 size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.addressBody}>
                    {item.flatHouseNumber ? (
                      <Text style={styles.flatText}>
                        {item.flatHouseNumber}
                        {item.nearBy ? ` • ${item.nearBy}` : ""}
                      </Text>
                    ) : item.nearBy ? (
                      <Text style={styles.flatText}>{item.nearBy}</Text>
                    ) : null}
                    <Text style={styles.addressText}>
                      {item.fullAddress || item.address}
                    </Text>

                    {receiverName && (
                      <Text style={styles.receiverText}>
                        {receiverName}
                        {receiverContact ? `, ${receiverContact}` : ""}
                      </Text>
                    )}

                    <View style={styles.cardActionsRow}>
                      {isSelected ? (
                        <View style={styles.selectedIndicatorBtn}>
                          <Check size={14} color="#089643" />
                          <Text style={styles.selectedIndicatorText}>
                            Selected
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.selectAddressBtn}
                          activeOpacity={0.7}
                          onPress={() => handleSelectAddress(item)}
                        >
                          <Text style={styles.selectAddressBtnText}>
                            Select
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 0) },
        ]}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddAddress")}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* Status Modal */}
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
        autoCloseDelay={status.type === "success" ? 2500 : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FE",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  content: {
    // padding: 20,
    paddingBottom: 120,
  },
  list: {
    gap: 0,
  },
  card: {
    backgroundColor: "#fff",
    // borderRadius: 18,
    padding: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  cardSelected: {
    // borderColor: "#089643",
    // borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2FA561",
  },
  rightBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  defaultBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  defaultText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#2E7D32",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteHeaderBtn: {
    backgroundColor: "#FEF2F2",
  },
  addressBody: {
    marginTop: 2,
  },
  flatText: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  receiverText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 18,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2FA561",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
    alignItems: "center",
  },
  selectAddressBtn: {
    backgroundColor: "#089643",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  selectAddressBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  selectedIndicatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  selectedIndicatorText: {
    color: "#089643",
    fontSize: 13,
    fontWeight: "700",
  },
});
