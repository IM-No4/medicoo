import AppIcon from "@/src/components/icons/AppIcon";
import {
  addFavoritePharmacy,
  checkFavoritePharmacy,
  removeFavoritePharmacy,
} from "@/src/services/api/pharmacy.api";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

const AUTO_SCROLL_INTERVAL = 3000; // 3 seconds

export default function PharmacyHeader({
  pharmacy,
  onBack,
}: {
  pharmacy: any;
  onBack: () => void;
}) {
  const isOpen = pharmacy?.status === "online";
  const rating = pharmacy?.rating || 0;
  const reviewCount = pharmacy?.reviewCount || 0;
  const deliveryTime = pharmacy?.deliveryTime || "30-35 mins";
  const distance = pharmacy?.distance || "0.0";

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % DEALS.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Check favorite status on mount
  useEffect(() => {
    if (pharmacy?.storeId || pharmacy?.id) {
      checkFavoriteStatus();
    }
  }, [pharmacy?.storeId, pharmacy?.id]);

  const checkFavoriteStatus = async () => {
    try {
      const storeId = pharmacy?.storeId || pharmacy?.id;
      if (!storeId) return;

      const favorite = await checkFavoritePharmacy(storeId);
      setIsFavorite(favorite);
    } catch (e) {
      console.error("Failed to check favorite status", e);
    }
  };

  const handleToggleFavorite = async () => {
    const storeId = pharmacy?.storeId || pharmacy?.id;
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Store Image with overlaid buttons and badges */}
      <View style={styles.imageContainer}>
        {pharmacy?.storeOutsideImg ? (
          <Image
            source={{ uri: pharmacy.storeOutsideImg }}
            style={styles.storeImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Image
              source={require("../../../assets/images/pharmacy-placeholder.png")}
              style={styles.storeImage}
            />
          </View>
        )}

        {/* Top gradient overlay for buttons */}
        <LinearGradient
          colors={["rgba(7, 8, 7, 0.4)", "rgba(247, 247, 247, 0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topGradient}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onBack}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.9)",
                  "rgba(255, 255, 255, 0.7)",
                ]}
                style={styles.backButton}
              >
                <AppIcon name="arrow-left" size={24} color="#1c1c1e" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              disabled={isFavoriteLoading}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.9)",
                  "rgba(255, 255, 255, 0.7)",
                ]}
                style={styles.favoriteButton}
              >
                {isFavoriteLoading ? (
                  <ActivityIndicator size="small" color="#13701c" />
                ) : (
                  <AppIcon
                    name="heart"
                    size={24}
                    color={isFavorite ? "#EF4444" : "#1c1c1e"}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Deals Carousel or Offline Badge at bottom */}
        {!isOpen ? (
          <View style={styles.offlineTagContainer}>
            <LinearGradient
              colors={["rgba(247, 247, 247, 0)", "rgba(5, 2, 2, 0.95)"]}
              style={styles.offlineTagGradient}
            >
              <View style={styles.offlineTagContent}>
                <AppIcon name="alarm-clock-off" size={20} color="#FFFFFF" />
                <View style={styles.offlineTagTextContainer}>
                  <Text style={styles.offlineTagTitle}>Currently Offline</Text>
                  <Text style={styles.offlineTagSubtitle}>
                    Store is closed. Check back later.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={styles.dealsCarouselContainer}>
            <LinearGradient
              colors={["rgba(247, 247, 247, 0)", "rgba(7, 8, 7, 0.95)"]}
              style={styles.dealsGradient}
            >
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.dealsScrollView}
              >
                {DEALS.map((deal) => (
                  <View key={deal.id} style={styles.dealSlide}>
                    <Text style={styles.dealBadgeTitle}>{deal.title}</Text>
                    <Text style={styles.dealBadgeDiscount}>
                      {deal.discount}
                    </Text>
                    <Text style={styles.dealDescription}>
                      {deal.description}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {DEALS.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Store Info */}
      <View style={styles.storeInfo}>
        {/* Verified Tag - Hidden by default like list screen */}
        <View style={styles.verifiedTag}>
          <Text style={styles.verifiedText}>Verified</Text>
          <View style={styles.verifiedUnderline} />
        </View>

        {/* Store Name */}
        <Text style={styles.storeName}>
          {pharmacy?.storeName || "Pharmacy Name"}
        </Text>

        {/* Rating and Delivery Time */}
        <View style={styles.ratingRow}>
          <View style={styles.ratingBadge}>
            <AppIcon name="star" size={14} color="#ff9900" />
          </View>
          <Text style={styles.ratingText}>
            {rating > 0 ? rating.toFixed(1) : "0.0"}
          </Text>
          <Text style={styles.reviewCountText}>({reviewCount}K+)</Text>
          <Text style={styles.deliveryTimeDot}>•</Text>
          <Text style={styles.deliveryTimeText}>{deliveryTime}</Text>
        </View>

        {/* Categories */}
        <Text style={styles.categoriesText}>
          Medicines, Healthcare, Wellness Products
        </Text>

        {/* Location and Distance */}
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>
            {pharmacy?.fullAddress || "Location"}
          </Text>
          <Text style={styles.distanceDot}>•</Text>
          <Text style={styles.distanceText}>{distance} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 12,
    paddingBottom: 20,
  },
  imageContainer: {
    width: "100%",
    height: 280,
    position: "relative",
    backgroundColor: "#F2F2F7",
  },
  storeImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 60,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dealsCarouselContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  dealsGradient: {
    paddingTop: 40,
    paddingBottom: 12,
  },
  dealsScrollView: {
    width: SCREEN_WIDTH,
  },
  dealSlide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  dealBadgeTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dealBadgeDiscount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dealDescription: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
    letterSpacing: 0.3,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: "#FFFFFF",
  },
  storeInfo: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  verifiedTag: {
    marginBottom: 4,
    display: "none", // Hidden like list screen
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
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 3,
  },
  reviewCountText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1C1C1E",
    marginRight: 6,
  },
  deliveryTimeDot: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginRight: 6,
  },
  deliveryTimeText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#1C1C1E",
  },
  categoriesText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginBottom: 6,
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
    flex: 1,
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
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  offlineTagContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  offlineTagGradient: {
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  offlineTagContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  offlineTagTextContainer: {
    flex: 1,
  },
  offlineTagTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  offlineTagSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 0.3,
  },
});
