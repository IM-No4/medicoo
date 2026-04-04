import AppIcon from '@/src/components/icons/AppIcon';
import QuantityControl from './QuantityControl';
import { RootState } from '@/src/redux/store';
import { addItemToCart } from '@/src/services/api/cart.api';
import { addItemLocal } from '@/src/redux/slices/cartSlice';
import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

interface Props {
  medicine: any;
  isStoreOpen?: boolean;
  storeId: string;
  storeName: string;
  onPress?: () => void;
}

export default function MedicineRow({ 
  medicine, 
  isStoreOpen, 
  storeId,
  storeName,
  onPress,
}: Props) {
  const dispatch = useDispatch();
  const carts = useSelector((state: RootState) => state.cart);
  const storeCart = carts[storeId];
  
  const cartItem = useMemo(() => {
    if (!storeCart) return null;
    const sku = medicine.sku || medicine.inventoryId || medicine.medicineId;
    return storeCart.items[String(sku)] || null;
  }, [storeCart, medicine]);

  const rawPrice = medicine.discountPrice > 0 ? medicine.discountPrice : medicine.price;
  const price = rawPrice ?? 0;
  const originalPrice = medicine.discountPrice > 0 ? (medicine.price ?? null) : null;
  const discount = originalPrice && originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const rating = medicine.rating || 4.8;
  const ratingCount = medicine.ratingCount || 36;
  const storeOpen = isStoreOpen ?? true; // Default to open if not provided
  const isInCart = !!cartItem;

  const handleAddToCart = async () => {
    if (!storeOpen) return;
    
    try {
      const sku = medicine.sku || medicine.inventoryId || medicine.medicineId || medicine._id || medicine.id;
      const cartItem = {
        medicineId: medicine.medicineId || medicine._id || medicine.id,
        sku: sku,
        name: medicine.name,
        price: medicine.price ?? 0,
        discountPrice: medicine.discountPrice ?? medicine.price ?? 0,
        quantity: 1,
        brand: medicine.brand || medicine.manufacturer,
        composition: medicine.composition,
        prescriptionRequired: (medicine.isPrescriptionRequired || medicine.prescriptionRequired) ?? false,
        image: medicine.imageUrl || medicine.images?.[0] || null,
        batchId: Array.isArray(medicine.batchNum)
          ? String(medicine.batchNum[0] ?? '')
          : String(medicine.batchNum ?? ''),
        expiryDate: Array.isArray(medicine.expiryDate)
          ? medicine.expiryDate[0] ?? null
          : medicine.expiryDate ?? null,
      };

      // Backend expects productId in the item argument
      await addItemToCart(storeId, storeName, {
        ...cartItem,
        productId: cartItem.medicineId
      });

      // Redux
      dispatch(
        addItemLocal({
          storeId,
          storeName,
          item: cartItem,
        })
      );
    } catch (e) {
      console.error('Failed to add item to cart', e);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.imageContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {medicine.imageUrl ? (
          <Image 
            source={{ uri: medicine.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <AppIcon name="pill" size={40} color="#E5E7EB" />
          </View>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.badges}>
            {(medicine.isPrescriptionRequired || medicine.prescriptionRequired) && (
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

          <TouchableOpacity style={styles.favoriteIcon}>
            <AppIcon name="heart" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          <Text style={styles.name} numberOfLines={2}>
            {medicine.name}
          </Text>
        </TouchableOpacity>

        {medicine.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            by {medicine.brand}
          </Text>
        )}

        {medicine.description && (
          <Text style={styles.description} numberOfLines={1}>
            {medicine.description}
          </Text>
        )}

        <View style={styles.ratingRow}>
          <AppIcon name="star" size={12} color="#16A34A" />
          <Text style={styles.rating}>{rating}</Text>
          <Text style={styles.ratingCount}>({ratingCount})</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.priceColumn}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{price}</Text>
              {originalPrice && (
                <Text style={styles.originalPrice}>₹{originalPrice}</Text>
              )}
            </View>
            {medicine.packSize && (
              <Text style={styles.packSize}>{medicine.packSize}</Text>
            )}
          </View>

          {isInCart ? (
            <QuantityControl
              storeId={storeId}
              sku={String(medicine.sku || medicine.inventoryId || medicine.medicineId || medicine._id || medicine.id)}
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
              <Text style={[styles.addText, !storeOpen && styles.addTextDisabled]}>ADD</Text>
              <AppIcon name="plus" size={14} color={storeOpen ? "#16A34A" : "#9CA3AF"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageContainer: {
    width: 120,
    height: 140,
    position: 'relative',
    backgroundColor: '#F9FAFB',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  prescriptionBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  vegBadge: {
    borderWidth: 1.5,
    borderColor: '#16A34A',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  favoriteIcon: {
    padding: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  brand: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  description: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 2,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  priceColumn: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  originalPrice: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  packSize: {
    fontSize: 11,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  addTextDisabled: {
    color: '#9CA3AF',
  },
});