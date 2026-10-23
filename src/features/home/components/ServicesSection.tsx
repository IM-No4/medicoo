import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import { RootState } from '../../../redux/store';

import { FeedAction } from '../feed/feed.actions';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

type ServiceItem = {
  id: string;
  title: string;
  icon: string;
  enabled?: boolean;
  background: { start: string; end: string };
  accentColor: string;
  action: FeedAction;
};

import SectionHeader from '../feed/cards/SectionHeader';

interface Props {
  title: string;
  services: ServiceItem[];
  // Sent by the backend (homeController.js servicesGridColumns) so the admin
  // preview and the app lay the grid out identically.
  layout?: { columns: number };
  onAction: (action: FeedAction) => void;
}

const H_PADDING = 24;
const GAP = 12;

function ServicesSection({ title, services, layout, onAction }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const carts = useSelector((state: RootState) => state.cart);
  const { width } = useWindowDimensions();

  // Dynamic grid: columns follow how many services are enabled
  // (1 wide card, 2 cards, 3 tiles, 4+ in a four-column grid that wraps).
  const columns = Math.min(4, Math.max(1, layout?.columns ?? services.length));
  const cardMode = columns <= 2;
  const tileWidth = Math.floor((width - H_PADDING * 2 - GAP * (columns - 1)) / columns);

  // Calculate cart count (number of stores with items) for pharmacy
  const pharmacyCartCount = useMemo(() => {
    const pharmacyCarts = Object.values(carts);
    // Count number of carts (stores) that have items
    return pharmacyCarts.filter((storeCart: any) =>
      Object.keys(storeCart.items).length > 0
    ).length;
  }, [carts]);

  const onPressService = useCallback(
    (item: ServiceItem) => {
      if (item.enabled === false) return;
      onAction(item.action);
    },
    [onAction]
  );

  const isPharmacyItem = (item: ServiceItem) =>
    item.id === 'pharmacy' ||
    item.id === 'medicines' ||
    (item.action?.type === 'NAVIGATE' && (item.action.stack === 'PharmacyStack' || item.action.screen === 'PharmacyList'));

  const renderItem = (item: ServiceItem) => {
    const showCartBadge = isPharmacyItem(item) && pharmacyCartCount > 0;
    const disabled = item.enabled === false;

    const badge = showCartBadge ? (
      <View style={styles.cartBadge}>
        <Text style={styles.cartBadgeText} numberOfLines={1}>
          {pharmacyCartCount > 99 ? '99+' : String(pharmacyCartCount)}
        </Text>
      </View>
    ) : null;

    // 1-2 services: roomy cards filled with the service's own gradient. Icon in a soft white tile, label and arrow lined up on
    // the same row (one service) or along the bottom (two across).
    if (cardMode) {
      const wide = columns === 1;
      const icon = (
        <View style={styles.cardIcon}>
          <AppIcon name={item.icon as any} size={26} color={item.accentColor} />
          {badge}
        </View>
      );
      const label = (
        <View style={styles.cardText}>
          <Text style={styles.cardLabel} numberOfLines={2}>{item.title}</Text>
          {disabled && <Text style={styles.cardSub}>{t('coming_soon')}</Text>}
        </View>
      );
      const arrow = (
        <View style={styles.cardArrow}>
          <AppIcon name="arrow-right" size={14} color="#0F172A" />
        </View>
      );
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.card, wide ? styles.cardWide : styles.cardHalf, { width: tileWidth }, disabled && styles.disabledCard]}
          activeOpacity={disabled ? 1 : 0.8}
          onPress={() => onPressService(item)}
        >
          <LinearGradient
            colors={[item.background.start, item.background.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {wide ? (
            <>
              {icon}
              {label}
              {arrow}
            </>
          ) : (
            <>
              {icon}
              <View style={styles.cardBottomRow}>
                {label}
                {arrow}
              </View>
            </>
          )}
        </TouchableOpacity>
      );
    }

    // 3-4 services: compact icon tiles.
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.item, { width: tileWidth }]}
        activeOpacity={disabled ? 1 : 0.75}
        onPress={() => onPressService(item)}
      >
        <LinearGradient
          colors={[item.background.start, item.background.end]}
          style={[styles.iconContainer, { width: tileWidth, height: tileWidth }, disabled && styles.disabledCard]}
        >
          <AppIcon name={item.icon as any} size={Math.round(tileWidth * 0.42)} color={item.accentColor} />
          {badge}
        </LinearGradient>

        <Text style={[styles.label, disabled && styles.disabledText]} numberOfLines={2}>
          {item.title}
        </Text>

        {disabled && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('coming_soon')}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SectionHeader title={title} />
      <View style={styles.grid}>{services.map(renderItem)}</View>
    </View>
  );
}

export default React.memo(ServicesSection);

/* ================= STYLES ================= */

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 30,
    overflow: 'visible',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: H_PADDING,
    columnGap: GAP,
    rowGap: GAP + 4,
    overflow: 'visible',
  },
  card: {
    // filled with the service's gradient (an absolutely placed LinearGradient is the first child)
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
  },
  // two across: icon on top, label and arrow along the bottom
  cardHalf: {
    minHeight: 124,
    justifyContent: 'space-between',
  },
  // one service: a single row, everything centred vertically
  cardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 84,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  cardText: {
    flex: 1,
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  cardArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    alignItems: 'center',
    overflow: 'visible',
    paddingTop: 4,
  },
  iconContainer: {
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'visible',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: c.text,
    textAlign: 'center',
  },

  /* Disabled State */
  disabledCard: {
    opacity: 0.55,
  },
  disabledText: {
    color: c.textMuted,
  },

  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: c.cardSecondary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: c.textSecondary,
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
    borderColor: c.card,
    zIndex: 10,
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
