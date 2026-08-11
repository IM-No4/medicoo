import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import { RootState } from '../../../redux/store';
import { FeedAction } from '../feed/feed.actions';

export interface QuickActionItem {
  id: string;
  title: string;
  icon: string;
  action: FeedAction;
  background: {
    start: string;
    end: string;
  };
  accentColor: string;
}

interface Props {
  items: QuickActionItem[];
  onAction: (action: FeedAction) => void;
}

function QuickActions({ items, onAction }: Props) {
  const carts = useSelector((state: RootState) => state.cart);

  // Calculate cart count (number of stores with items) for medicines
  const medicineCartCount = useMemo(() => {
    const pharmacyCarts = Object.values(carts);
    // Count number of carts (stores) that have items
    return pharmacyCarts.filter((storeCart: any) =>
      Object.keys(storeCart.items).length > 0
    ).length;
  }, [carts]);

  const renderItem = ({ item }: { item: QuickActionItem }) => {
    const isPharmacy =
      item.id === 'medicines' ||
      item.id === 'pharmacy' ||
      (item.action?.type === 'NAVIGATE' && (item.action.stack === 'PharmacyStack' || item.action.screen === 'PharmacyList'));

    const showCartBadge = isPharmacy && medicineCartCount > 0;

    return (
      <TouchableOpacity
        style={styles.action}
        activeOpacity={0.85}
        onPress={() => onAction(item.action)}
      >
        <LinearGradient
          colors={[item.background.start, item.background.end]}
          style={styles.iconWrap}
        >
          <AppIcon
            name={item.icon as any}
            size={32}
            color={item.accentColor}
          />
          {showCartBadge && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText} numberOfLines={1}>
                {medicineCartCount > 99 ? '99+' : String(medicineCartCount)}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text style={styles.label} numberOfLines={2}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  // A fixed-width, left-aligned, horizontally-scrolling row (same pattern as
  // ServicesSection) - the item count is no longer a hardcoded 4, so a
  // space-between grid sized for exactly 4 columns would shove 2 items to
  // opposite edges of the screen, or overflow badly past 4.
  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      style={styles.row}
    />
  );
}

export default React.memo(QuickActions);

const styles = StyleSheet.create({
  row: {
    marginBottom: 28,
    overflow: 'visible',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  action: {
    alignItems: 'center',
    width: 76,
    marginRight: 18,
    overflow: 'visible',
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'visible',
  },
  label: {
    fontSize: 13,
    color: '#151517',
    opacity: 0.7,
    textAlign: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
