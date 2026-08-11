import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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

interface Order {
  _id: string;
  orderId: string;
  pharmacyName: string;
  itemsCount: number;
  totalAmount: number;
  status: "Placed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  deliveryDate?: string;
  items?: any[];
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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const getStatusStyle = (status: string) => {
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
        <View style={styles.iconCircle}>
          {isDeliveryPhase ? (
            <Truck size={20} color="#0284C7" />
          ) : (
            <Package size={20} color="#4F46E5" />
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
              <Package size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>
                {item.itemsCount} {item.itemsCount === 1 ? "item" : "items"}
              </Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.metaItem}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{formattedTime}</Text>
            </View>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.metaItem}>
              <Calendar size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Right: Chevron Arrow */}
        <ChevronRight size={16} color="#9CA3AF" style={styles.chevron} />
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
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
        >
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>

        {searchActive ? (
          <View style={styles.searchBarContainer}>
            <Search size={16} color="#9CA3AF" style={styles.searchIconInside} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by Order ID..."
              placeholderTextColor="#9CA3AF"
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
              <X size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Medicine Orders</Text>
            <TouchableOpacity
              onPress={() => setSearchActive(true)}
              style={styles.searchButton}
            >
              <Search size={20} color="#1F2937" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2FA561"]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={40} color="#9CA3AF" />
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
              <ActivityIndicator size="large" color="#2FA561" />
            </View>
          )
        }
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  searchButton: {
    padding: 8,
    marginRight: -12,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
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
    color: "#1F2937",
    paddingVertical: 8,
    fontWeight: "500",
  },
  clearSearchButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
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
    color: "#1F2937",
    marginBottom: 2,
  },
  orderNumberText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#1F2937",
    marginBottom: 2,
  },
  bullet: {
    color: "#D1D5DB",
    marginHorizontal: 6,
    fontWeight: "700",
  },
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
    color: "#6B7280",
  },
  chevron: {
    marginLeft: 8,
  },
  orderItemsList: {
    width: "100%",
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
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
    color: "#374151",
    flex: 1,
    marginRight: 8,
  },
  orderItemPriceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  orderItemSubText: {
    fontSize: 11,
    color: "#9CA3AF",
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
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    marginTop: 100,
    alignItems: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 84,
  },
});
