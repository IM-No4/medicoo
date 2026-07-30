import { executeAction } from "@/src/actions/ActionExecutor";
import MultiStoreCartBar from "@/src/components/cart/MultiStoreCartBar";
import AddressSelectorBottomSheet from "@/src/components/modals/AddressSelectorBottomSheet";
import StatusModal, { StatusType } from "@/src/components/modals/StatusModal";
import { RootState } from "@/src/redux/store";
import {
  addFavoritePharmacy,
  getFavoritePharmacies,
  getNearbyPharmacies,
  removeFavoritePharmacy,
} from "@/src/services/api/pharmacy.api";
import { getToken } from "@/src/utils/tokenManagement";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import AppIcon from "../../components/icons/AppIcon";
import PrescriptionUploadModal from "../../components/modals/PrescriptionUploadModal";

const CATEGORIES = [
  { id: "1", name: "All" },
  { id: "2", name: "Open Now" },
  { id: "3", name: "24/7" },
  { id: "4", name: "Top Rated" },
  { id: "5", name: "Free Delivery" },
];

export type Pharmacy = {
  id: string;
  storeName: string;
  city: string;
  fullAddress: string;
  storeRating: number;
  storeReviews: number;
  distance: string;
  deliveryTime?: string;
  isOpen: boolean;
  storeImageUrl?: string | null;
};

const mapApiPharmacyToUI = (api: any): Pharmacy => ({
  id: api.id ?? api._id,
  storeName: api.storeName,
  city: api.city,
  fullAddress: api.fullAddress ?? "",
  storeRating: api.rating ?? 0,
  storeReviews: api.reviewsCount ?? 0,
  distance: api.distance,
  isOpen: api.storeStatus === "online",
  deliveryTime: api.deliveryTime,
  storeImageUrl:
    api.storeOutsideImg ?? api.storeInsideImg ?? api.storeImageUrl ?? null,
});

