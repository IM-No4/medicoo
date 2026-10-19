import { useMemo } from 'react';
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
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <View style={[styles.darkHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <LinearGradient
          colors={[theme.card, theme.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
            <AppIcon name="chevron-left" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleToggleFavorite}
            disabled={isFavoriteLoading}
            style={styles.favoriteButton}
          >
            {isFavoriteLoading ? (
              <ActivityIndicator size="small" color={theme.text} />
            ) : (
              <AppIcon
                name="heart"
                size={24}
                color={isFavorite ? "#EF4444" : theme.textMuted}
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
                {t('medicines_healthcare_wellness_products')}
              </Text>
            </View>

            {/* Rating Badge */}
            <View style={styles.ratingBadgeContainer}>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>
                  {rating > 0 ? rating.toFixed(1) : "0.0"}
                </Text>
                <AppIcon name="star" size={12} color={theme.textSecondary} />
              </View>
              <Text style={styles.reviewCountText}>
                {reviewCount}K+ ratings
              </Text>
            </View>
          </View>

          {/* Time and Distance */}
          <View style={styles.detailsRow}>
            <AppIcon name="clock" size={14} color={theme.textSecondary} />
            <Text style={styles.detailsText}>{deliveryTime}</Text>
            <Text style={styles.bullet}>•</Text>
            <AppIcon name="map-pin" size={14} color={theme.textSecondary} />
            <Text style={styles.detailsText}>{distance} km</Text>
          </View>

          <View style={styles.divider} />

          {/* Status / Offers */}
          {!isOpen ? (
            <View style={styles.offlineBadge}>
              <AppIcon name="alarm-clock-off" size={14} color={theme.textSecondary} />
              <Text style={styles.offlineBadgeText}>{t('currently_unavailable')}</Text>
            </View>
          ) : (
            <View style={styles.dealBanner}>
              <AppIcon name="percent" size={16} color={theme.primary} />
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.background,
    marginBottom: 12,
  },
  darkHeader: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: c.border,
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
    // No surface of its own: the header is already the card, so a second
    // filled/bordered panel inside it read as a card-in-a-card.
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
    color: c.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  categoriesText: {
    fontSize: 12,
    fontWeight: "500",
    color: c.textSecondary,
    marginBottom: 8,
  },
  ratingBadgeContainer: {
    alignItems: "center",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "800",
    color: c.textSecondary,
  },
  reviewCountText: {
    fontSize: 11,
    fontWeight: "500",
    color: c.textSecondary,
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
    color: c.textSecondary,
  },
  bullet: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textMuted,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    marginVertical: 12,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: c.cardSecondary,
    gap: 6,
  },
  offlineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSecondary,
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
    color: c.textSecondary,
    flex: 1,
  },
  cardChildrenContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingTop: 12,
  },
  // The search bar rendered as `children` sits below the dark header/white
  // info card, on the screen's own background - not inside the card, so it
  // doesn't use the card's divider styling above. Its own content
  // (searchRowWrapper) already carries horizontal padding. marginTop:4
  // here, combined with infoCard's own paddingBottom:8, lands at the same
  // ~12px gap used below the search bar (container's marginBottom) -
  // otherwise the card's bottom padding stacks invisibly with this margin
  // and reads as one much bigger gap than the one below.
  childrenContainer: {
    marginTop: 4,
  },
});
