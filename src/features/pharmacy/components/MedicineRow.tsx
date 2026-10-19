import AppIcon from "@/src/components/icons/AppIcon";
import { addItemLocal } from "@/src/redux/slices/cartSlice";
import { RootState } from "@/src/redux/store";
import { addItemToCart } from "@/src/services/api/cart.api";
import React, { useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import QuantityControl from "./QuantityControl";
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
  medicine: any;
  isStoreOpen?: boolean;
  storeId: string;
  storeName: string;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export default function MedicineRow({
  medicine,
  isStoreOpen,
  storeId,
  storeName,
  isFirst = false,
  isLast = false,
  onPress,
}: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const dispatch = useDispatch();
  const carts = useSelector((state: RootState) => state.cart);
  const storeCart = carts[storeId];

  const cartItem = useMemo(() => {
    if (!storeCart) return null;
    const sku = medicine.sku || medicine.inventoryId || medicine.medicineId;
    return storeCart.items[String(sku)] || null;
  }, [storeCart, medicine]);

  const originalPrice = medicine.price ?? 0;
  const discountAmount = medicine.discountPrice ?? 0;

  const price =
    discountAmount > 0 ? originalPrice - discountAmount : originalPrice;
  const hasDiscount = discountAmount > 0 && originalPrice > 0;
  const originalPriceToShow = hasDiscount ? originalPrice : null;
  const discount = hasDiscount
    ? Math.round((discountAmount / originalPrice) * 100)
    : 0;
  const storeOpen = isStoreOpen ?? true; // Default to open if not provided
  const isInCart = !!cartItem;

  const medicineImage = useMemo(() => {
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

  const shortDescription = useMemo(() => {
    if (!medicine.description) return "";
    return medicine.description.length > 150
      ? medicine.description.substring(0, 150) + "..."
      : medicine.description;
  }, [medicine.description]);

  const handleAddToCart = async () => {
    if (!storeOpen) return;

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

      // Redux
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

  return (
    <View
      style={[
        styles.card,
        isFirst && styles.cardFirst,
        isLast && styles.cardLast,
      ]}
    >
      {/* First Row: Left Image & Right Details */}
      <View style={styles.topSection}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={onPress}
          activeOpacity={0.9}
        >
          {medicineImage ? (
            <Image
              source={{ uri: medicineImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <AppIcon name="pill" size={30} color="#E5E7EB" />
            </View>
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.topRightContent}>
          {/* Badges / Favorite Row */}
          <View style={styles.badgesRow}>
            <View style={styles.badges}>
              {(medicine.isPrescriptionRequired ||
                medicine.prescriptionRequired) && (
                <View style={styles.prescriptionBadge}>
                  <AppIcon name="file-text" size={10} color="#EF4444" />
                </View>
              )}
              {medicine.isVeg && (
                <View style={[styles.badge, styles.vegBadge]}>
                  <View style={styles.vegDot} />
                </View>
              )}
            </View>

            {/* <TouchableOpacity style={styles.favoriteIcon}>
              <AppIcon name="heart" size={16} color={theme.textMuted} />
            </TouchableOpacity> */}
          </View>

          {/* Product Name */}
          <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Text style={styles.name} numberOfLines={2}>
              {medicine.name}
            </Text>

            {/* Manufacturer / Brand */}
            {medicine.brand && medicine.brand !== "Not Available" && (
              <Text style={styles.brand} numberOfLines={1}>
                by {medicine.brand}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Second Row: Description expanding to full length of the card */}
      {shortDescription ? (
        <View style={styles.descriptionSection}>
          <Text style={styles.description} numberOfLines={3}>
            {shortDescription}
          </Text>
        </View>
      ) : null}

      {/* Third Row: Price and Buttons */}
      <View style={styles.bottomSection}>
        <View style={styles.priceColumn}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            {originalPriceToShow && (
              <Text style={styles.originalPrice}>₹{originalPriceToShow}</Text>
            )}
          </View>
          {medicine.packSize && (
            <Text style={styles.packSize}>{medicine.packSize}</Text>
          )}
        </View>

        <View style={styles.actionContainer}>
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
              disabled={!storeOpen}
              size="medium"
            />
          ) : (
            <TouchableOpacity
              style={[styles.addButton, !storeOpen && styles.addButtonDisabled]}
              disabled={!storeOpen}
              activeOpacity={storeOpen ? 0.7 : 1}
              onPress={handleAddToCart}
            >
              <Text
                style={[styles.addText, !storeOpen && styles.addTextDisabled]}
              >
                {t('add_2')}
              </Text>
              <AppIcon
                name="plus"
                size={14}
                color={storeOpen ? "#16A34A" : "#9CA3AF"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Separator line */}
      {!isLast && <View style={styles.separator} />}
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: c.card,
    marginHorizontal: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: c.border,
  },
  cardFirst: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    marginTop: 0,
    paddingTop: 24,
  },
  cardLast: {
    borderBottomWidth: 1,
    borderColor: c.borderLight,
    paddingBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: c.cardSecondary,
    marginTop: 14,
    marginHorizontal: 4,
  },
  topSection: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  imageContainer: {
    width: 90,
    height: 90,
    position: "relative",
    backgroundColor: c.card,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.cardSecondary,
  },
  discountBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#16A34A",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  topRightContent: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  badges: {
    flexDirection: "row",
    gap: 4,
  },
  prescriptionBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.errorBg,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  vegBadge: {
    borderWidth: 1.5,
    borderColor: "#16A34A",
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  favoriteIcon: {
    padding: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
    marginBottom: 2,
    lineHeight: 20,
  },
  brand: {
    fontSize: 12,
    fontWeight: "500",
    color: c.textSecondary,
    marginBottom: 2,
  },
  descriptionSection: {
    marginTop: 10,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 18,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 6,
    borderTopWidth: 0,
    borderTopColor: c.borderLight,
    paddingBottom: 4,
    gap: 12,
  },
  priceColumn: {
    justifyContent: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
  },
  originalPrice: {
    fontSize: 13,
    color: c.textMuted,
    textDecorationLine: "line-through",
  },
  packSize: {
    fontSize: 11,
    color: c.textSecondary,
  },
  actionContainer: {
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: c.card,
    borderWidth: 1.5,
    borderColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: c.cardSecondary,
    borderColor: c.border,
    opacity: 0.6,
  },
  addText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },
  addTextDisabled: {
    color: c.textMuted,
  },
});
