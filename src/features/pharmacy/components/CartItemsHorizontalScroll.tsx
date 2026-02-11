import AppIcon from '@/src/components/icons/AppIcon';
import QuantityControl from './QuantityControl';
import { RootState } from '@/src/redux/store';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { CartItem } from '@/src/redux/slices/cart.types';
import { executeAction } from '@/src/actions/ActionExecutor';

interface Props {
  storeId: string;
  onItemPress?: (item: CartItem) => void;
}

export default function CartItemsHorizontalScroll({ storeId, onItemPress }: Props) {
  const carts = useSelector((state: RootState) => state.cart);
  const storeCart = carts[storeId];

  if (!storeCart || Object.keys(storeCart.items).length === 0) {
    return null;
  }

  const cartItems = Object.values(storeCart.items);

  const handleItemPress = (item: CartItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      // Default: open cart
      executeAction('OPEN_CART', { storeID: storeId });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Items in Cart</Text>
        <Text style={styles.count}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {cartItems.map((item) => (
          <View key={String(item.sku)} style={styles.itemCard}>
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              activeOpacity={0.7}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <AppIcon name="pill" size={24} color="#E5E7EB" />
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  ₹{((item.discountPrice || item.price) * item.quantity).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.quantityControlContainer}>
              <QuantityControl
                storeId={storeId}
                sku={item.sku}
                quantity={item.quantity}
                size="small"
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  count: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  scrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  itemCard: {
    width: 140,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  itemImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
  },
  placeholderImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    gap: 4,
    marginBottom: 4,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E7439',
  },
  quantityControlContainer: {
    alignItems: 'center',
  },
});