const PharmacyCard = memo(
  ({
    item,
    onPress,
    isFavorite,
    onFavoritePress,
    isFavoriteLoading,
    authToken,
  }: {
    item: Pharmacy;
    onPress: (id: string) => void;
    isFavorite: boolean;
    onFavoritePress: (id: string) => void;
    isFavoriteLoading?: boolean;
    authToken?: string | null;
  }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item.id)}
      activeOpacity={0.9}
    >
      {/* Left side - Image with overlay badge */}
      <View
        style={[
          styles.cardImageContainer,
          !item.storeImageUrl && { padding: 12 },
        ]}
      >
        <Image
          source={
            item.storeImageUrl
              ? {
                  uri: item.storeImageUrl,
                  headers: {
                    Authorization: authToken ? `Bearer ${authToken}` : "",
                    "X-Client-Type": "customer-app",
                  },
                }
              : require("../../assets/images/pharmacy-placeholder.png")
          }
          style={styles.cardImage}
        />
        {/* Flat deal badge overlay on image */}
        <LinearGradient
          colors={["rgba(247, 247, 247, 0)", "rgba(7, 8, 7, 1)"]}
          style={styles.dealBadge}
        >
          <Text style={styles.dealBadgeTitle}>FLAT DEAL</Text>
          <Text style={styles.dealBadgeDiscount}>50% OFF</Text>
        </LinearGradient>
        {/* Favorite heart icon on image */}
        <TouchableOpacity
          style={styles.favoriteIconOnImage}
          onPress={(e) => {
            e.stopPropagation();
            onFavoritePress(item.id);
          }}
          disabled={isFavoriteLoading}
          activeOpacity={0.7}
        >
          {isFavoriteLoading ? (
            <ActivityIndicator size="small" color="#0E7439" />
          ) : (
            <AppIcon
              name="heart"
              size={20}
              color={isFavorite ? "#EF4444" : "#4B5563"}
              fill={isFavorite ? "#EF4444" : "none"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Right side - Content */}
      <View style={styles.cardContent}>
        {/* Verified tag */}
        <View style={styles.verifiedTag}>
          <Text style={styles.verifiedText}>Verified</Text>
          <View style={styles.verifiedUnderline} />
        </View>

        {/* Store name */}
        <Text style={styles.storeName} numberOfLines={1}>
          {item.storeName}
        </Text>

        {/* Rating and delivery time */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <AppIcon name="star" size={14} color="#ff9900" />
          </View>
          <Text style={styles.ratingText}>{item.storeRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.storeReviews}K+)</Text>
          <Text style={styles.deliveryTimeDot}>•</Text>
          <Text style={styles.deliveryTimeText}>{item.deliveryTime}</Text>
        </View>

        {/* Categories */}
        <Text style={styles.categoriesText} numberOfLines={1}>
          {item.fullAddress}
        </Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.city}
          </Text>
          <Text style={styles.distanceDot}>•</Text>
          <Text style={styles.distanceText}>{item.distance} km</Text>
        </View>

        {/* Currently Offline Badge - Shows when store is closed */}
        {!item.isOpen && (
          <View style={styles.offlineBadge}>
            <AppIcon name="alarm-clock-off" size={12} color="#6B7280" />
            <Text style={styles.offlineBadgeText}>Currently Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ),
);

export default function PharmacyListScreen() {
  const navigation = useNavigation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    visible: boolean;
    status: StatusType;
    title?: string;
    message?: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({
    visible: false,
    status: "idle",
  });
  const [isLocationVisible, setIsLocationVisible] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [favoriteStoreIds, setFavoriteStoreIds] = useState<string[]>([]);
  const [togglingFavorites, setTogglingFavorites] = useState<
    Record<string, boolean>
  >({});
  const insets = useSafeAreaInsets();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    getToken("access_token").then(setAuthToken).catch(console.error);
  }, []);

  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );
  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );

  const lat = selectedAddress?.latitude ?? currentLocation?.latitude;

  const long = selectedAddress?.longitude ?? currentLocation?.longitude;

  useEffect(() => {
    if (!lat || !long) return;
    loadPharmacies(1, true);
  }, [lat, long]);

  const loadFavorites = async () => {
    try {
      const res = await getFavoritePharmacies();
      const list = Array.isArray(res) ? res : res?.data || res?.stores || [];
      const ids = list
        .map((item: any) => item.storeId || item.id || item._id)
        .filter(Boolean);
      setFavoriteStoreIds(ids);
    } catch (e) {
      console.error("Failed to load favorite stores", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const handleToggleFavoriteList = async (storeId: string) => {
    if (togglingFavorites[storeId]) return;

    setTogglingFavorites((prev) => ({ ...prev, [storeId]: true }));
    try {
      const isFav = favoriteStoreIds.includes(storeId);
      if (isFav) {
        await removeFavoritePharmacy(storeId);
        setFavoriteStoreIds((prev) => prev.filter((id) => id !== storeId));
      } else {
        await addFavoritePharmacy(storeId);
        setFavoriteStoreIds((prev) => [...prev, storeId]);
      }
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    } finally {
      setTogglingFavorites((prev) => ({ ...prev, [storeId]: false }));
    }
  };

  const loadPharmacies = async (pageToLoad: number, reset = false) => {
    if (isLoading || isLoadingMore) return;

    try {
      pageToLoad === 1 ? setIsLoading(true) : setIsLoadingMore(true);

      if (!lat || !long) return;

      const data = await getNearbyPharmacies({
        lat,
        long,
        page: pageToLoad,
        limit: 10,
      });

      const pharmacies = Array.isArray(data?.data)
        ? data.data.map(mapApiPharmacyToUI)
        : [];

      if (!Array.isArray(pharmacies)) {
        setHasMore(false);
        return;
      }

      setAllPharmacies((prev) =>
        reset ? pharmacies : [...prev, ...pharmacies],
      );

      setHasMore(Boolean(data?.hasMore));
      setPage(pageToLoad);
    } catch (e) {
      console.error("Failed to load pharmacies", e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    setHasMore(true);
    await Promise.all([loadPharmacies(1, true), loadFavorites()]);
    setIsRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    loadPharmacies(page + 1);
  };

  const sortedPharmacies = useMemo(() => {
    let data = allPharmacies.filter((item) => {
      const matchesSearch =
        item.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fullAddress?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        (activeCategory === "Open Now" && item.isOpen) ||
        (activeCategory === "Top Rated" && (item.storeRating ?? 0) >= 4.5);

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "rating") {
      data.sort((a, b) => (b.storeRating ?? 0) - (a.storeRating ?? 0));
    } else if (sortBy === "distance") {
      const getDistance = (d?: string) =>
        parseFloat(d?.replace(/[^\d.]/g, "") || "0");

      data.sort((a, b) => getDistance(a.distance) - getDistance(b.distance));
    }
    return data;
  }, [searchQuery, sortBy, activeCategory, allPharmacies]);

  const handlePrescriptionUpload = async (image: any) => {
    // Robustly extract coordinates
    const finalLat = selectedAddress?.latitude ?? currentLocation?.latitude;
    const finalLong = selectedAddress?.longitude ?? currentLocation?.longitude;

    if (
      finalLat === undefined ||
      finalLong === undefined ||
      finalLat === null ||
      finalLong === null
    ) {
      setStatusModal({
        visible: true,
        status: "error",
        title: "Location Error",
        message:
          "Location not found. Please ensure you have an address selected or location services enabled.",
      });
      return;
    }

    // Immediately navigate to Analysis screen
    setIsUploadModalVisible(false);
    (navigation as any).navigate("PrescriptionResult", {
      image: image,
      latitude: finalLat,
      longitude: finalLong,
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.locationContainer}>
        <Text style={styles.headerSubtitle}>Delivering to</Text>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setIsLocationVisible(true)}
        >
          <AppIcon name="map-pin" size={16} color="#0E7439" />
          <Text style={styles.locationTextHeader} numberOfLines={1}>
            {selectedAddress?.label ||
              selectedAddress?.fullAddress ||
              "Current Location"}
          </Text>
          <AppIcon name="chevron-down" size={14} color="#1c1c1e" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setIsFilterVisible(true)}
      >
        <AppIcon name="sliders" size={24} color="#0E7439" />
      </TouchableOpacity>
    </View>
  );

  const renderSearch = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <AppIcon name="search" size={20} color="#8A8A8E" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search pharmacies, medicines..."
          placeholderTextColor="#8A8A8E"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Text style={{ color: "#8A8A8E" }}>|</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setIsUploadModalVisible(true)}
        >
          <AppIcon name="scan-text-icon" size={20} color="#8A8A8E" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              activeCategory === cat.name && styles.activeCategoryChip,
            ]}
            onPress={() => setActiveCategory(cat.name)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat.name && styles.activeCategoryText,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={isFilterVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setIsFilterVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort & Filter</Text>
            <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
              <AppIcon name="x" size={24} color="#1c1c1e" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>Sort by</Text>

          {["default", "rating", "distance"].map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.filterOption}
              onPress={() => setSortBy(option)}
            >
              <Text style={styles.filterOptionText}>
                {option === "default"
                  ? "Recommended"
                  : option === "rating"
                    ? "Rating (High to Low)"
                    : "Distance (Nearest)"}
              </Text>
              <View
                style={[
                  styles.radioButton,
                  sortBy === option && styles.radioButtonSelected,
                ]}
              >
                {sortBy === option && <View style={styles.radioButtonInner} />}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setIsFilterVisible(false)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderLocationModal = () => (
    <AddressSelectorBottomSheet
      visible={isLocationVisible}
      onClose={() => setIsLocationVisible(false)}
    />
  );

  const renderSkeleton = () => (
    <View style={styles.card}>
      <View style={[styles.cardImage, { backgroundColor: "#F2F2F7" }]} />
      <View style={styles.cardContent}>
        <View
          style={[
            styles.skeletonBox,
            { width: "70%", height: 18, marginBottom: 8 },
          ]}
        />
        <View
          style={[
            styles.skeletonBox,
            { width: "50%", height: 14, marginBottom: 6 },
          ]}
        />
        <View
          style={[
            styles.skeletonBox,
            { width: "90%", height: 14, marginBottom: 6 },
          ]}
        />
        <View style={[styles.skeletonBox, { width: "60%", height: 14 }]} />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <AppIcon name="search" size={48} color="#C7C7CC" />
      <Text style={styles.emptyStateTitle}>No Pharmacies Found</Text>
      <Text style={styles.emptyStateText}>
        We couldn't find any pharmacies matching "{searchQuery}"
      </Text>
      {searchQuery !== "" && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => setSearchQuery("")}
        >
          <Text style={styles.emptyStateButtonText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEndOfList = () => {
    if (isLoading || sortedPharmacies.length === 0) return null;

    return (
      <View style={styles.endOfListContainer}>
        <View style={styles.endOfListIcon}>
          <AppIcon name="map-pin-off" size={24} color="#8A8A8E" />
        </View>
        <Text style={styles.endOfListTitle}>
          {!hasMore ? "You've reached the end" : "That's all nearby"}
        </Text>
        <Text style={styles.endOfListSubtitle}>
          {sortedPharmacies.length}{" "}
          {sortedPharmacies.length === 1 ? "pharmacy" : "pharmacies"} found in
          your area
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#0E7439" />
        </View>
      );
    }
    return renderEndOfList();
  };

  const handlePharmacyPress = useCallback((pharmacyId: string) => {
    executeAction("OPEN_PHARMACY", { pharmacyId });
  }, []);

  const renderPharmacyItem = useCallback(
    ({ item }: { item: Pharmacy }) => (
      <PharmacyCard
        item={item}
        onPress={handlePharmacyPress}
        isFavorite={favoriteStoreIds.includes(item.id)}
        onFavoritePress={handleToggleFavoriteList}
        isFavoriteLoading={togglingFavorites[item.id]}
        authToken={authToken}
      />
    ),
    [handlePharmacyPress, favoriteStoreIds, togglingFavorites, authToken],
  );

  const renderSkeletonItem = useCallback(
    ({ item }: { item: any }) => renderSkeleton(),
    [],
  );

  const renderToast = () => null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {renderHeader()}

      <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
        {renderSearch()}

        <FlatList
          data={
            isLoading
              ? ([{ id: "s1" }, { id: "s2" }, { id: "s3" }] as any)
              : sortedPharmacies
          }
          renderItem={isLoading ? renderSkeletonItem : renderPharmacyItem}
          keyExtractor={(item, index) =>
            item.id ? `${item.id}-${index}` : `pharmacy-${index}`
          }
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: 148 + 16, // height (148) + separator height (16)
            offset: (148 + 16) * index,
            index,
          })}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.pharmacyList}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={() => (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
              </View>
              {renderCategories()}
            </>
          )}
        />
      </View>
      {renderFilterModal()}
      {renderLocationModal()}
      <PrescriptionUploadModal
        visible={isUploadModalVisible}
        isLoading={isUploading}
        onClose={() => !isUploading && setIsUploadModalVisible(false)}
        onImageSelected={handlePrescriptionUpload}
        existingPrescriptions={[
          {
            id: "RX001",
            doctorName: "Dr. Rajesh Kumar",
            prescriptionDate: "2025-01-15",
            items: 3,
            diagnosis: "Common Cold & Fever",
          },
        ]}
      />
      <MultiStoreCartBar />
      <StatusModal
        visible={statusModal.visible}
        status={statusModal.status}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
        primaryAction={statusModal.primaryAction}
        primaryActionText={statusModal.primaryActionText}
        autoCloseDelay={
          statusModal.status === "success" && !statusModal.primaryAction
            ? 3000
            : undefined
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  locationContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8A8A8E",
    marginBottom: 2,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTextHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1c1c1e",
    marginHorizontal: 6,
  },
  iconButton: {
    padding: 8,
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#f1f0f5",
  },
  searchSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderTopWidth: 0,
    zIndex: 1,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 54,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#1c1c1e",
  },
  scanButton: {
    width: 32,
    height: 32,
    marginLeft: 4,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeCategoryChip: {
    backgroundColor: "#0E7439",
    borderColor: "#0E7439",
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A8A8E",
  },
  activeCategoryText: {
    color: "#fff",
  },
  pharmacyList: {
    marginTop: 12,
    paddingTop: 20,
    minHeight: "100%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
    color: "#1c1c1e",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1c1c1e",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#3C3C43",
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    borderColor: "#0E7439",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0E7439",
  },
  applyButton: {
    alignItems: "center",
    backgroundColor: "#0E7439",
    paddingHorizontal: 18,
    paddingRight: 12,
    paddingVertical: 16,
    borderRadius: 10,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  // CARD STYLES - EXACT MATCH TO IMAGE
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginVertical: 16,
    overflow: "hidden",
    marginHorizontal: 12,
    flexDirection: "row",
    height: 148,
  },
  separator: {
    height: 16,
    backgroundColor: "#F2F2F7",
  },
  cardImageContainer: {
    width: 120,
    height: 144,
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    margin: 2,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  dealBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dealBadgeTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dealBadgeDiscount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  favoriteIconOnImage: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    paddingLeft: 14,
    justifyContent: "flex-start",
  },
  verifiedTag: {
    marginBottom: 4,
    display: "none",
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FF6B35",
    letterSpacing: 0.3,
  },
  verifiedUnderline: {
    width: 42,
    height: 2,
    backgroundColor: "#FF6B35",
    marginTop: 1,
    borderRadius: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingBadge: {
    width: 16,
    height: 16,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 3,
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: "400",
    color: "#1C1C1E",
    marginRight: 6,
  },
  deliveryTimeDot: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 6,
  },
  deliveryTimeText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#1C1C1E",
  },
  categoriesText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  distanceDot: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginHorizontal: 6,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  // Currently Offline Badge
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: "#F3F4F6",
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  skeletonBox: {
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1c1c1e",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#8A8A8E",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#0E7439",
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  // End of List Section
  endOfListContainer: {
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
    marginTop: 20,
    paddingBottom: 160,
  },
  endOfListIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  endOfListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1c1c1e",
    marginBottom: 6,
  },
  endOfListSubtitle: {
    fontSize: 13,
    color: "#8A8A8E",
    textAlign: "center",
  },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#323232",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
});
