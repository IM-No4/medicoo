import AppIcon from "@/src/components/icons/AppIcon";
import QuantityControl from "@/src/features/pharmacy/components/QuantityControl";
import { CartItem, StoreCart } from "@/src/redux/slices/cart.types";
import { RootState } from "@/src/redux/store";
import { getStoreDetails } from "@/src/services/api/pharmacy.api";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Plus,
  ShoppingBag,
  Ticket,
  User,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { executeAction } from "../../actions/ActionExecutor";
import { useTrackActivity } from "../../hooks/useTrackActivity";
import { setSelectedAddress } from "../../redux/slices/addressSlice";

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

export default function CartScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { storeID } = route.params || {};

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector(
    (state: RootState) => state.address.selectedAddress,
  );
  const currentLocation = useSelector(
    (state: RootState) => state.location.currentLocation,
  );

  const lat = selectedAddress?.latitude ?? currentLocation?.latitude ?? 0;
  const long = selectedAddress?.longitude ?? currentLocation?.longitude ?? 0;

  const [offlineStores, setOfflineStores] = useState<Record<string, boolean>>(
    {},
  );
  const [storeDistances, setStoreDistances] = useState<Record<string, number>>({});
  const [storePlatformFees, setStorePlatformFees] = useState<Record<string, number>>({});
  const [isGstChargesExpanded, setIsGstChargesExpanded] = useState<Record<string, boolean>>({});

  const toggleGstCharges = (storeId: string) => {
    setIsGstChargesExpanded((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  // Get all available carts
  const storeCarts = useMemo(() => {
    if (storeID) {
      const storeCart = carts[storeID];
      return storeCart ? [storeCart] : [];
    } else {
      return Object.values(carts);
    }
  }, [carts, storeID]);

  React.useEffect(() => {
    let active = true;
    const fetchStatuses = async () => {
      const ids = storeCarts.map((c) => c.storeId);
      if (ids.length === 0) return;

      for (const id of ids) {
        try {
          const details = await getStoreDetails({
            storeId: id,
            lat,
            long,
          });
          if (!active) return;
          const isOnline =
            details?.status === "online" || details?.storeStatus === "online";
          setOfflineStores((prev) => ({
            ...prev,
            [id]: !isOnline,
          }));
          if (details?.distance) {
            const dist = parseFloat(details.distance);
            if (!isNaN(dist)) {
              setStoreDistances((prev) => ({
                ...prev,
                [id]: dist,
              }));
            }
          }
          if (details?.platformFee !== undefined) {
            const fee = Number(details.platformFee);
            if (!isNaN(fee)) {
              setStorePlatformFees((prev) => ({
                ...prev,
                [id]: fee,
              }));
            }
          }
        } catch (error) {
          console.error(`Failed to fetch store details for ${id}`, error);
          if (!active) return;
          setOfflineStores((prev) => ({
            ...prev,
            [id]: false,
          }));
        }
      }
    };

    fetchStatuses();
    return () => {
      active = false;
    };
  }, [storeCarts, lat, long]);

  const [isReceiverModalVisible, setIsReceiverModalVisible] = useState(false);
  const [tempReceiverName, setTempReceiverName] = useState(
    selectedAddress?.receiverName || "John Doe",
  );
  const [tempReceiverPhone, setTempReceiverPhone] = useState(
    selectedAddress?.receiverPhone || "+91 9876543210",
  );

  const [contacts, setContacts] = useState<any[]>([]);
  const [contactsPermission, setContactsPermission] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);

  const checkContactsPermission = async () => {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      setContactsPermission(status);
      if (status === "granted") {
        fetchContacts();
      }
    } catch (e) {
      console.warn("Failed checking contacts permission", e);
    }
  };

  const handleContactIconPress = async () => {
    if (contactsPermission !== "granted") {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        setContactsPermission(status);
        if (status === "granted") {
          fetchContacts();
          setIsContactModalVisible(true);
        } else {
          alert("Contacts permission is required to select from contacts.");
        }
      } catch (e) {
        console.warn("Failed requesting contacts permission", e);
      }
    } else {
      setIsContactModalVisible(true);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });
      setContacts(data || []);
    } catch (e) {
      console.warn("Failed fetching contacts list", e);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts.slice(0, 30);
    }
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phoneNumbers?.some((p: any) =>
          p.number?.replace(/\s+/g, "").includes(q),
        ),
    );
  }, [contacts, searchQuery]);

  React.useEffect(() => {
    if (isReceiverModalVisible) {
      void checkContactsPermission();
    } else {
      setSearchQuery("");
      setIsContactModalVisible(false);
    }
  }, [isReceiverModalVisible]);



  const [instructions, setInstructions] = useState("");
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  React.useEffect(() => {
    if (route.params?.appliedCoupon) {
      setAppliedCoupon(route.params.appliedCoupon);
    }
  }, [route.params?.appliedCoupon]);

  React.useEffect(() => {
    if (selectedAddress) {
      setTempReceiverName(selectedAddress.receiverName || "John Doe");
      setTempReceiverPhone(selectedAddress.receiverPhone || "+91 9876543210");
    }
  }, [selectedAddress]);

  // Local state for which store is currently visible
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    storeCarts.length > 0 ? storeCarts[0].storeId : null,
  );

  React.useEffect(() => {
    if (storeCarts.length > 0) {
      if (
        !selectedStoreId ||
        !storeCarts.some((c) => c.storeId === selectedStoreId)
      ) {
        setSelectedStoreId(storeCarts[0].storeId);
      }
    } else {
      setSelectedStoreId(null);
    }
  }, [storeCarts, selectedStoreId]);

  const activeCart = useMemo(() => {
    return (
      storeCarts.find((c) => c.storeId === selectedStoreId) || storeCarts[0]
    );
  }, [storeCarts, selectedStoreId]);

  // Track cart as resumable activity when there are items
  const totalCartItems = storeCarts.reduce(
    (sum, c) => sum + Object.keys(c.items).length,
    0,
  );
  useTrackActivity({
    id: `cart-${storeID || "all"}`,
    title:
      totalCartItems > 0
        ? `Medicine Order (${totalCartItems} item${totalCartItems !== 1 ? "s" : ""})`
        : "Medicine Cart",
    subtitle: "Continue from where you left",
    icon: "shopping-bag",
    stack: "PharmacyStack",
    screen: "Cart",
    params: storeID ? { storeID } : {},
    progress: 0.6,
  });

  const renderCartItem = (item: CartItem, storeId: string) => {
    return (
      <View style={styles.itemRow} key={item.sku}>
        <View style={styles.itemImageWrapper}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Clock size={16} color="#6B7280" />
            </View>
          )}
        </View>

        <View style={styles.itemMainInfo}>
          <Text style={styles.itemNameText}>{item.name}</Text>
          {item.brand && item.brand !== "Not Available" && (
            <Text style={styles.itemBrandText} numberOfLines={1}>
              by {item.brand}
            </Text>
          )}

          <View style={styles.itemBottomRow}>
            <View style={styles.priceRowContainer}>
              {item.discountPrice && item.discountPrice < item.price ? (
                <>
                  <Text style={styles.itemOriginalPriceText}>
                    ₹{formatPrice(item.price * item.quantity)}
                  </Text>
                  <Text style={styles.itemDiscountPriceText}>
                    ₹{formatPrice(item.discountPrice * item.quantity)}
                  </Text>
                </>
              ) : (
                <Text style={styles.itemDiscountPriceText}>
                  ₹{formatPrice(item.price * item.quantity)}
                </Text>
              )}
            </View>

            <View style={styles.itemQuantityControl}>
              <QuantityControl
                storeId={storeId}
                sku={item.sku}
                quantity={item.quantity}
                productId={item.medicineId}
                size="small"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderActiveCart = (storeCart: StoreCart) => {
    if (!storeCart) return null;

    const cartItems = Object.values(storeCart.items);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
      0,
    );
    const distanceKm = storeDistances[storeCart.storeId];
    const deliveryFee = subtotal > 500 ? 0 : (distanceKm !== undefined ? Math.round(30 + distanceKm * 5) : 40);
    const platformFee = storePlatformFees[storeCart.storeId] ?? 5;
    const otherCharges = 2; // Flat packing/handling fee of ₹2
    const taxes = subtotal * 0.18; // GST
    const gstAndOtherCharges = taxes + platformFee + otherCharges;

    // Coupon discount logic
    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === "percentage") {
        couponDiscount = Math.min(
          subtotal * (appliedCoupon.value / 100),
          appliedCoupon.maxValue || 9999,
        );
      } else if (appliedCoupon.type === "flat") {
        couponDiscount = appliedCoupon.value;
      } else if (appliedCoupon.type === "delivery") {
        couponDiscount = deliveryFee;
      }
    }

    const total = Math.max(subtotal + deliveryFee + gstAndOtherCharges - couponDiscount, 0);

    const receiverName = selectedAddress?.receiverName || "John Doe";
    const receiverPhone = selectedAddress?.receiverPhone || "+91 9876543210";

    const isOffline = !!offlineStores[storeCart.storeId];

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View style={styles.pharmacyCard}>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Info size={16} color="#EF4444" />
              <Text style={styles.offlineBannerText}>
                Currently Offline: This pharmacy is not accepting orders right
                now.
              </Text>
            </View>
          )}

          {/* Top Delivery Address & Time Row */}
          {!isOffline && (
            <TouchableOpacity
              style={styles.topAddressRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AddressBookModal")}
            >
              <View style={styles.topAddressLeft}>
                <MapPin size={16} color="#089643" />
                <View style={styles.topAddressTextCol}>
                  <Text style={styles.topAddressLabelText} numberOfLines={1}>
                    Delivering to {selectedAddress?.label || "Home"}
                  </Text>
                  <Text style={styles.topAddressFullText} numberOfLines={1}>
                    {selectedAddress?.fullAddress || "Select delivery address"}
                  </Text>
                </View>
              </View>

              <View style={styles.topAddressRight}>
                <View style={styles.topTimeBadge}>
                  <Clock size={12} color="#089643" />
                  <Text style={styles.topTimeText}>30 mins</Text>
                </View>
                <ChevronDown size={16} color="#64748B" />
              </View>
            </TouchableOpacity>
          )}

          {/* Pharmacy Header */}
          <View style={styles.pharmacyHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pharmacyNameText}>{storeCart.storeName}</Text>
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {cartItems.map((item) => renderCartItem(item, storeCart.storeId))}
          </View>

          {/* Instructions */}
          {isEditingInstructions ? (
            <View style={styles.instructionsInputWrapper}>
              <TextInput
                style={styles.instructionsInput}
                multiline
                numberOfLines={3}
                placeholder="Write delivery instructions here... (e.g., ring the bell, keep at gate)"
                placeholderTextColor="#9CA3AF"
                value={instructions}
                onChangeText={setInstructions}
                autoFocus
              />
              <View style={styles.instructionsActionRow}>
                <TouchableOpacity
                  style={styles.cancelInstructionsBtn}
                  onPress={() => {
                    setIsEditingInstructions(false);
                  }}
                >
                  <Text style={styles.cancelInstructionsText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveInstructionsBtn}
                  onPress={() => {
                    setIsEditingInstructions(false);
                  }}
                >
                  <Text style={styles.saveInstructionsText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.instructionButton}
              onPress={() => setIsEditingInstructions(true)}
            >
              <Plus size={16} color="#4B5563" />
              <Text style={styles.instructionText} numberOfLines={1}>
                {instructions
                  ? `Instructions: ${instructions}`
                  : "Add delivery instructions"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.cardDivider} />

          {/* Coupon Section */}
          {appliedCoupon ? (
            <View style={styles.appliedCouponContainer}>
              <View style={styles.appliedCouponInfo}>
                <Ticket size={20} color="#0E7439" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.appliedCouponCode}>
                    Code {appliedCoupon.code} applied!
                  </Text>
                  <Text style={styles.appliedCouponSavings}>
                    Saving ₹{couponDiscount.toFixed(2)} on this order
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                <Text style={styles.removeCouponText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.couponRow}
              onPress={() =>
                navigation.navigate("CouponScreen", {
                  storeId: storeCart.storeId,
                })
              }
            >
              <Ticket size={20} color="#E11D48" />
              <Text style={styles.couponText}>Use Coupons / Offers</Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <View style={styles.cardDivider} />

          {/* Receiver Details */}
          <View style={styles.receiverOneLinerRow}>
            <View style={styles.receiverOneLinerLeft}>
              <User size={14} color="#64748B" />
              <Text style={styles.receiverLabelPrefix}>Receiver:</Text>
              <Text style={styles.receiverDetailsText} numberOfLines={1}>
                {receiverName} ({receiverPhone})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsReceiverModalVisible(true)}
              style={styles.receiverChangeBtn}
            >
              <Text style={styles.receiverChangeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* Billing Details */}
          <View style={styles.billingContainer}>
            <Text style={styles.billingTitle}>Bill Summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{formatPrice(subtotal)}</Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text
                  style={[
                    styles.billLabel,
                    { color: "#0E7439", fontWeight: "700" },
                  ]}
                >
                  Coupon Discount ({appliedCoupon.code})
                </Text>
                <Text
                  style={[
                    styles.billValue,
                    { color: "#0E7439", fontWeight: "700" },
                  ]}
                >
                  -₹{formatPrice(couponDiscount)}
                </Text>
              </View>
            )}
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{formatPrice(deliveryFee)}</Text>
            </View>
            <TouchableOpacity
              style={styles.billRowToggleable}
              onPress={() => toggleGstCharges(storeCart.storeId)}
              activeOpacity={0.7}
            >
              <View style={styles.billRowLabelCol}>
                <Text style={styles.billLabel}>GST and other charges</Text>
                {isGstChargesExpanded[storeCart.storeId] ? (
                  <ChevronUp size={14} color="#6B7280" style={styles.chevronIcon} />
                ) : (
                  <ChevronDown size={14} color="#6B7280" style={styles.chevronIcon} />
                )}
              </View>
              <Text style={styles.billValue}>₹{formatPrice(gstAndOtherCharges)}</Text>
            </TouchableOpacity>

            {isGstChargesExpanded[storeCart.storeId] && (
              <View style={styles.breakupContainer}>
                <View style={styles.breakupRow}>
                  <Text style={styles.breakupLabel}>GST (18%)</Text>
                  <Text style={styles.breakupValue}>₹{formatPrice(taxes)}</Text>
                </View>
                <View style={styles.breakupRow}>
                  <Text style={styles.breakupLabel}>Platform Fee</Text>
                  <Text style={styles.breakupValue}>₹{formatPrice(platformFee)}</Text>
                </View>
                <View style={styles.breakupRow}>
                  <Text style={styles.breakupLabel}>Packaging & Handling</Text>
                  <Text style={styles.breakupValue}>₹{formatPrice(otherCharges)}</Text>
                </View>
              </View>
            )}
            <View style={[styles.billRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{formatPrice(total)}</Text>
            </View>
          </View>

          <View style={styles.policyCard}>
            <Info size={16} color="#9CA3AF" />
            <Text style={styles.policyText}>
              Orders cannot be cancelled once packed. Any discrepancy will be
              handled by our support.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (storeCarts.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContent}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/11329/11329061.png",
            }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>Nothing in your cart</Text>
          <Text style={styles.emptySubtitle}>
            Browse our pharmacies and add medicines to your cart
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => executeAction("OPEN_PHARMACY_LIST")}
          >
            <Text style={styles.browseButtonText}>Browse Pharmacies</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSaveReceiver = () => {
    dispatch(
      setSelectedAddress({
        ...selectedAddress,
        latitude: selectedAddress?.latitude ?? 0,
        longitude: selectedAddress?.longitude ?? 0,
        receiverName: tempReceiverName,
        receiverPhone: tempReceiverPhone,
      }),
    );
    setIsReceiverModalVisible(false);
  };



  const renderStickyFooter = (storeCart: StoreCart) => {
    if (!storeCart) return null;
    const isOffline = !!offlineStores[storeCart.storeId];
    const cartItems = Object.values(storeCart.items);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
      0,
    );
    const distanceKm = storeDistances[storeCart.storeId];
    const deliveryFee = subtotal > 500 ? 0 : (distanceKm !== undefined ? Math.round(30 + distanceKm * 5) : 40);
    const platformFee = storePlatformFees[storeCart.storeId] ?? 5;
    const otherCharges = 2; // Flat packing/handling fee of ₹2
    const taxes = subtotal * 0.18; // GST
    const gstAndOtherCharges = taxes + platformFee + otherCharges;

    let couponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === "percentage") {
        couponDiscount = Math.min(
          subtotal * (appliedCoupon.value / 100),
          appliedCoupon.maxValue || 9999,
        );
      } else if (appliedCoupon.type === "flat") {
        couponDiscount = appliedCoupon.value;
      } else if (appliedCoupon.type === "delivery") {
        couponDiscount = deliveryFee;
      }
    }

    const total = Math.max(subtotal + deliveryFee + gstAndOtherCharges - couponDiscount, 0);

    // No address selected used to be silently invisible past this point -
    // checkout would proceed straight through with the "John Doe" / fake
    // phone placeholder and whatever fallback coordinates downstream
    // screens default to. Now it's a hard stop that sends the user to pick
    // a real one first.
    const handleProceedToCheckout = () => {
      if (!selectedAddress) {
        alert("Please select a delivery address before proceeding to pay.");
        navigation.navigate("AddressBookModal");
        return;
      }
      executeAction("OPEN_CHECKOUT", {
        storeId: storeCart.storeId,
        amount: total,
        deliveryFee: deliveryFee,
        subtotal: subtotal,
        taxes: taxes,
        couponDiscount: couponDiscount,
        platformFee: platformFee,
        otherCharges: otherCharges,
      });
    };

    return (
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
        ]}
      >
        <View style={styles.stickyFooterRow}>
          {/* Left Division: Payment Details */}
          <TouchableOpacity
            style={styles.paymentCol}
            onPress={handleProceedToCheckout}
            activeOpacity={0.7}
          >
            <CreditCard size={18} color="#089643" />
            <View style={styles.paymentTextCol}>
              <Text style={styles.selectedPaymentText}>
                Payment Options
              </Text>
              <Text style={styles.changePaymentLink}>UPI, Cards, COD</Text>
            </View>
          </TouchableOpacity>

          {/* Right Division: Pay Button */}
          <TouchableOpacity
            style={[
              styles.payBtnRight,
              isOffline && styles.payBtnRightDisabled,
            ]}
            activeOpacity={isOffline ? 1 : 0.8}
            disabled={isOffline}
            onPress={handleProceedToCheckout}
          >
            <Text style={styles.payBtnText}>
              {isOffline ? "Store Offline" : `Pay ₹${formatPrice(total)}`}
            </Text>
            {!isOffline && <ChevronRight size={16} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Carts</Text>
          {storeCarts.length > 1 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{storeCarts.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Store Selector Buttons */}
      {storeCarts.length > 1 && (
        <View style={styles.selectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorContent}
          >
            {storeCarts.map((item) => {
              const itemIsOffline = !!offlineStores[item.storeId];
              return (
                <TouchableOpacity
                  key={item.storeId}
                  style={[
                    styles.selectorTab,
                    selectedStoreId === item.storeId &&
                      styles.selectorTabActive,
                    itemIsOffline && styles.selectorTabOffline,
                  ]}
                  onPress={() => setSelectedStoreId(item.storeId)}
                  activeOpacity={0.8}
                >
                  <ShoppingBag
                    size={14}
                    color={
                      selectedStoreId === item.storeId
                        ? "#fff"
                        : itemIsOffline
                          ? "#EF4444"
                          : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.selectorTabText,
                      selectedStoreId === item.storeId &&
                        styles.selectorTabTextActive,
                      itemIsOffline && styles.selectorTabTextOffline,
                    ]}
                  >
                    {item.storeName}
                    {itemIsOffline ? " (Offline)" : ""}
                  </Text>
                  <View
                    style={[
                      styles.selectorBadge,
                      selectedStoreId === item.storeId &&
                        styles.selectorBadgeActive,
                      itemIsOffline && styles.selectorBadgeOffline,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorBadgeText,
                        selectedStoreId === item.storeId &&
                          styles.selectorBadgeTextActive,
                        itemIsOffline && styles.selectorBadgeTextOffline,
                      ]}
                    >
                      {Object.keys(item.items).length}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>{renderActiveCart(activeCart)}</View>

      {/* Sticky Order Bar */}
      {activeCart && renderStickyFooter(activeCart)}

      {/* Receiver Edit Bottom Sheet Modal */}
      <Modal
        visible={isReceiverModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsReceiverModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setIsReceiverModalVisible(false)}
        >
          <TouchableOpacity style={styles.bottomSheetContent} activeOpacity={1}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>Edit Receiver Details</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 0 }}
            >
              <Text style={styles.inputLabel}>Receiver Name</Text>
              <TextInput
                style={styles.modalInput}
                value={tempReceiverName}
                onChangeText={setTempReceiverName}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.mobileInputContainer}>
                <TextInput
                  style={styles.mobileInput}
                  value={tempReceiverPhone}
                  onChangeText={setTempReceiverPhone}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity
                  style={styles.contactIconBtn}
                  onPress={handleContactIconPress}
                  activeOpacity={0.7}
                >
                  <User size={20} color="#089643" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsReceiverModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveReceiver}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Separate Contact Selection Bottom Sheet Modal */}
      <Modal
        visible={isContactModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsContactModalVisible(false);
          setSearchQuery("");
        }}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => {
            setIsContactModalVisible(false);
            setSearchQuery("");
          }}
        >
          <TouchableOpacity
            style={[
              styles.bottomSheetContent,
              { height: "100%", maxHeight: "95%" },
            ]}
            activeOpacity={1}
          >
            <View style={styles.dragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Select Contact</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsContactModalVisible(false);
                  setSearchQuery("");
                }}
                style={styles.modalCloseIconBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.contactSearchInput}
              placeholder="Search contacts by name or number..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            <ScrollView
              style={styles.contactsList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredContacts.length === 0 ? (
                <Text style={styles.noContactsText}>No contacts found</Text>
              ) : (
                filteredContacts.map((c: any) => (
                  <TouchableOpacity
                    key={c.id || c.name}
                    style={styles.contactItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setTempReceiverName(c.name || "");
                      const num = c.phoneNumbers?.[0]?.number || "";
                      setTempReceiverPhone(num);
                      setIsContactModalVisible(false);
                      setSearchQuery("");
                    }}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {c.name ? c.name[0].toUpperCase() : "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{c.name}</Text>
                      {c.phoneNumbers?.[0]?.number && (
                        <Text style={styles.contactPhone}>
                          {c.phoneNumbers[0].number}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
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
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  headerBadge: {
    backgroundColor: "#2FA561",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  selectorWrapper: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  selectorTab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  selectorTabActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  selectorTabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  },
  selectorTabTextActive: {
    color: "#fff",
  },
  selectorBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  selectorBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  selectorBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
  },
  selectorBadgeTextActive: {
    color: "#fff",
  },
  contentWrapper: {
    flex: 1,
  },
  pharmacyCard: {
    backgroundColor: "#FFFFFF",
    margin: 0,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  pharmacyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 12,
  },
  pharmacyNameText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  deliveryTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  deliveryTimeText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2FA561",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemsListContainer: {
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  itemMainInfo: {
    flex: 1,
    height: 80,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 18,
  },
  itemBrandText: {
    fontSize: 11,
    color: "#8A8A8E",
    fontWeight: "500",
    marginTop: 0,
  },
  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  priceRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDiscountPriceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  itemOriginalPriceText: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  itemQuantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  couponText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  sectionContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  changeActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E11D48",
  },
  receiverInfoBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
    gap: 2,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  receiverPhone: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  addressBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  addressLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  fullAddressText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  billingContainer: {
    padding: 20,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  billValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  billRowToggleable: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billRowLabelCol: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronIcon: {
    marginLeft: 6,
  },
  breakupContainer: {
    backgroundColor: "#F9FAFB",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  breakupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  breakupLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  breakupValue: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  checkoutFooter: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  paymentMethodSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  payButton: {
    backgroundColor: "#2FA561",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#2FA561",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  payButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payPrice: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  paySubtext: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
  placeOrderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  policyCard: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    marginTop: 10,
    alignItems: "flex-start",
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 16,
  },
  emptyContainer: {
    backgroundColor: "#fff",
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: "#2FA561",
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 20,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 8,
  },
  stickyFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  paymentTextCol: {
    justifyContent: "center",
  },
  selectedPaymentText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  changePaymentLink: {
    fontSize: 12,
    color: "#0E7439",
    fontWeight: "600",
    marginTop: 1,
  },
  payBtnRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#0E7439",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: 140,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  saveButton: {
    backgroundColor: "#0E7439",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  paymentOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    borderRadius: 12,
  },
  paymentOptionActive: {
    backgroundColor: "#E8F5E9",
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  paymentOptionTextActive: {
    color: "#0E7439",
    fontWeight: "700",
  },
  checkMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0E7439",
  },
  instructionsInputWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  instructionsInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 60,
  },
  instructionsActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelInstructionsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelInstructionsText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
  },
  saveInstructionsBtn: {
    backgroundColor: "#0E7439",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  saveInstructionsText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0E7439",
  },
  appliedCouponSavings: {
    fontSize: 12,
    color: "#2E7D32",
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C62828",
    paddingHorizontal: 4,
  },
  topAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DCFCE7",
  },
  topAddressLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  topAddressTextCol: {
    flex: 1,
  },
  topAddressLabelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
  },
  topAddressFullText: {
    fontSize: 11,
    color: "#1E3A8A",
    marginTop: 1,
  },
  topAddressRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topTimeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#166534",
  },
  receiverOneLinerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  receiverOneLinerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  receiverLabelPrefix: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },
  receiverDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
    flex: 1,
  },
  receiverChangeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  receiverChangeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#089643",
  },
  offlineBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FEE2E2",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
  },
  offlineBannerText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  offlineCartBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  offlineCartBadgeText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },
  selectorTabOffline: {
    borderColor: "#FEE2E2",
    backgroundColor: "#FEF2F2",
  },
  selectorTabTextOffline: {
    color: "#EF4444",
  },
  selectorBadgeOffline: {
    backgroundColor: "#FEE2E2",
  },
  selectorBadgeTextOffline: {
    color: "#EF4444",
  },
  payBtnRightDisabled: {
    backgroundColor: "#9CA3AF",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 60,
    width: "100%",
    maxHeight: "85%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  contactsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mobileInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingRight: 8,
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  contactIconBtn: {
    padding: 8,
  },
  contactSearchInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    marginBottom: 12,
  },
  contactsList: {
    maxHeight: "100%",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#FCFDFD",
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0E7439",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  contactPhone: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  noContactsText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalCloseIconBtn: {
    padding: 4,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
});
