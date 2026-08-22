import AppIcon from '@/src/components/icons/AppIcon';
import { RootState } from '@/src/redux/store';
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

type Props = {
  onPress: (storeId: string) => void;
};

export default function StickyCartBar({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  /** 🔹 Entire cart state (Record<storeId, StoreCart>) */
  const carts = useSelector((state: RootState) => state.cart);

  /** 🔹 Pick ONE active cart */
  const activeCart = useMemo(() => {
    const storeIds = Object.keys(carts);
    if (storeIds.length === 0) return null;

    const storeId = storeIds[0];
    return carts[storeId] ?? null;
  }, [carts]);

  /** 🔹 Convert items map → array */
  const itemList = useMemo(() => {
    if (!activeCart) return [];
    return Object.values(activeCart.items);
  }, [activeCart]);

  /** 🔹 Compute item count */
  const itemCount = useMemo(() => {
    return itemList.length;
  }, [itemList]);

  if (!activeCart) return null;

  const { storeId, storeName } = activeCart;

  if (itemList.length === 0) return null;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <View style={styles.storeBadge}>
              <AppIcon name="shopping-bag" size={22} color="#64748B" />
            </View>

            <View style={styles.storeInfo}>
              <View style={styles.itemCountWrapper}>
                <Text style={styles.itemCount}>
                  {String(itemCount)} item{itemCount !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewCartBtn}
            activeOpacity={0.8}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => onPress(storeId)}
          >
            <Animated.View
              style={[
                styles.viewCartBtnInner,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <Text style={styles.viewCartText}>View Cart</Text>
              <AppIcon name="chevron-right" size={16} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  storeBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  viewCartBtn: {
    borderRadius: 10,
  },
  viewCartBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 18,
    paddingRight: 12,
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  viewCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});