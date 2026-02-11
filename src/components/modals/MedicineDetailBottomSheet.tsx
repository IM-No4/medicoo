import AppIcon from '@/src/components/icons/AppIcon';
import QuantityControl from '@/src/features/pharmacy/components/QuantityControl';
import { RootState } from '@/src/redux/store';
import { addItemToCart } from '@/src/services/api/cart.api';
import { addItemLocal } from '@/src/redux/slices/cartSlice';
import React, { useMemo } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  const cartItem = useMemo(() => {
    if (!storeCart || !medicine) return null;
    const sku = medicine.sku || medicine.inventoryId || medicine.medicineId;
    return storeCart.items[String(sku)] || null;
  }, [storeCart, medicine]);

  const price = medicine?.discountPrice > 0 ? medicine.discountPrice : medicine?.price;
  const originalPrice = medicine?.discountPrice > 0 ? medicine.price : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const isInCart = !!cartItem;

  const handleAddToCart = async () => {
    if (!isStoreOpen || !medicine) return;
    
    try {
      const sku = medicine.sku || medicine.inventoryId || medicine.medicineId;
      const cartItem = {
        productId: medicine.medicineId || medicine.id,
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

      await addItemToCart(storeId, cartItem);

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
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Medicine Image */}
            <View style={styles.imageContainer}>
              {medicine.imageUrl ? (
                <Image
                  source={{ uri: medicine.imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <AppIcon name="pill" size={80} color="#E5E7EB" />
                </View>
              )}
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
              )}
            </View>

            {/* Medicine Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{medicine.name}</Text>
              
              {medicine.brand && (
                <Text style={styles.brand}>by {medicine.brand}</Text>
              )}

              <View style={styles.priceRow}>
                <Text style={styles.price}>₹{price}</Text>
                {originalPrice && (
                  <Text style={styles.originalPrice}>₹{originalPrice}</Text>
                )}
              </View>

              {medicine.composition && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Composition</Text>
                  <Text style={styles.sectionContent}>{medicine.composition}</Text>
                </View>
              )}

              {medicine.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionContent}>{medicine.description}</Text>
                </View>
              )}

              {medicine.packSize && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pack Size</Text>
                  <Text style={styles.sectionContent}>{medicine.packSize}</Text>
                </View>
              )}

              {(medicine.isPrescriptionRequired || medicine.prescriptionRequired) && (
                <View style={styles.prescriptionWarning}>
                  <AppIcon name="file-text" size={20} color="#EF4444" />
                  <Text style={styles.prescriptionText}>Prescription Required</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Bar */}
          <View style={styles.actionBar}>
            {isInCart ? (
              <QuantityControl
                storeId={storeId}
                sku={String(medicine.sku || medicine.inventoryId || medicine.medicineId)}
                quantity={cartItem.quantity}
                disabled={!isStoreOpen}
                size="large"
              />
            ) : (
              <TouchableOpacity
                style={[styles.addButton, !isStoreOpen && styles.addButtonDisabled]}
                disabled={!isStoreOpen}
                onPress={handleAddToCart}
                activeOpacity={0.7}
              >
                <Text style={[styles.addButtonText, !isStoreOpen && styles.addButtonTextDisabled]}>
                  ADD TO CART
                </Text>
                <AppIcon name="plus" size={18} color={isStoreOpen ? "#FFFFFF" : "#9CA3AF"} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoContainer: {
    paddingBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  brand: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  originalPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  prescriptionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  prescriptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  addButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addButtonTextDisabled: {
    color: '#9CA3AF',
  },
});
