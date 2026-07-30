import AppIcon from "@/src/components/icons/AppIcon";
import QuantityControl from "@/src/features/pharmacy/components/QuantityControl";
import { addItemLocal } from "@/src/redux/slices/cartSlice";
import { RootState } from "@/src/redux/store";
import { addItemToCart } from "@/src/services/api/cart.api";
import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

interface Props {
  visible: boolean;
  medicine: any;
  storeId: string;
  storeName: string;
  isStoreOpen?: boolean;
  onClose: () => void;
}

export default function MedicineDetailBottomSheet({
  visible,
  medicine,
  storeId,
  storeName,
  isStoreOpen = true,
  onClose,
}: Props) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const carts = useSelector((state: RootState) => state.cart);
  const storeCart = carts[storeId];
  const [isDescriptionExpanded, setIsDescriptionExpanded] =
    React.useState(false);

  React.useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [medicine]);

  const cartItem = useMemo(() => {
    if (!storeCart || !medicine) return null;
    const sku = medicine.sku || medicine.inventoryId || medicine.medicineId;
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
  const rating = medicine?.rating || 4.8;

  const medicineImage = useMemo(() => {
    if (!medicine) return null;
    return (
      medicine.imageUrl ||
      medicine.firstImgUrl ||
      (Array.isArray(medicine.images) &&
        medicine.images.find(
          (img: any) => typeof img === "string" && img.trim() !== "",
        )) ||
      null
    );
  }, [medicine]);

  const handleAddToCart = async () => {
    if (!isStoreOpen || !medicine) return;

    try {
      const sku =
        medicine.sku ||
        medicine.inventoryId ||
        medicine.medicineId ||
        medicine._id ||
        medicine.id;
      const cartItem = {
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
        image: medicineImage,
        batchId: Array.isArray(medicine.batchNum)
          ? String(medicine.batchNum[0] ?? "")
          : String(medicine.batchNum ?? ""),
        expiryDate: Array.isArray(medicine.expiryDate)
          ? (medicine.expiryDate[0] ?? null)
          : (medicine.expiryDate ?? null),
      };

      // Backend expects productId in the item argument
      await addItemToCart(storeId, storeName, {
        ...cartItem,
        productId: cartItem.medicineId,
      });

      dispatch(
        addItemLocal({
          storeId,
          storeName,
          item: cartItem,
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
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          {/* Floating Header Buttons */}
          <View style={[styles.floatingHeader, { top: insets.top - 12 || 16 }]}>
            <TouchableOpacity style={styles.circleButton} onPress={onClose}>
              <AppIcon name="x" size={20} color="#1C1C1E" />
            </TouchableOpacity>
            {/* <TouchableOpacity style={styles.circleButton} onPress={onClose}>
              <AppIcon name="shopping-bag" size={20} color="#1C1C1E" />
            </TouchableOpacity> */}
          </View>

          {/* Handle bar */}
          <View style={styles.handleBar} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Medicine Image */}
            <View style={styles.imageContainer}>
              {medicineImage ? (
                <Image
                  source={{ uri: medicineImage }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <AppIcon name="pill" size={80} color="#E5E7EB" />
                </View>
              )}
            </View>

            {/* Medicine Info */}
            <View style={styles.infoContainer}>
              <View style={styles.titleRow}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={styles.name}>{medicine.name}</Text>
                  {medicine.brand && (
                    <Text style={styles.brand}>by {medicine.brand}</Text>
                  )}
                </View>

                {isInCart && (
                  <View style={styles.qtyPillContainer}>
                    <QuantityControl
                      storeId={storeId}
                      sku={String(
                        medicine.sku ||
                          medicine.inventoryId ||
                          medicine.medicineId ||
                          medicine._id ||
                          medicine.id,
                      )}
                      productId={
                        medicine.medicineId || medicine._id || medicine.id
                      }
                      quantity={cartItem.quantity}
                      disabled={!isStoreOpen}
                      size="medium"
                    />
                  </View>
                )}
              </View>

              {/* Price section */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{price}</Text>
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

              {medicine.composition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Composition</Text>
                  <Text style={styles.sectionContent}>
                    {medicine.composition}
                  </Text>
                </View>
              )}

              {medicine.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionContent}>
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
                          Read More
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
                            Read Less
                          </Text>
                        </>
                      )}
                  </Text>
                </View>
              )}

              {medicine.packSize && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pack Size</Text>
                  <Text style={styles.sectionContent}>{medicine.packSize}</Text>
                </View>
              )}

              {medicine.expiryDate && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Expiry Date</Text>
                  <Text style={styles.sectionContent}>
                    {formatExpiryDate(medicine.expiryDate)}
                  </Text>
                </View>
              )}

              {medicine.storage && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Storage Instructions</Text>
                  <Text style={styles.sectionContent}>{medicine.storage}</Text>
                </View>
              )}

              {(medicine.isPrescriptionRequired ||
                medicine.prescriptionRequired) && (
                <View style={styles.prescriptionWarning}>
                  <AppIcon name="file-text" size={20} color="#EF4444" />
                  <Text style={styles.prescriptionText}>
                    Prescription Required
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            {/* <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.7}
            >
              <AppIcon name="phone" size={18} color="#0E7439" />
              <Text style={styles.secondaryButtonText}>Call Pharmacy</Text>
            </TouchableOpacity> */}

            <View
              style={[
                styles.primaryActionWrapper,
                { paddingBottom: insets.bottom - 32 },
              ]}
            >
              {isInCart ? (
                <QuantityControl
                  storeId={storeId}
                  sku={String(
                    medicine.sku ||
                      medicine.inventoryId ||
                      medicine.medicineId ||
                      medicine._id ||
                      medicine.id,
                  )}
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
                    Add Cart
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },
  handleBar: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 2,
    zIndex: 10,
  },
  floatingHeader: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 20,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  imageContainer: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.42,
    backgroundColor: "#F9FAFB",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  qtyPillContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metadataText: {
    fontSize: 13,
    color: "#8A8A8E",
    fontWeight: "500",
  },
  discountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#EF4444",
  },
  infoContainer: {
    paddingBottom: 16,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8A8A8E",
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0E7439",
  },
  originalPrice: {
    fontSize: 13,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  sectionContent: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 20,
  },
  prescriptionWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  prescriptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#0E7439",
    borderRadius: 12,
    paddingVertical: 14,
    width: "40%",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0E7439",
  },
  primaryActionWrapper: {
    width: "56%",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0E7439",
    paddingVertical: 14,
    borderRadius: 12,
    width: "100%",
  },
  addButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addButtonTextDisabled: {
    color: "#9CA3AF",
  },
  readMoreText: {
    color: "#0E7439",
    fontWeight: "700",
  },
});
