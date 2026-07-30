import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import { RootState } from '../../../redux/store';

import { FeedAction } from '../feed/feed.actions';

type ServiceItem = {
  id: string;
  title: string;
  icon: string;
  enabled?: boolean;
  background: { start: string; end: string };
  accentColor: string;
  action: FeedAction;
};

interface Props {
  title: string;
  services: ServiceItem[];
  onAction: (action: FeedAction) => void;
}

function ServicesSection({ title, services, onAction }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const carts = useSelector((state: RootState) => state.cart);

  // Calculate cart count (number of stores with items) for pharmacy
  const pharmacyCartCount = useMemo(() => {
    const pharmacyCarts = Object.values(carts);
    // Count number of carts (stores) that have items
    return pharmacyCarts.filter((storeCart: any) =>
      Object.keys(storeCart.items).length > 0
    ).length;
  }, [carts]);

  const visibleServices = useMemo(() => {
    return services.filter(
      (item) => item.id !== 'ambulance' && item.id !== 'homecare'
    );
  }, [services]);

  const onPressService = useCallback(
    (item: ServiceItem) => {
      if (item.enabled === false) return;
      onAction(item.action);
    },
    [onAction]
  );

  const renderItem = ({ item }: { item: ServiceItem }) => {
    const isPharmacy =
      item.id === 'pharmacy' ||
      item.id === 'medicines' ||
      (item.action?.type === 'NAVIGATE' && (item.action.stack === 'PharmacyStack' || item.action.screen === 'PharmacyList'));

    const showCartBadge = isPharmacy && pharmacyCartCount > 0;

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={item.enabled ? 0.75 : 1}
        onPress={() => onPressService(item)}
      >
        <LinearGradient
          colors={[item.background.start, item.background.end]}
          style={[
            styles.iconContainer,
            !item.enabled && styles.disabledCard,
          ]}
        >
          <AppIcon
            name={item.icon as any}
            size={32}
            color={item.accentColor}
          />
          {showCartBadge && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText} numberOfLines={1}>
                {pharmacyCartCount > 99 ? '99+' : String(pharmacyCartCount)}
              </Text>
            </View>
          )}
        </LinearGradient>

        <Text
          style={[
            styles.label,
            !item.enabled && styles.disabledText,
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {!item.enabled && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Coming soon</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <FlatList
        data={visibleServices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

export default React.memo(ServicesSection);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
    overflow: 'visible',
  },
  title: {
    fontSize: 13,
    color: '#494949',
    marginBottom: 14,
    letterSpacing: 2,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 26,
  },
  item: {
    width: 76,
    alignItems: 'center',
    marginRight: 14,
    overflow: 'visible',
    paddingTop: 4,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'visible',
  },
  label: {
    fontSize: 13,
    color: '#151517',
    textAlign: 'center',
  },

  /* Disabled State */
  disabledCard: {
    opacity: 0.55,
  },
  disabledText: {
    color: '#9ca3af',
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
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
