import { useMemo } from 'react';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Search,
  ShoppingBag,
  Star,
  Truck,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { executeAction } from "../../../../actions/ActionExecutor";
import { getMyOrders } from "../../../../services/api";
import OrderRatingModal, { OrderReviewState } from "../../../../components/modals/OrderRatingModal";
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Order {
  _id: string;
  orderId: string;
  pharmacyName: string;
  itemsCount: number;
  totalAmount: number;
  status: "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  deliveryDate?: string;
  deliveryMode?: "self" | "partner";
  review?: OrderReviewState | null;
  items?: any[];
  storeImage?: string | null;
}

const formatAmount = (value: any) => {
  const num = Number(value);
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export default function MedicineOrdersScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFor, setRatingFor] = useState<Order | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // On a dark screen the pastel chips and bright colours glare, so they become soft tints of a muted colour.
  const DARK_STATUS: Record<string, string> = {
    Delivered: "#86C9A0",
    Shipped: "#8FB4E8",
    Processing: "#86BFDC",
    Placed: "#A5A8E6",
    Cancelled: "#E09A9A",
  };
  const getStatusStyle = (status: string) => {
    if (theme.isDark) {
      const tone = DARK_STATUS[status] || "#9CA3AF";
      return { bg: `${tone}1F`, text: tone };
    }
    switch (status) {
      case "Delivered":
        return { bg: "#F0FDF4", text: "#16A34A" };
      case "Shipped":
        return { bg: "#EFF6FF", text: "#2563EB" };
      case "Processing":
        return { bg: "#E0F2FE", text: "#0284C7" }; // Awaiting Rider style
      case "Placed":
        return { bg: "#EEF2FF", text: "#4F46E5" }; // Current Order style
      case "Cancelled":
        return { bg: "#FEF2F2", text: "#DC2626" };
      default:
        return { bg: "#F3F4F6", text: "#4B5563" };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return "N/A";
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours}:${minutes} ${ampm}`;
    } catch {
      return "N/A";
    }
  };

  const renderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusStyle(item.status);
    const formattedDate = formatDate(item.createdAt);
    const formattedTime = formatTime(item.createdAt);

    // Icon selection based on status
    const isDeliveryPhase =
      item.status === "Shipped" || item.status === "Processing";

    return (
      <TouchableOpacity
        style={styles.itemRow}
        activeOpacity={0.7}
        onPress={() =>
          executeAction("OPEN_MEDICINE_ORDER_DETAIL", { orderId: item._id })
        }
      >
        {/* Left: Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: statusStyle.bg }]}>
          {item.storeImage && !failedImages[item._id] ? (
            <Image
              source={{ uri: item.storeImage }}
              style={styles.storeImage}
              onError={() => setFailedImages((prev) => ({ ...prev, [item._id]: true }))}
            />
          ) : isDeliveryPhase ? (
            <Truck size={20} color={statusStyle.text} />
          ) : (
            <Package size={20} color={statusStyle.text} />
          )}
        </View>

        {/* Center: Order details */}
        <View style={styles.detailsContainer}>
          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status === "Processing"
                ? "Awaiting Rider"
                : item.status === "Placed"
                  ? "Current Order"
                  : item.status}
            </Text>
          </View>

          {/* Title: Pharmacy Name • Order number */}
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{item.pharmacyName}</Text>
            <Text style={styles.orderNumberText}>
              #{item.orderId.replace("ORD-", "")}
            </Text>
          </View>

          {/* Metadata: items count, time, date */}
          <View style={styles.metadataRow}>
            <View style={styles.metaItem}>
              <Package size={12} color={theme.textMuted} />
              <Text style={styles.metaText}>
                {item.itemsCount} {item.itemsCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.metaItem}>
              <Clock size={12} color={theme.textMuted} />
              <Text style={styles.metaText}>{formattedTime}</Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.metaItem}>
              <Calendar size={12} color={theme.textMuted} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>

          {/* A delivered order that still has something to rate */}
          {item.status === "Delivered" && (!item.review?.storeRating || !item.review?.deliveryRating) && (
            <TouchableOpacity style={styles.rateRow} activeOpacity={0.8} onPress={() => setRatingFor(item)}>
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.rateRowText}>
                {!item.review?.storeRating && !item.review?.deliveryRating
                  ? "Rate pharmacy & delivery"
                  : !item.review?.storeRating
                    ? "Rate the pharmacy"
                    : "Rate the delivery"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Right: Chevron Arrow */}
        <ChevronRight size={16} color={theme.textMuted} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return order.orderId.toLowerCase().includes(query);
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={() => {
            if (searchActive) {
              setSearchActive(false);
              setSearchQuery("");
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>

        {searchActive ? (
          <View style={styles.searchBarContainer}>
            <Search size={16} color={theme.textMuted} style={styles.searchIconInside} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_by_order_id')}
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            <TouchableOpacity
              onPress={() => {
                if (searchQuery) {
                  setSearchQuery("");
                } else {
                  setSearchActive(false);
                }
              }}
              style={styles.clearSearchButton}
            >
              <X size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>{t('medicine_orders')}</Text>
            <TouchableOpacity
              onPress={() => setSearchActive(true)}
              style={styles.searchButton}
            >
              <Search size={20} color={theme.text} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10B981"]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={40} color={theme.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No Results Found" : "No Orders Yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `We couldn't find any orders matching "${searchQuery}"`
                  : "You haven't ordered any medicines yet."}
              </Text>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
            </View>
          )
        }
      />

      <OrderRatingModal
        visible={!!ratingFor}
        onClose={() => setRatingFor(null)}
        orderId={ratingFor?._id || ""}
        storeName={ratingFor?.pharmacyName || "the pharmacy"}
        deliveryMode={ratingFor?.deliveryMode}
        review={ratingFor?.review}
        onSaved={(review) => {
          setOrders((prev) => prev.map((o) => (o._id === ratingFor?._id ? { ...o, review } : o)));
        }}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  // Same header recipe as the Family Members / Address Book / Health
  // screens - white bar + shadow, plain icon back button, fontSize
  // 20/600/#111827 title.
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
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
  searchButton: {
    padding: 8,
    marginRight: -12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    marginLeft: 8,
    marginRight: 12,
  },
  searchIconInside: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: c.text,
    paddingVertical: 8,
    fontWeight: "500",
  },
  clearSearchButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: c.card,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: c.borderLight,
    marginBottom: 12,
  },
  storeImage: { width: 44, height: 44, borderRadius: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  detailsContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  titleRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 0,
    width: "100%",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "600",
    color: c.text,
    marginBottom: 2,
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: "400",
    color: c.text,
    marginBottom: 2,
  },
  bullet: {
    color: c.textMuted,
    marginHorizontal: 6,
    fontWeight: "700",
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: c.isDark ? "#F59E0B22" : "#FEF3C7",
  },
  rateRowText: { fontSize: 12, fontWeight: "800", color: c.isDark ? "#D9B26A" : "#B45309" },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 11,
    color: c.textSecondary,
  },
  chevron: {
    marginLeft: 8,
  },
  orderItemsList: {
    width: "100%",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingTop: 8,
  },
  orderItemDetailRow: {
    width: "100%",
    marginBottom: 8,
  },
  orderItemMainLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  orderItemSubLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 2,
  },
  orderItemNameText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.text,
    flex: 1,
    marginRight: 8,
  },
  orderItemPriceText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.text,
  },
  orderItemSubText: {
    fontSize: 11,
    color: c.textMuted,
  },
  orderItemDiscountText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: c.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: "center",
  },
});
