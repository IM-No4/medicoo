import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import { StoreCart } from '@/src/redux/slices/cart.types';
import { RootState } from '@/src/redux/store';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_PADDING = 20;
const CARD_SPACING = 12;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_PADDING * 2);

export default function MultiStoreCartBar() {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [activeIndex, setActiveIndex] = useState(0);

  const carts = useSelector((state: RootState) => state.cart);

  const storeCarts = useMemo<StoreCart[]>(() => {
    return Object.values(carts).filter(
      (cart) => Object.keys(cart.items).length > 0
    );
  }, [carts]);

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

  const onMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_SPACING));
    if (index !== activeIndex && index >= 0 && index < storeCarts.length) {
      setActiveIndex(index);
    }
  };

  if (storeCarts.length === 0) return null;

  return (
    <View
      style={[
        styles.wrapper,
        { 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
        },
      ]}
    >
      <FlatList
        ref={listRef}
        data={storeCarts}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item, index) => item.storeId ? `${item.storeId}-${index}` : `cart-${index}`}
        contentContainerStyle={styles.listContent}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_SPACING,
          offset: (CARD_WIDTH + CARD_SPACING) * index,
          index,
        })}
        renderItem={({ item: cart }) => {
          const itemCount: number = Object.keys(cart.items).length;

          return (
            <View style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.leftSection}>
                    <View style={styles.storeBadge}>
                      <AppIcon name="store" size={22} color="#64748B" />
                    </View>

                    <View style={styles.storeInfo}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          executeAction('OPEN_PHARMACY', {
                            pharmacyId: cart.storeId,
                          })
                        }
                      >
                        <Text style={styles.storeName} numberOfLines={1}>
                          {cart.storeName}
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.itemCountWrapper}>
                        {/* <AppIcon name="shopping-bag" size={14} color="#64748B" /> */}
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
                    onPress={() =>
                      executeAction('OPEN_CART', {
                        storeId: cart.storeId,
                      })
                    }
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
        }}
      />

      {storeCarts.length > 1 && (
        <View style={styles.dots}>
          {storeCarts.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  listContent: {
    paddingHorizontal: CARD_PADDING,
    paddingTop: 4,
  },
  cardWrapper: {
    paddingRight: CARD_SPACING,
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
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  itemCountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    backgroundColor: '#10B981',
    width: 22,
  },
});