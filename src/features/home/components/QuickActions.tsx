import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const isPharmacy =
          item.id === 'medicines' ||
          item.id === 'pharmacy' ||
          (item.action?.type === 'NAVIGATE' && (item.action.stack === 'PharmacyStack' || item.action.screen === 'PharmacyList'));

        const showCartBadge = isPharmacy && medicineCartCount > 0;

        return (
          <TouchableOpacity
            key={item.id}
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

            <Text style={styles.label}>{item.title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default React.memo(QuickActions);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 28,
    overflow: 'visible',
  },
  action: {
    alignItems: 'center',
    width: '24%',
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
