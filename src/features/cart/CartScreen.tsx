import AppIcon from "@/src/components/icons/AppIcon";
import SelectPrescriptionSheet from "@/src/components/modals/SelectPrescriptionSheet";
import QuantityControl from "@/src/features/pharmacy/components/QuantityControl";
import { AttachedPrescription, CartItem, StoreCart } from "@/src/redux/slices/cart.types";
import { RootState } from "@/src/redux/store";
import { uploadDocument } from "@/src/services/api/document.api";
import { getStoreDetails } from "@/src/services/api/pharmacy.api";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { loadLastMethod, SavedChoice } from "@/src/payments/pendingStore";
import { useSettlePendingMedicinePayments } from "@/src/payments/medicineCheckout";
import { fetchOrderQuote, OrderQuote, QuoteRefused } from "@/src/services/api/quote.api";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from '@/src/components/ThemedStatusBar';
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Info,
  MapPin,
  Plus,
  ShieldAlert,
  ShoppingBag,
  Ticket,
  Upload,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
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
import { getProfileDetails } from "../../services/api/user.api";
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import { Modal } from '../../components/ThemedModal';

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};

// Mirrors homeController.js's own SERVICEABILITY_RADIUS_KM - a store beyond
// this from the currently selected address isn't delivering here, same
// threshold the home feed already uses to decide store visibility.
const SERVICEABILITY_RADIUS_KM = 10;

