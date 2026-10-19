import { useMemo } from 'react';
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
  Platform,
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
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

type AddressType = "Home" | "Work" | "Other";

export default function AddressBookScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      showStatus("error", t('error'), t('failed_to_fetch_addresses'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    showStatus(
      "warning",
      t('remove_address'),
      t('are_you_sure_you_want_to_delete_this_a'),
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
          showStatus("success", t('deleted'), t('address_deleted_successfully'));
        } catch (error) {
          showStatus("error", t('error'), t('failed_to_delete_address'));
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
        title: t('share_address'),
      });
    } catch (error) {
      showStatus("error", t('error'), t('failed_to_share_address'));
    }
  };

  const getIconColor = (type: AddressType) => {
    switch (type) {
      case "Home":
        return { bg: theme.successBg, icon: "#10B981" };
      case "Work":
        return { bg: theme.infoBg, icon: "#4F46E5" };
      default:
        return { bg: theme.cardSecondary, icon: theme.textSecondary };
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
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('address_book')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 100,
            }}
          >
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <MapPin size={40} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_addresses_found')}</Text>
            <Text style={styles.emptyText}>
              {t('add_an_address_to_make_checking_out_fa')}
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
                              <Text style={styles.defaultText}>{t('default')}</Text>
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
                        <Share2 size={15} color={theme.textSecondary} />
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
                        <Edit size={15} color={theme.textSecondary} />
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
                            {t('selected')}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.selectAddressBtn}
                          activeOpacity={0.7}
                          onPress={() => handleSelectAddress(item)}
                        >
                          <Text style={styles.selectAddressBtnText}>
                            {String(t('select')).toUpperCase()}
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
          <Plus size={18} color="#fff" />
          <Text style={styles.addButtonText}>{String(t('add_new_address')).toUpperCase()}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Same header recipe as the Family Members / Add Family Member screens -
  // white bar + shadow, plain icon back button, fontSize 20/600/#111827
  // title.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: c.text,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardSelected: {
    backgroundColor: c.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  typeText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: c.text,
  },
  distanceText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#10B981",
  },
  rightBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  defaultBadge: {
    backgroundColor: c.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  defaultText: {
    fontSize: 9,
    fontWeight: "800",
    color: c.success,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteHeaderBtn: {
    backgroundColor: c.errorBg,
  },
  addressBody: {
    marginTop: 0,
  },
  flatText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.text,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 17,
  },
  receiverText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.text,
    lineHeight: 17,
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: c.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    height: 48,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#fff",
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    alignItems: "center",
  },
  selectAddressBtn: {
    height: 34,
    paddingHorizontal: 20,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#10B981",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  selectAddressBtnText: {
    color: "#10B981",
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  selectedIndicatorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 8,
  },
  selectedIndicatorText: {
    color: "#10B981",
    fontSize: 12.5,
    fontWeight: "800",
  },
});
