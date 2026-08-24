import AppIcon from "@/src/components/icons/AppIcon";
import {
  addFavoritePharmacy,
  checkFavoritePharmacy,
  removeFavoritePharmacy,
} from "@/src/services/api/pharmacy.api";
import { getToken } from "@/src/utils/tokenManagement";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEALS = [
  {
    id: "1",
    title: "FLAT DEAL",
    discount: "50% OFF",
    description: "On orders above ₹499",
  },
  {
    id: "2",
    title: "SUPER SAVER",
    discount: "30% OFF",
    description: "On select medicines",
  },
  {
    id: "3",
    title: "FREE DELIVERY",
    discount: "₹0",
    description: "On orders above ₹299",
  },
];

const AUTO_SCROLL_INTERVAL = 4000;

export default function PharmacyHeader({
  pharmacy,
  onBack,
  children,
  onLayout,
}: {
  pharmacy: any;
  onBack: () => void;
  children?: React.ReactNode;
  onLayout?: (event: any) => void;
}) {
  const insets = useSafeAreaInsets();
  const isOpen = pharmacy?.status === "online";
  const rating = Number(pharmacy?.rating) || 0;
  const reviewCount = pharmacy?.reviewCount || 0;
  const deliveryTime = pharmacy?.deliveryTime || "30-35 mins";
  const distance = pharmacy?.distance || "0.0";

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    getToken("access_token").then(setAuthToken).catch(console.error);
  }, []);

  // Auto-scroll deals banner
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(() => {
      if (!isMounted) return;
      setActiveIndex((prevIndex) => (prevIndex + 1) % DEALS.length);
    }, AUTO_SCROLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (pharmacy?.storeId || pharmacy?.id || pharmacy?._id) {
      checkFavoriteStatus();
    }
  }, [pharmacy?.storeId, pharmacy?.id, pharmacy?._id]);

  const checkFavoriteStatus = async () => {
    try {
      const storeId = pharmacy?.storeId || pharmacy?.id || pharmacy?._id;
      if (!storeId) return;

      const favorite = await checkFavoritePharmacy(storeId);
      setIsFavorite(favorite);
    } catch (e) {
      console.error("Failed to check favorite status", e);
    }
  };

  const handleToggleFavorite = async () => {
    const storeId = pharmacy?.storeId || pharmacy?.id || pharmacy?._id;
    if (!storeId || isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    try {
      if (isFavorite) {
        await removeFavoritePharmacy(storeId);
        setIsFavorite(false);
      } else {
        await addFavoritePharmacy(storeId);
        setIsFavorite(true);
      }
    } catch (e) {
      console.error("Failed to toggle favorite", e);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* Dark Green Header Background (fully contains the info card) */}
      <View style={[styles.darkHeader, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={["#FFF", "#FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <AppIcon name="arrow-left" size={24} color="#1c1c1e" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={isFavoriteLoading}
            style={styles.favoriteButton}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color="#1c1c1e" />
            ) : (
              <AppIcon
                name="heart"
                size={24}
                color={isFavorite ? "#EF4444" : "#828282ff"}
                fill={isFavorite ? "#EF4444" : "none"}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Floating White Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.nameContainer}>
              <Text style={styles.storeName} numberOfLines={1}>
                {pharmacy?.storeName || "Pharmacy Name"}
              </Text>
              <Text style={styles.categoriesText}>
                Medicines, Healthcare, Wellness Products
              </Text>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadgeContainer}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>
                  {rating > 0 ? rating.toFixed(1) : "0.0"}
                </Text>
                <AppIcon name="star" size={12} color="#4B5563" />
              </View>
              <Text style={styles.reviewCountText}>
                {reviewCount}K+ ratings
              </Text>
            </View>
          </View>

          {/* Time and Distance */}
          <View style={styles.detailsRow}>
            <AppIcon name="clock" size={14} color="#6B7280" />
            <Text style={styles.detailsText}>{deliveryTime}</Text>
            <Text style={styles.bullet}>•</Text>
            <AppIcon name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.detailsText}>{distance} km</Text>
          </View>

          <View style={styles.divider} />

          {/* Status / Offers */}
          {!isOpen ? (
            <View style={styles.offlineBadge}>
              <AppIcon name="alarm-clock-off" size={14} color="#6B7280" />
              <Text style={styles.offlineBadgeText}>Currently Unavailable</Text>
            </View>
          ) : (
            <View style={styles.dealBanner}>
              <AppIcon name="percent" size={16} color="#007C69" />
              <Text style={styles.dealBannerText} numberOfLines={1}>
                {DEALS[activeIndex].title}: {DEALS[activeIndex].discount} |{" "}
                {DEALS[activeIndex].description}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar / children outside the top card */}
      {children && <View style={styles.childrenContainer}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F6F7F9",
    marginBottom: 12,
  },
  darkHeader: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 4,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameContainer: {
    flex: 1,
    paddingRight: 8,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  categoriesText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  ratingBadgeContainer: {
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#4B5563",
  },
  reviewCountText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  detailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  bullet: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    marginVertical: 12,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    gap: 6,
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 0.2,
  },
  dealBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dealBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    flex: 1,
  },
  cardChildrenContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
    paddingTop: 12,
  },
});
