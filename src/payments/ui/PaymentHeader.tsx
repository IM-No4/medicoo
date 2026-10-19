import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

export interface HeaderSummary {
  store: string;
  addressTitle?: string;
  addressLine?: string;
}

interface Props {
  /** Next to the back arrow, e.g. "Select payment options" - or just "Back". */
  title: string;
  /** Green line under the title, e.g. "2 items • Total: ₹654". */
  subtitle?: string;
  /** Pressing back. When missing the arrow is shown dimmed and does nothing (leaving would be unsafe). */
  onBack?: () => void;
  /** Store + delivery address strip. */
  summary?: HeaderSummary;
}

// The header of the payment steps (options list and the processing screen): a
// raised white card with rounded bottom corners that carries the order total
// and the store/address strip. Deliberately a little richer than the plain
// header the other screens use, since it summarises what is being paid for.
export default function PaymentHeader({ title, subtitle, onBack, summary }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
      <TouchableOpacity
        style={[styles.headerRow, !onBack && styles.dim]}
        onPress={onBack}
        disabled={!onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 40 }}
      >
        <View style={styles.backBtn}>
          <ChevronLeft size={22} color={theme.text} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </TouchableOpacity>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryStore} numberOfLines={1}>
              {summary.store}
            </Text>
          </View>
          <View style={styles.summaryConnector} />
          <View style={styles.summaryRow}>
            <MapPin size={14} color={theme.textSecondary} />
            <Text style={styles.summaryAddress} numberOfLines={1}>
              <Text style={styles.summaryAddressTitle}>{summary.addressTitle || 'Delivery address'}</Text>
              {summary.addressLine ? `  |  ${summary.addressLine}` : ''}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: {
      backgroundColor: c.card,
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
        android: { elevation: 3 },
      }),
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dim: { opacity: 0.45 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    titleCol: { flex: 1 },
    title: { fontSize: 17, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 12, fontWeight: '600', color: '#10B981', marginTop: 1 },
    summaryCard: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: c.cardSecondary },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    summaryDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#7C3AED', marginHorizontal: 2 },
    summaryConnector: { width: 2, height: 8, marginLeft: 6, marginVertical: 2, backgroundColor: c.border },
    summaryStore: { flex: 1, fontSize: 13, fontWeight: '700', color: c.text },
    summaryAddress: { flex: 1, fontSize: 12, color: c.textSecondary },
    summaryAddressTitle: { fontWeight: '700', color: c.text },
  });
