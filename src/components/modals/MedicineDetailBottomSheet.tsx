import AppIcon from "@/src/components/icons/AppIcon";
import QuantityControl from "@/src/features/pharmacy/components/QuantityControl";
import { addItemLocal } from "@/src/redux/slices/cartSlice";
import { RootState } from "@/src/redux/store";
import { addItemToCart } from "@/src/services/api/cart.api";
import {
  getStockAlertStatus,
  subscribeStockAlert,
  unsubscribeStockAlert,
} from "@/src/services/api/stockAlert.api";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import { Modal } from '../ThemedModal';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const formatExpiryDate = (expiryDateStr: string | null | undefined): string => {
  if (!expiryDateStr) return "";
  const parts = expiryDateStr.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]}, ${year}`;
    }
  }
  return expiryDateStr;
};

const getMedicineImages = (medicine: any): string[] => {
  if (!medicine) return [];
  const fromArray = Array.isArray(medicine.images)
    ? medicine.images.filter((img: any) => typeof img === "string" && img.trim() !== "")
    : [];
  if (fromArray.length > 0) return fromArray;
  const single = medicine.imageUrl || medicine.firstImgUrl;
  return single ? [single] : [];
};

const getMedicineId = (medicine: any) =>
  medicine?.sku || medicine?.inventoryId || medicine?.medicineId || medicine?._id || medicine?.id;

interface Props {
  visible: boolean;
  medicine: any;
  storeId: string;
  storeName: string;
  isStoreOpen?: boolean;
  // Rest of the store's catalog, used to populate "Similar products" below
  // the main details. Tapping one opens that product's own detail screen on
  // top of this one (back returns here).
  allMedicines?: any[];
  onClose: () => void;
}

export default function MedicineDetailBottomSheet({
  visible,
  medicine,
  storeId,
  storeName,
  isStoreOpen = true,
  allMedicines = [],
  onClose,
}: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const carts = useSelector((state: RootState) => state.cart);
  const storeCart = carts[storeId];
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [likedSimilar, setLikedSimilar] = useState<Record<string, boolean>>({});
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  // A tapped similar product opens as its own detail screen stacked on this one.
  const [openedSimilar, setOpenedSimilar] = useState<any>(null);
  const [seeAllVisible, setSeeAllVisible] = useState(false);

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
    setImageIndex(0);
    setNotifyEnabled(false);
  }, [medicine]);

  // storeInventoryList (the endpoint this screen's medicine list comes
  // from) only ever returns items with onlineStocks > 0, but data can go
  // stale between fetching that list and viewing an item here (someone
  // else buys the last unit) - unitsAvailable is checked too since some
  // callers (search results) use that field name instead.
  const isOutOfStock = medicine
    ? (medicine.onlineStocks ?? medicine.unitsAvailable ?? 1) <= 0
    : false;

  // The real Medicine document id, distinct from getMedicineId() above
  // (which prefers sku/inventoryId for cart purposes) - stock alerts are
  // keyed against Medicine._id on the backend.
  const realMedicineId = medicine?.medicineId || medicine?._id || medicine?.id;

  // Restore whether the user is already subscribed (e.g. they backed out
  // and reopened this item) rather than always starting the bell off.
  useEffect(() => {
    if (!isOutOfStock || !realMedicineId || !storeId) return;
    let cancelled = false;
    getStockAlertStatus(String(realMedicineId), String(storeId))
      .then((res) => {
        if (!cancelled) setNotifyEnabled(!!res.subscribed);
      })
      .catch((e) => console.warn("Failed to load stock alert status", e));
    return () => {
      cancelled = true;
    };
  }, [isOutOfStock, realMedicineId, storeId]);

  const handleShare = async () => {
    if (!medicine) return;
    try {
      await Share.share({
        message: `${medicine.name}${storeName ? ` from ${storeName}` : ""} - ₹${price} on Medicoo`,
      });
    } catch (e) {
      console.warn("Failed to open share sheet", e);
    }
  };

  const handleNotifyMe = async () => {
    if (!realMedicineId || !storeId) return;
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    try {
      if (next) {
        await subscribeStockAlert(String(realMedicineId), String(storeId));
      } else {
        await unsubscribeStockAlert(String(realMedicineId), String(storeId));
      }
      Alert.alert(
        next ? "You're on the list" : "Notification cancelled",
        next
          ? `We'll let you know when ${medicine?.name || "this item"} is back in stock.`
          : "You won't be notified when this item is back in stock.",
      );
    } catch (e) {
      console.error("Failed to update stock alert subscription", e);
      setNotifyEnabled(!next);
      Alert.alert(t('something_went_wrong'), t('please_try_again'));
    }
  };

  const cartItem = useMemo(() => {
    if (!storeCart || !medicine) return null;
    const sku = getMedicineId(medicine);
    return storeCart.items[String(sku)] || null;
  }, [storeCart, medicine]);

  const originalPrice = medicine?.price ?? 0;
  const discountAmount = medicine?.discountPrice ?? 0;

  const price =
    discountAmount > 0 ? originalPrice - discountAmount : originalPrice;
  const hasDiscount = discountAmount > 0 && originalPrice > 0;
  const originalPriceToShow = hasDiscount ? originalPrice : null;
  const discount = hasDiscount
    ? Math.round((discountAmount / originalPrice) * 100)
    : 0;
  const isInCart = !!cartItem;

  const subtitle = useMemo(() => {
    if (!medicine) return "";
    return [medicine.category, medicine.form || medicine.brand]
      .filter(Boolean)
      .join(" / ");
  }, [medicine]);

  const images = useMemo(() => getMedicineImages(medicine), [medicine]);

  // "Similar" means a genuine substitute - same composition, same store -
  // not just anything else in the catalog. No match -> no section, rather
  // than falling back to unrelated items.
  const allSimilar = useMemo(() => {
    if (!medicine || !medicine.composition) return [];
    const currentId = String(getMedicineId(medicine));
    const currentComposition = String(medicine.composition).trim().toLowerCase();
    if (!currentComposition) return [];

    return allMedicines
      .filter((m) => {
        if (String(getMedicineId(m)) === currentId) return false;
        const composition = String(m.composition || "").trim().toLowerCase();
        return composition === currentComposition;
      });
  }, [allMedicines, medicine]);
  const similarMedicines = useMemo(() => allSimilar.slice(0, 10), [allSimilar]);

  const getItemPrice = (item: any) => {
    const original = item.price ?? 0;
    const off = item.discountPrice ?? 0;
    return off > 0 ? original - off : original;
  };

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== imageIndex) setImageIndex(index);
  };

  const handleAddToCart = async () => {
    if (!isStoreOpen || !medicine) return;

    try {
      const sku = getMedicineId(medicine);
      const cartItemPayload = {
        medicineId: medicine.medicineId || medicine._id || medicine.id,
        sku: sku,
        name: medicine.name,
        price: originalPrice,
        discountPrice: price,
        quantity: 1,
        brand: medicine.brand || medicine.manufacturer,
        composition: medicine.composition,
        prescriptionRequired:
          (medicine.isPrescriptionRequired || medicine.prescriptionRequired) ??
          false,
        image: images[0] || undefined,
        batchId: Array.isArray(medicine.batchNum)
          ? String(medicine.batchNum[0] ?? "")
          : String(medicine.batchNum ?? ""),
        expiryDate: Array.isArray(medicine.expiryDate)
          ? (medicine.expiryDate[0] ?? null)
          : (medicine.expiryDate ?? null),
      };

      // Backend expects productId in the item argument
      await addItemToCart(storeId, storeName, {
        ...cartItemPayload,
        productId: cartItemPayload.medicineId,
      });

      dispatch(
        addItemLocal({
          storeId,
          storeName,
          item: cartItemPayload,
        }),
      );
    } catch (e) {
      console.error("Failed to add item to cart", e);
    }
  };

  if (!medicine) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
          {/* Top Bar - same recipe as the rest of the app: white bar +
              shadow, plain icon back button. The share/notify buttons on
              the right keep their own filled chip style (iconCircle) -
              they're functional actions, not navigation. */}
          <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
            <TouchableOpacity style={styles.backButton} onPress={onClose} activeOpacity={0.7}>
              <AppIcon name="chevron-left" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.topBarRight}>
              <TouchableOpacity style={styles.iconCircle} onPress={handleShare}>
                <AppIcon name="share" size={18} color="#1C1C1E" />
              </TouchableOpacity>
              {isOutOfStock && (
                <TouchableOpacity style={styles.iconCircle} onPress={handleNotifyMe}>
                  <AppIcon
                    name="bell"
                    size={18}
                    color={notifyEnabled ? "#16A34A" : "#1C1C1E"}
                  />
                  {notifyEnabled && <View style={styles.notificationDot} />}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Image Carousel */}
            <View style={styles.imageCard}>
              {images.length > 0 ? (
                <FlatList
                  data={images}
                  keyExtractor={(_, i) => String(i)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={handleImageScroll}
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                  )}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <AppIcon name="pill" size={80} color="#E5E7EB" />
                </View>
              )}

              {images.length > 1 && (
                <View style={styles.dotsRow}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === imageIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Medicine Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{medicine.name}</Text>

              {!!subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}

              {medicine.description && (
                <Text style={styles.description}>
                  {isDescriptionExpanded ||
                  medicine.description.length <= 150 ? (
                    medicine.description
                  ) : (
                    <>
                      {medicine.description.slice(0, 150)}...{" "}
                      <Text
                        style={styles.readMoreText}
                        onPress={() => setIsDescriptionExpanded(true)}
                      >
                        {t('read_more')}
                      </Text>
                    </>
                  )}
                  {isDescriptionExpanded &&
                    medicine.description.length > 150 && (
                      <>
                        {" "}
                        <Text
                          style={styles.readMoreText}
                          onPress={() => setIsDescriptionExpanded(false)}
                        >
                          {t('read_less')}
                        </Text>
                      </>
                    )}
                </Text>
              )}

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{price}</Text>
                <Text style={styles.priceUnit}>/pack</Text>
                {originalPriceToShow && (
                  <Text style={styles.originalPrice}>
                    ₹{originalPriceToShow}
                  </Text>
                )}
                {discount > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                  </View>
                )}
              </View>

              {/* Add to cart - swaps for the increment/decrement counter
                  once the item is actually in the cart, and swaps back the
                  moment it's decremented away entirely (isInCart is derived
                  straight from Redux cart state, so this happens on its
                  own with no extra wiring needed here). */}
              <View style={styles.addRow}>
                {isInCart ? (
                  <QuantityControl
                    storeId={storeId}
                    sku={String(getMedicineId(medicine))}
                    productId={medicine.medicineId || medicine._id || medicine.id}
                    quantity={cartItem.quantity}
                    disabled={!isStoreOpen}
                    size="large"
                  />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !isStoreOpen && styles.addButtonDisabled,
                    ]}
                    disabled={!isStoreOpen}
                    onPress={handleAddToCart}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.addButtonText,
                        !isStoreOpen && styles.addButtonTextDisabled,
                      ]}
                    >
                      {t('add_to_cart')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {medicine.composition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('composition')}</Text>
                  <Text style={styles.sectionContent}>
                    {medicine.composition}
                  </Text>
                </View>
              )}

              {medicine.packSize && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('pack_size')}</Text>
                  <Text style={styles.sectionContent}>{medicine.packSize}</Text>
                </View>
              )}

              {medicine.expiryDate && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('expiry_date')}</Text>
                  <Text style={styles.sectionContent}>
                    {formatExpiryDate(medicine.expiryDate)}
                  </Text>
                </View>
              )}

              {medicine.storage && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('storage_instructions')}</Text>
                  <Text style={styles.sectionContent}>{medicine.storage}</Text>
                </View>
              )}

              {(medicine.isPrescriptionRequired ||
                medicine.prescriptionRequired) && (
                <View style={styles.prescriptionWarning}>
                  <AppIcon name="file-text" size={20} color="#EF4444" />
                  <Text style={styles.prescriptionText}>
                    {t('prescription_required')}
                  </Text>
                </View>
              )}
            </View>

            {/* Similar Products */}
            {similarMedicines.length > 0 && (
              <View style={styles.similarSection}>
                <View style={styles.similarHeaderRow}>
                  <Text style={styles.similarHeaderTitle}>{t('similar_products')}</Text>
                  <TouchableOpacity onPress={() => setSeeAllVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.similarSeeAll}>{t('see_all')}</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.similarList}
                >
                  {similarMedicines.map((item, index) => {
                    const itemImages = getMedicineImages(item);
                    const itemId = String(getMedicineId(item));
                    const isLiked = !!likedSimilar[itemId];
                    const itemOriginalPrice = item.price ?? 0;
                    const itemDiscountAmount = item.discountPrice ?? 0;
                    const itemPrice =
                      itemDiscountAmount > 0
                        ? itemOriginalPrice - itemDiscountAmount
                        : itemOriginalPrice;

                    return (
                      <TouchableOpacity
                        key={itemId || index}
                        style={styles.similarCard}
                        activeOpacity={0.8}
                        onPress={() => setOpenedSimilar(item)}
                      >
                        <View style={styles.similarImageWrapper}>
                          {itemImages[0] ? (
                            <Image
                              source={{ uri: itemImages[0] }}
                              style={styles.similarImage}
                              resizeMode="contain"
                            />
                          ) : (
                            <AppIcon name="pill" size={32} color="#E5E7EB" />
                          )}
                          <TouchableOpacity
                            style={styles.similarHeartBtn}
                            onPress={() =>
                              setLikedSimilar((prev) => ({
                                ...prev,
                                [itemId]: !prev[itemId],
                              }))
                            }
                          >
                            <AppIcon
                              name="heart"
                              size={14}
                              color={isLiked ? "#EF4444" : "#9CA3AF"}
                              fill={isLiked ? "#EF4444" : "none"}
                            />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.similarName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.similarPrice}>₹{itemPrice}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={{ height: insets.bottom + 24 }} />
          </ScrollView>
        </View>

      {/* All similar products */}
      <Modal visible={seeAllVisible} animationType="slide" onRequestClose={() => setSeeAllVisible(false)}>
        <View style={styles.container}>
          <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSeeAllVisible(false)} activeOpacity={0.7}>
              <AppIcon name="chevron-left" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.seeAllTitle}>{t('similar_products')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <FlatList
            data={allSimilar}
            keyExtractor={(item, i) => `${String(getMedicineId(item))}-${i}`}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const img = getMedicineImages(item)[0];
              return (
                <TouchableOpacity style={styles.gridCard} activeOpacity={0.8} onPress={() => setOpenedSimilar(item)}>
                  <View style={styles.gridImageWrapper}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.similarImage} resizeMode="contain" />
                    ) : (
                      <AppIcon name="pill" size={32} color={theme.textMuted} />
                    )}
                  </View>
                  <Text style={styles.similarName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.similarPrice}>₹{getItemPrice(item)}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Product opened from the grid sits above it; back returns to the grid */}
        {openedSimilar && (
          <MedicineDetailBottomSheet
            visible={!!openedSimilar && seeAllVisible}
            medicine={openedSimilar}
            storeId={storeId}
            storeName={storeName}
            isStoreOpen={isStoreOpen}
            allMedicines={allMedicines}
            onClose={() => setOpenedSimilar(null)}
          />
        )}
      </Modal>

      {/* Product opened from the carousel */}
      {openedSimilar && (
        <MedicineDetailBottomSheet
          visible={!!openedSimilar && !seeAllVisible}
          medicine={openedSimilar}
          storeId={storeId}
          storeName={storeName}
          isStoreOpen={isStoreOpen}
          allMedicines={allMedicines}
          onClose={() => setOpenedSimilar(null)}
        />
      )}
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  topBar: {
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
  topBarRight: {
    flexDirection: "row",
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: c.cardSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: c.borderLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  imageCard: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: c.card,
    overflow: "hidden",
  },
  image: {
    width: SCREEN_WIDTH,
    height: "100%",
  },
  placeholderImage: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: "#16A34A",
    width: 16,
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: c.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: c.textSecondary,
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
    color: c.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    color: c.text,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: "600",
    color: c.textMuted,
    marginRight: 4,
  },
  originalPrice: {
    fontSize: 13,
    color: c.textMuted,
    textDecorationLine: "line-through",
  },
  discountBadge: {
    backgroundColor: c.errorBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    borderRadius: 12,
  },
  addButtonDisabled: {
    backgroundColor: c.cardSecondary,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addButtonTextDisabled: {
    color: c.textMuted,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
    marginBottom: 2,
  },
  sectionContent: {
    fontSize: 12,
    fontWeight: "400",
    color: c.textSecondary,
    lineHeight: 20,
  },
  prescriptionWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: c.errorBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  prescriptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  readMoreText: {
    color: "#16A34A",
    fontWeight: "700",
  },
  similarSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  similarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  similarHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
  },
  similarSeeAll: {
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
  },
  seeAllTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
  },
  gridRow: {
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    maxWidth: "50%",
  },
  gridImageWrapper: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  similarList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  similarCard: {
    width: 110,
  },
  similarImageWrapper: {
    width: 110,
    height: 100,
    borderRadius: 12,
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  similarImage: {
    width: "80%",
    height: "80%",
  },
  similarHeartBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.card,
    justifyContent: "center",
    alignItems: "center",
  },
  similarName: {
    fontSize: 12,
    fontWeight: "600",
    color: c.text,
  },
  similarPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
    marginTop: 2,
  },
});