export default function CartScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  // The payment method the customer last chose (kept on this device) - shown in the footer so
  // they aren't asked to choose every time.
  const [savedPayment, setSavedPayment] = useState<SavedChoice | null>(null);
  useFocusEffect(
    useCallback(() => {
      loadLastMethod().then(setSavedPayment);
    }, [])
  );
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
  // Bumped by offlineSync.ts on a stale-length background resume - a
  // store's online/offline status, distance-based fee, and platform fee
  // can all have changed while the app sat backgrounded, same reasoning as
  // useHomeFeed.ts's own reaction to this.
  const resumeSignal = useSelector((state: RootState) => state.appLifecycle.resumeSignal);

  const lat = selectedAddress?.latitude ?? currentLocation?.latitude ?? 0;
  const long = selectedAddress?.longitude ?? currentLocation?.longitude ?? 0;

  const authMobile = useSelector((state: any) => state.auth.mobile);
  // Fallback for addresses with no receiver stored at all (e.g. "I am the
  // receiver" saved before that actually persisted the user's own info) -
  // real profile data instead of the previous fake "John Doe" placeholder.
  const [myProfile, setMyProfile] = useState<{ name?: string; mobile?: string } | null>(null);
  useEffect(() => {
    getProfileDetails().then((p: any) => {
      setMyProfile({ name: p?.name, mobile: p?.mobile || p?.phone });
    }).catch(() => {});
  }, []);
  const myMobile = myProfile?.mobile || authMobile;

  // Prescription attached per-store-cart (each store's cart is checked out
  // independently, so the requirement/attachment is scoped the same way).
  const [attachedPrescriptions, setAttachedPrescriptions] = useState<
    Record<string, AttachedPrescription>
  >({});
  const [uploadingPrescriptionFor, setUploadingPrescriptionFor] = useState<
    string | null
  >(null);
  const [selectSheetStoreId, setSelectSheetStoreId] = useState<string | null>(
    null,
  );

  const handleUploadNewPrescription = (storeId: string) => {
    Alert.alert(
      t('add_prescription'),
      t('choose_how_you_d_like_to_add_your_pres'),
      [
        { text: "Take Photo", onPress: () => pickPrescriptionImage(storeId, "camera") },
        { text: "Choose from Gallery", onPress: () => pickPrescriptionImage(storeId, "gallery") },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const pickPrescriptionImage = async (
    storeId: string,
    source: "camera" | "gallery",
  ) => {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        alert("Permission is required to add a prescription this way.");
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingPrescriptionFor(storeId);

      const formData = new FormData();
      const fileName = asset.uri.split("/").pop() || "prescription.jpg";
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : "image/jpeg";
      formData.append("file", { uri: asset.uri, name: fileName, type } as any);
      formData.append("documentType", "prescription");
      formData.append(
        "name",
        `Prescription - ${new Date().toLocaleDateString("en-IN")}`,
      );

      // Goes through the same document library as Records, so an uploaded
      // prescription becomes a permanent, reusable document too - not a
      // one-off attachment.
      const doc = await uploadDocument(formData);
      setAttachedPrescriptions((prev) => ({
        ...prev,
        [storeId]: { mode: "image", documentId: doc._id, label: doc.name },
      }));
    } catch (e) {
      console.warn("Failed to upload prescription", e);
      alert("Could not upload your prescription. Please try again.");
    } finally {
      setUploadingPrescriptionFor(null);
    }
  };

  const handleSelectExistingPrescription = (prescription: AttachedPrescription) => {
    if (!selectSheetStoreId) return;
    setAttachedPrescriptions((prev) => ({
      ...prev,
      [selectSheetStoreId]: prescription,
    }));
  };

  const [offlineStores, setOfflineStores] = useState<Record<string, boolean>>(
    {},
  );
  // Whether each store's online/distance/fee status has resolved at least
  // once - offlineStores[id] defaults to falsy (not offline) before the
  // fetch below ever settles, so without this the Pay button was live and
  // clickable for the first few seconds even for a store that turns out to
  // be offline.
  const [loadedStoreStatus, setLoadedStoreStatus] = useState<Record<string, boolean>>({});
  // Distance-based, recomputed every time the fetchStatuses effect below
  // re-runs (which already happens on address change via its lat/long
  // deps) - a store that was in range for the old address may no longer
  // be for the new one, same client-derived pattern as offlineStores.
  const [notServiceableStores, setNotServiceableStores] = useState<Record<string, boolean>>({});
  const [storeDistances, setStoreDistances] = useState<Record<string, number>>({});
  const [storePlatformFees, setStorePlatformFees] = useState<Record<string, number>>({});
  const [isGstChargesExpanded, setIsGstChargesExpanded] = useState<Record<string, boolean>>({});

  const toggleGstCharges = (storeId: string) => {
    setIsGstChargesExpanded((prev) => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  // Always show every store the user has items in - storeID (passed when
  // opening the cart from a specific pharmacy's sticky bar) previously
  // filtered this down to just that one store, hiding any other carts
  // entirely with no way to get back to them. It's now only used to pick
  // which store tab starts selected, below.
  const storeCarts = useMemo(() => Object.values(carts), [carts]);
  // A payment the customer started and then left (or whose app was closed): settle it if the server has
  // finished the order, and know which stores are still confirming so the cart doesn't invite a second payment.
  const confirmingPayments = useSettlePendingMedicinePayments(storeCarts as any);

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
              setNotServiceableStores((prev) => ({
                ...prev,
                [id]: dist > SERVICEABILITY_RADIUS_KM,
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
        } finally {
          if (active) {
            setLoadedStoreStatus((prev) => ({ ...prev, [id]: true }));
          }
        }
      }
    };

    fetchStatuses();
    return () => {
      active = false;
    };
  }, [storeCarts, lat, long, resumeSignal]);

  const [isReceiverModalVisible, setIsReceiverModalVisible] = useState(false);
  const [tempReceiverName, setTempReceiverName] = useState(
    selectedAddress?.receiverName || "",
  );
  const [tempReceiverPhone, setTempReceiverPhone] = useState(
    selectedAddress?.receiverNumber || "",
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

  // The bill is the server's: fees, GST on them, coupon, policy wording. We send the cart and the address and show what
  // comes back, so a change to a fee or a rate needs no app update. (services/api/quote.api.ts)
  const [quotes, setQuotes] = useState<Record<string, OrderQuote>>({});
  const [quoteErrors, setQuoteErrors] = useState<Record<string, string>>({});
  const quoteKey = useMemo(
    () =>
      JSON.stringify([
        Object.values(carts).map((c: any) => [c.storeId, Object.values(c.items).map((i: any) => [i.medicineId, i.quantity, i.price, i.discountPrice])]),
        selectedAddress?.latitude,
        selectedAddress?.longitude,
        appliedCoupon?.code,
      ]),
    [carts, selectedAddress?.latitude, selectedAddress?.longitude, appliedCoupon?.code],
  );
  React.useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      for (const storeCart of Object.values(carts) as any[]) {
        const items = Object.values(storeCart.items).map((i: any) => ({ productId: i.medicineId, quantity: i.quantity, price: i.price, discountPrice: i.discountPrice }));
        if (items.length === 0) continue;
        try {
          const quote = await fetchOrderQuote({ storeId: storeCart.storeId, items, address: selectedAddress, couponCode: appliedCoupon?.code });
          if (!active) return;
          setQuotes((prev) => ({ ...prev, [storeCart.storeId]: quote }));
          setQuoteErrors((prev) => ({ ...prev, [storeCart.storeId]: "" }));
        } catch (error: any) {
          if (!active) return;
          if (error instanceof QuoteRefused && error.code.startsWith("COUPON_") && appliedCoupon) {
            // The server will not honour this coupon (expired, used up, minimum not met): drop it and say why.
            alert(error.message);
            setAppliedCoupon(null);
            return;
          }
          setQuoteErrors((prev) => ({ ...prev, [storeCart.storeId]: error instanceof QuoteRefused ? error.message : "We couldn't work out your bill. Check your connection." }));
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  React.useEffect(() => {
    if (selectedAddress) {
      setTempReceiverName(selectedAddress.receiverName || myProfile?.name || "");
      setTempReceiverPhone(selectedAddress.receiverNumber || myMobile || "");
    }
  }, [selectedAddress, myProfile, myMobile]);

  // Local state for which store is currently visible - defaults to the
  // store the cart was opened from (storeID), if it still has items,
  // otherwise the first available cart.
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    storeID && carts[storeID]
      ? storeID
      : storeCarts.length > 0
        ? storeCarts[0].storeId
        : null,
  );
  const [isStoreSwitcherVisible, setIsStoreSwitcherVisible] = useState(false);

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

  const renderCartItem = (item: CartItem, storeId: string, isLast: boolean) => {
    const hasDiscount = !!item.discountPrice && item.discountPrice < item.price;
    return (
      <View style={[styles.itemRow, isLast && styles.itemRowLast]} key={item.sku}>
        <View style={styles.itemImageWrapper}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="contain" />
          ) : (
            <View style={styles.itemImagePlaceholder}>
              <Clock size={16} color={theme.textSecondary} />
            </View>
          )}
        </View>

        {/* name + brand on top; price and stepper share the last line */}
        <View style={styles.itemMainInfo}>
          <Text style={styles.itemNameText} numberOfLines={2}>
            {item.name}
          </Text>
          {item.brand && item.brand !== "Not Available" && (
            <Text style={styles.itemBrandText} numberOfLines={1}>
              by {item.brand}
            </Text>
          )}

          <View style={styles.itemBottomRow}>
            <View style={styles.priceRowContainer}>
              <Text style={styles.itemDiscountPriceText}>
                ₹{formatPrice((hasDiscount ? (item.discountPrice as number) : item.price) * item.quantity)}
              </Text>
              {hasDiscount && (
                <Text style={styles.itemOriginalPriceText}>₹{formatPrice(item.price * item.quantity)}</Text>
              )}
            </View>
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
    );
  };

  const renderActiveCart = (storeCart: StoreCart) => {
    if (!storeCart) return null;

    const cartItems = Object.values(storeCart.items);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
      0,
    );
    // Everything below comes from the server's quote. Until it arrives there is nothing to charge, so nothing is shown.
    const quote = quotes[storeCart.storeId];
    const quoteError = quoteErrors[storeCart.storeId];
    const deliveryEtaMins = quote?.deliveryEtaMins ?? 30;
    const deliveryFee = quote?.deliveryFee ?? 0;
    const platformFee = quote?.platformFee ?? 0;
    const otherCharges = quote?.packaging ?? 0;
    const taxes = quote?.feeGst ?? 0;
    const gstAndOtherCharges = taxes + platformFee + otherCharges;
    const couponDiscount = quote?.discount ?? 0;
    const total = quote?.total ?? 0;

    const receiverName = selectedAddress?.receiverName || myProfile?.name || "Add receiver details";
    const receiverPhone = selectedAddress?.receiverNumber || myMobile || "";

    const isOffline = !!offlineStores[storeCart.storeId];
    const needsPrescription = cartItems.some((item) => item.prescriptionRequired);
    const attachedPrescription = attachedPrescriptions[storeCart.storeId];
    const isUploadingForThisStore = uploadingPrescriptionFor === storeCart.storeId;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
      >
        <View style={styles.pharmacyCard}>
          {/* Top Delivery Address & Time Row */}
          {!isOffline && (
            <TouchableOpacity
              style={styles.topAddressRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("AddressBookModal")}
            >
              <View style={styles.topAddressLeft}>
                <MapPin size={16} color="#10B981" />
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
                  <Clock size={12} color="#10B981" />
                  <Text style={styles.topTimeText}>{deliveryEtaMins} mins</Text>
                </View>
                <ChevronDown size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          )}

          {/* Store + items */}
          <View style={styles.sectionCard}>
          {/* Pharmacy Header */}
          <View style={styles.pharmacyHeader}>
            <TouchableOpacity
              style={styles.pharmacyNameRow}
              activeOpacity={0.7}
              onPress={() =>
                executeAction("OPEN_PHARMACY", { pharmacyId: storeCart.storeId })
              }
            >
              <View style={styles.pharmacyIconBadge}>
                <ShoppingBag size={16} color={theme.text} />
              </View>
              <Text style={styles.pharmacyNameText}>{storeCart.storeName}</Text>
              <ChevronRight size={16} color={theme.textSecondary} style={{ marginLeft: -4 }} />
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {cartItems.map((item, index) => renderCartItem(item, storeCart.storeId, index === cartItems.length - 1))}
          </View>

          </View>

          {/* Prescription Requirement */}
          {needsPrescription && (
            <View style={styles.prescriptionSection}>
              <View style={styles.prescriptionWarningRow}>
                <ShieldAlert size={16} color={theme.warning} />
                <Text style={styles.prescriptionWarningText}>
                  {t('some_items_in_this_order_need_a_valid')}
                </Text>
              </View>

              {attachedPrescription ? (
                <View style={styles.prescriptionAttachedCard}>
                  <FileText size={18} color="#10B981" />
                  <Text style={styles.prescriptionAttachedLabel} numberOfLines={1}>
                    {attachedPrescription.label}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectSheetStoreId(storeCart.storeId)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.receiverChangeBtnText}>{t('change')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.prescriptionOptionsRow}>
                  <TouchableOpacity
                    style={styles.prescriptionOptionBtn}
                    onPress={() => setSelectSheetStoreId(storeCart.storeId)}
                    activeOpacity={0.8}
                  >
                    <FileText size={16} color="#10B981" />
                    <Text style={styles.prescriptionOptionText}>{t('select_existing')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.prescriptionOptionBtn}
                    onPress={() => handleUploadNewPrescription(storeCart.storeId)}
                    disabled={isUploadingForThisStore}
                    activeOpacity={0.8}
                  >
                    <Upload size={16} color="#10B981" />
                    <Text style={styles.prescriptionOptionText}>
                      {isUploadingForThisStore ? "Uploading..." : "Upload New"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Instructions, coupon, receiver */}
          <View style={styles.sectionCard}>
          {/* Instructions */}
          {isEditingInstructions ? (
            <View style={styles.instructionsInputWrapper}>
              <TextInput
                style={styles.instructionsInput}
                multiline
                numberOfLines={3}
                placeholder={t('delivery_instructions_placeholder')}
                placeholderTextColor={theme.textMuted}
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
                  <Text style={styles.cancelInstructionsText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveInstructionsBtn}
                  onPress={() => {
                    setIsEditingInstructions(false);
                  }}
                >
                  <Text style={styles.saveInstructionsText}>SAVE</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.instructionButton}
              onPress={() => setIsEditingInstructions(true)}
            >
              <View style={styles.instructionIcon}>
                <Plus size={16} color={theme.textSecondary} />
              </View>
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
                <Ticket size={20} color="#007C69" />
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
                <Text style={styles.removeCouponText}>{t('remove')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.couponRow}
              onPress={() =>
                navigation.navigate("CouponScreen", {
                  storeId: storeCart.storeId,
                  amount: subtotal,
                })
              }
            >
              <Ticket size={18} color="#E11D48" />
              <Text style={styles.couponText}>{t('use_coupons')}</Text>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}

          <View style={styles.cardDivider} />

          {/* Receiver Details */}
          <View style={styles.receiverOneLinerRow}>
            <View style={styles.receiverOneLinerLeft}>
              <User size={14} color={theme.textSecondary} />
              <Text style={styles.receiverLabelPrefix}>{t('receiver')}</Text>
              <Text style={styles.receiverDetailsText} numberOfLines={1}>
                {receiverName}{receiverPhone ? `, ${receiverPhone}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsReceiverModalVisible(true)}
              style={styles.receiverChangeBtn}
            >
              <Text style={styles.receiverChangeBtnText}>{t('change')}</Text>
            </TouchableOpacity>
          </View>

          </View>

          {/* Billing Details */}
          <View style={[styles.sectionCard, styles.billingContainer]}>
            <Text style={styles.billingTitle}>{t('bill_summary')}</Text>
            {!quote ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{quoteError || "Working out your bill..."}</Text>
              </View>
            ) : (
              <>
                {quote.lines
                  .filter((l) => l.group === "main")
                  .map((l) => (
                    <View key={l.id} style={styles.billRow}>
                      <Text style={[styles.billLabel, l.kind === "discount" && { color: "#007C69", fontWeight: "700" }]}>{l.label}</Text>
                      <Text style={[styles.billValue, l.kind === "discount" && { color: "#007C69", fontWeight: "700" }]}>
                        {l.free ? "FREE" : `${l.amount < 0 ? "-" : ""}₹${formatPrice(Math.abs(l.amount))}`}
                      </Text>
                    </View>
                  ))}
                {quote.lines.some((l) => l.group === "charges") && (
                  <>
                    <TouchableOpacity
                      style={styles.billRowToggleable}
                      onPress={() => toggleGstCharges(storeCart.storeId)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.billRowLabelCol}>
                        <Text style={styles.billLabel}>{t('gst_charges')}</Text>
                        {isGstChargesExpanded[storeCart.storeId] ? (
                          <ChevronUp size={14} color={theme.textSecondary} style={styles.chevronIcon} />
                        ) : (
                          <ChevronDown size={14} color={theme.textSecondary} style={styles.chevronIcon} />
                        )}
                      </View>
                      <Text style={styles.billValue}>₹{formatPrice(quote.lines.filter((l) => l.group === "charges").reduce((sum, l) => sum + l.amount, 0))}</Text>
                    </TouchableOpacity>
                    {isGstChargesExpanded[storeCart.storeId] && (
                      <View style={styles.breakupContainer}>
                        {quote.lines
                          .filter((l) => l.group === "charges")
                          .map((l) => (
                            <View key={l.id} style={styles.breakupRow}>
                              <Text style={styles.breakupLabel}>{l.label}</Text>
                              <Text style={styles.breakupValue}>₹{formatPrice(l.amount)}</Text>
                            </View>
                          ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
            <View style={[styles.billRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>{t('grand_total')}</Text>
              <Text style={styles.grandTotalValue}>₹{formatPrice(total)}</Text>
            </View>
          </View>

          <View style={styles.policyCard}>
            <Info size={16} color={theme.textMuted} />
            <Text style={styles.policyText}>
              {quote ? `${quote.policy.cancellation} ${quote.policy.returns}` : "Orders cannot be cancelled once packed. Any discrepancy will be handled by our support."}
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
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('cart')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={36} color="#10B981" />
          </View>
          <Text style={styles.emptyTitle}>{t('nothing_in_cart')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('browse_our_pharmacies_and_add_medicine')}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => executeAction("OPEN_PHARMACY_LIST")}
            activeOpacity={0.85}
          >
            <ShoppingBag size={18} color="#fff" />
            <Text style={styles.browseButtonText}>{t('browse_pharmacies')}</Text>
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
        receiverNumber: tempReceiverPhone,
      }),
    );
    setIsReceiverModalVisible(false);
  };



  const renderStickyFooter = (storeCart: StoreCart) => {
    if (!storeCart) return null;
    const isOffline = !!offlineStores[storeCart.storeId];
    const notServiceable = !isOffline && !!notServiceableStores[storeCart.storeId];
    const cartItems = Object.values(storeCart.items);
    const needsPrescription = cartItems.some((item) => item.prescriptionRequired);
    const attachedPrescription = attachedPrescriptions[storeCart.storeId];
    const isPrescriptionMissing = needsPrescription && !attachedPrescription;
    const subtotal = cartItems.reduce(
      (sum, item) => sum + (item.discountPrice || item.price) * item.quantity,
      0,
    );
    const quote = quotes[storeCart.storeId];
    const deliveryFee = quote?.deliveryFee ?? 0;
    const platformFee = quote?.platformFee ?? 0;
    const otherCharges = quote?.packaging ?? 0;
    const taxes = quote?.feeGst ?? 0;
    const couponDiscount = quote?.discount ?? 0;
    const total = quote?.total ?? 0;

    // No address selected used to be silently invisible past this point -
    // checkout would proceed straight through with the "John Doe" / fake
    // phone placeholder and whatever fallback coordinates downstream
    // screens default to. Now it's a hard stop that sends the user to pick
    // a real one first.
    // `autoPay`: Pay with the saved method (processing screen). `resumeOnly`: just check on a payment already started.
    const handleProceedToCheckout = (autoPay = false, resumeOnly = false) => {
      if (autoPay && !resumeOnly && !savedPayment) return; // Pay is disabled until a payment method is chosen
      if (!quote) {
        alert("We are still working out your bill. Please try again in a moment.");
        return;
      }
      // A saved card needs its details typed, so it (and "Change") opens the options list.
      const openProcessing = resumeOnly || (autoPay && !!savedPayment && savedPayment.method !== 'card');
      if (!selectedAddress) {
        alert("Please select a delivery address before proceeding to pay.");
        navigation.navigate("AddressBookModal");
        return;
      }
      if (isPrescriptionMissing) {
        alert("Please add a prescription for the items that require one before proceeding to pay.");
        return;
      }
      if (notServiceable) {
        alert("This store doesn't deliver to your selected address. Please change your delivery address or remove these items.");
        return;
      }
      executeAction(openProcessing ? "OPEN_PAYMENT_PROCESSING" : "OPEN_CHECKOUT", {
        storeId: storeCart.storeId,
        amount: total,
        deliveryFee: deliveryFee,
        subtotal: subtotal,
        taxes: taxes,
        couponDiscount: couponDiscount,
        couponCode: quote.coupon?.code,
        platformFee: platformFee,
        otherCharges: otherCharges,
        prescriptionMode: attachedPrescription?.mode,
        prescriptionDocumentId: attachedPrescription?.documentId,
        prescriptionId: attachedPrescription?.prescriptionId,
        prescriptionRequired: needsPrescription,
        ...(openProcessing ? { autoPay: true, resumeOnly } : {}),
      });
    };



    return (
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
        {confirmingPayments[storeCart.storeId] ? (
          <View style={styles.noticeRow}>
            <ActivityIndicator size="small" color="#10B981" />
            <View style={styles.noticeTextCol}>
              <Text style={styles.noticeTitle}>Confirming your payment</Text>
              <Text style={styles.noticeSub}>We'll update your order as soon as it's confirmed.</Text>
            </View>
            <TouchableOpacity style={styles.noticeAction} onPress={() => handleProceedToCheckout(true, true)} activeOpacity={0.8}>
              <Text style={styles.noticeActionText}>Check</Text>
            </TouchableOpacity>
          </View>
        ) : isOffline ? (
          <View style={styles.noticeRow}>
            <Info size={18} color={theme.textSecondary} />
            <Text style={styles.noticeTitleFlex}>
              {t('this_store_is_currently_offline')}
            </Text>
          </View>
        ) : notServiceable ? (
          <View style={styles.noticeRow}>
            <Info size={18} color={theme.textSecondary} />
            <Text style={styles.noticeTitleFlex}>
              {t('this_store_doesn_t_deliver_to_your_sel')}
            </Text>
          </View>
        ) : (
          <View style={styles.stickyFooterRow}>
            {/* Left Division: Payment Details */}
            <TouchableOpacity
              style={styles.paymentCol}
              onPress={() => handleProceedToCheckout(false)}
              activeOpacity={0.7}
            >
              <CreditCard size={18} color="#10B981" />
              <View style={styles.paymentTextCol}>
                {savedPayment ? (
                  <>
                    <Text style={styles.selectedPaymentText} numberOfLines={1}>
                      {savedPayment.label}
                    </Text>
                    <Text style={styles.changePaymentLink} numberOfLines={1}>
                      {savedPayment.sub ? `${savedPayment.sub} • ` : ''}Change
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.selectedPaymentText}>Payment</Text>
                    <Text style={styles.changePaymentLink}>Select payment method</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Right Division: Pay Button */}
            <TouchableOpacity
              style={[
                styles.payBtnRight,
                (isPrescriptionMissing || !savedPayment) && styles.payBtnRightDisabled,
              ]}
              activeOpacity={0.8}
              disabled={(!savedPayment && !isPrescriptionMissing) || !quote}
              onPress={() => handleProceedToCheckout(true)}
            >
              <Text style={styles.payBtnText}>
                {isPrescriptionMissing
                  ? "Add Prescription to Pay"
                  : `Pay ₹${formatPrice(total)}`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleContainer}
          activeOpacity={storeCarts.length > 1 ? 0.7 : 1}
          onPress={() => storeCarts.length > 1 && setIsStoreSwitcherVisible(true)}
        >
          <Text style={styles.headerTitle}>
            {storeCarts.length > 1 ? `My Carts (${storeCarts.length})` : "My Cart"}
          </Text>
          {storeCarts.length > 1 && (
            <ChevronDown size={18} color={theme.text} />
          )}
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        {activeCart && !loadedStoreStatus[activeCart.storeId] ? (
          <View style={styles.statusLoadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          renderActiveCart(activeCart)
        )}
      </View>

      {/* Sticky Order Bar - held back until the store's online/offline
          status has actually resolved, so the Pay button can't be tapped
          against a stale "not offline yet" default while that's loading. */}
      {activeCart && loadedStoreStatus[activeCart.storeId] && renderStickyFooter(activeCart)}

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
            <Text style={styles.modalTitle}>{t('edit_receiver')}</Text>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 0 }}
            >
              <Text style={styles.inputLabel}>{t('receiver_name')}</Text>
              <TextInput
                style={styles.modalInput}
                value={tempReceiverName}
                onChangeText={setTempReceiverName}
                placeholder={t('enter_name')}
                placeholderTextColor={theme.textMuted}
              />

              <Text style={styles.inputLabel}>{t('mobile_number')}</Text>
              <View style={styles.mobileInputContainer}>
                <TextInput
                  style={styles.mobileInput}
                  value={tempReceiverPhone}
                  onChangeText={setTempReceiverPhone}
                  placeholder={t('enter_mobile')}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity
                  style={styles.contactIconBtn}
                  onPress={handleContactIconPress}
                  activeOpacity={0.7}
                >
                  <User size={20} color="#10B981" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsReceiverModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveReceiver}
                >
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
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
              <Text style={styles.modalHeaderTitle}>{t('select_contact')}</Text>
              <TouchableOpacity
                onPress={() => {
                  setIsContactModalVisible(false);
                  setSearchQuery("");
                }}
                style={styles.modalCloseIconBtn}
                activeOpacity={0.7}
              >
                <AppIcon name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.contactSearchInput}
              placeholder={t('search_contacts')}
              placeholderTextColor={theme.textMuted}
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
                <Text style={styles.noContactsText}>{t('no_contacts')}</Text>
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

      {/* Prescription Selection Bottom Sheet */}
      <SelectPrescriptionSheet
        visible={!!selectSheetStoreId}
        onClose={() => setSelectSheetStoreId(null)}
        onSelect={handleSelectExistingPrescription}
      />

      {/* Store Switcher Bottom Sheet - tap the "My Carts (N)" header to
          switch which store's cart is showing. */}
      <Modal
        visible={isStoreSwitcherVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStoreSwitcherVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomSheetOverlay}
          activeOpacity={1}
          onPress={() => setIsStoreSwitcherVisible(false)}
        >
          <TouchableOpacity style={styles.bottomSheetContent} activeOpacity={1}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>{t('switch_cart')}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {storeCarts.map((item) => {
                const itemIsOffline = !!offlineStores[item.storeId];
                const itemNotServiceable = !itemIsOffline && !!notServiceableStores[item.storeId];
                const isActive = selectedStoreId === item.storeId;
                return (
                  <TouchableOpacity
                    key={item.storeId}
                    style={[
                      styles.storeSwitcherRow,
                      isActive && styles.storeSwitcherRowActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedStoreId(item.storeId);
                      setIsStoreSwitcherVisible(false);
                    }}
                  >
                    <View
                      style={[
                        styles.storeSwitcherIconWrap,
                        (itemIsOffline || itemNotServiceable) && styles.storeSwitcherIconWrapOffline,
                      ]}
                    >
                      <ShoppingBag
                        size={18}
                        color={itemIsOffline || itemNotServiceable ? "#EF4444" : "#007C69"}
                      />
                    </View>
                    <View style={styles.storeSwitcherTextCol}>
                      <Text style={styles.storeSwitcherName} numberOfLines={1}>
                        {item.storeName}
                      </Text>
                      <Text style={styles.storeSwitcherSubtext}>
                        {Object.keys(item.items).length} item
                        {Object.keys(item.items).length !== 1 ? "s" : ""}
                        {itemIsOffline ? " · Offline" : itemNotServiceable ? " · Not deliverable" : ""}
                      </Text>
                    </View>
                    {isActive && (
                      <View style={styles.storeSwitcherCheck}>
                        <AppIcon name="check" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: c.text,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  contentWrapper: {
    flex: 1,
  },
  statusLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pharmacyCard: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionCard: {
    backgroundColor: c.card,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
    overflow: "hidden",
  },
  pharmacyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  pharmacyNameRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
  },
  pharmacyIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  pharmacyNameText: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
  },
  deliveryTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  deliveryTimeText: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: "600",
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10B981",
    backgroundColor: c.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemsListContainer: {
    paddingHorizontal: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemImageWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.borderLight,
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
    backgroundColor: c.cardSecondary,
  },
  itemMainInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  itemNameText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.text,
    lineHeight: 17,
  },
  itemBrandText: {
    fontSize: 11,
    color: c.textMuted,
    fontWeight: "500",
  },
  itemBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  priceRowContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  itemDiscountPriceText: {
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
  },
  itemOriginalPriceText: {
    fontSize: 11,
    color: c.textMuted,
    textDecorationLine: "line-through",
  },
  itemQuantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  prescriptionSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    gap: 12,
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  prescriptionWarningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.warningBg,
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  prescriptionWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: c.warning,
  },
  prescriptionOptionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  prescriptionOptionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: c.successBg,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    paddingVertical: 12,
  },
  prescriptionOptionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  prescriptionAttachedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.successBg,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  prescriptionAttachedLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: c.success,
  },
  instructionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  instructionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: c.cardSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: c.borderLight,
    marginHorizontal: 16,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  couponText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: c.text,
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
    color: c.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  changeActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E11D48",
  },
  receiverInfoBox: {
    backgroundColor: c.cardSecondary,
    padding: 16,
    borderRadius: 16,
    gap: 2,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  receiverPhone: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: "500",
  },
  addressBox: {
    backgroundColor: c.cardSecondary,
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  addressLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  fullAddressText: {
    fontSize: 12,
    color: c.textSecondary,
    lineHeight: 18,
  },
  billingContainer: {
    padding: 16,
  },
  billingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
    marginBottom: 10,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12.5,
    color: c.textSecondary,
    fontWeight: "500",
  },
  billValue: {
    fontSize: 12.5,
    color: c.text,
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
    backgroundColor: c.cardSecondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.borderLight,
  },
  breakupRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  breakupLabel: {
    fontSize: 11.5,
    color: c.textSecondary,
    fontWeight: "500",
  },
  breakupValue: {
    fontSize: 11.5,
    color: c.textSecondary,
    fontWeight: "600",
  },
  grandTotalRow: {
    marginTop: 6,
    paddingTop: 14,
    marginBottom: 0,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  checkoutFooter: {
    backgroundColor: c.card,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  paymentMethodSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  payButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#10B981",
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
    fontSize: 16,
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
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  policyCard: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "flex-start",
  },
  policyText: {
    flex: 1,
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 17,
  },
  emptyContainer: {
    backgroundColor: c.card,
  },
  emptyContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: c.successBg,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: c.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  browseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  stickyFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.card,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
    paddingHorizontal: 16,
    paddingTop: 14,
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
  noticeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: c.cardSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeTextCol: { flex: 1 },
  noticeTitle: { fontSize: 14, fontWeight: "700", color: c.text },
  noticeTitleFlex: { flex: 1, fontSize: 13.5, fontWeight: "600", color: c.textSecondary, lineHeight: 19 },
  noticeSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
  noticeAction: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#10B981" },
  noticeActionText: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  offlineFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  offlineFooterText: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
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
    color: c.text,
  },
  changePaymentLink: {
    fontSize: 12,
    color: "#007C69",
    fontWeight: "600",
    marginTop: 1,
  },
  payBtnRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 140,
  },
  payBtnText: {
    fontSize: 14,
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
    backgroundColor: c.card,
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
    fontSize: 17,
    fontWeight: "800",
    color: c.text,
    marginBottom: 20,
    textAlign: "center",
  },
  storeSwitcherRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.borderLight,
    marginBottom: 10,
  },
  storeSwitcherRowActive: {
    backgroundColor: c.successBg,
    borderColor: "#10B981",
  },
  storeSwitcherIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  storeSwitcherIconWrapOffline: {
    backgroundColor: c.errorBg,
  },
  storeSwitcherTextCol: {
    flex: 1,
    marginRight: 8,
  },
  storeSwitcherName: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
    marginBottom: 2,
  },
  storeSwitcherSubtext: {
    fontSize: 12,
    color: c.textSecondary,
  },
  storeSwitcherCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: c.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
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
    backgroundColor: c.cardSecondary,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: c.textSecondary,
  },
  saveButton: {
    backgroundColor: "#007C69",
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
    borderBottomColor: c.borderLight,
    borderRadius: 12,
  },
  paymentOptionActive: {
    backgroundColor: c.successBg,
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: c.text,
  },
  paymentOptionTextActive: {
    color: "#007C69",
    fontWeight: "700",
  },
  checkMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007C69",
  },
  instructionsInputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  instructionsInput: {
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: c.text,
    textAlignVertical: "top",
    minHeight: 72,
  },
  instructionsActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  cancelInstructionsBtn: {
    height: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelInstructionsText: {
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: "700",
  },
  saveInstructionsBtn: {
    height: 40,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  saveInstructionsText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  appliedCouponContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.successBg,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appliedCouponInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007C69",
  },
  appliedCouponSavings: {
    fontSize: 11.5,
    color: c.success,
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.error,
    paddingHorizontal: 4,
  },
  topAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.card,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.borderLight,
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
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
  },
  topAddressFullText: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
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
    backgroundColor: c.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topTimeText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.success,
  },
  receiverOneLinerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  receiverOneLinerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  receiverLabelPrefix: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.textSecondary,
  },
  receiverDetailsText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.text,
    flex: 1,
  },
  receiverChangeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  receiverChangeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  offlineCartBadge: {
    backgroundColor: c.errorBg,
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
  payBtnRightDisabled: {
    backgroundColor: "#9CA3AF",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: c.card,
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
    backgroundColor: c.cardSecondary,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  contactsSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: c.textSecondary,
    marginTop: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mobileInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingRight: 8,
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
  },
  contactIconBtn: {
    padding: 8,
  },
  contactSearchInput: {
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: c.text,
    marginBottom: 12,
  },
  contactsList: {
    maxHeight: "100%",
    borderWidth: 1,
    borderColor: c.borderLight,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: c.card,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.successBg,
    justifyContent: "center",
    alignItems: "center",
  },
  contactAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#007C69",
  },
  contactName: {
    fontSize: 14,
    fontWeight: "600",
    color: c.text,
  },
  contactPhone: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 2,
  },
  noContactsText: {
    fontSize: 13,
    color: c.textMuted,
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
    fontSize: 17,
    fontWeight: "800",
    color: c.text,
  },
});
