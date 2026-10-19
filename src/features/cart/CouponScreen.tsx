import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Info, Ticket } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiCoupon, getStoreCoupons } from '@/src/services/api/cart.api';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import { AdaptiveStatusBar } from '../../components/ThemedStatusBar';

// The shape CartScreen's own discount math already expects (type:
// percentage/flat/delivery) - kept as-is rather than reworking that logic,
// so fetching real coupons here is just a different source for the same
// shape the hardcoded list used to produce.
type DisplayCoupon = {
  code: string;
  description: string;
  detail: string;
  type: 'percentage' | 'flat' | 'delivery' | 'fixed_total';
  value: number;
  maxValue?: number;
  minOrder: number;
  // From the backend's own eligibility check against this cart's real
  // subtotal (see cart.api.ts's ApiCoupon) - a coupon that's globally or
  // per-user exhausted never reaches here at all; this is specifically
  // "you just need to add a bit more to your cart" territory.
  eligible: boolean;
  shortfall: number;
};

function toDisplayCoupon(c: ApiCoupon): DisplayCoupon {
  const type = c.discountType === 'free_shipping' ? 'delivery' : (c.discountType as 'percentage' | 'flat' | 'fixed_total');
  const minOrder = c.minOrderValue ?? 0;
  const detailParts: string[] = [];
  // Leads with the actionable "add ₹X more" nudge when that's the only
  // thing standing between this cart and the coupon, rather than the
  // generic "valid on orders above ₹Y" phrasing that reads the same
  // whether it's already met or not.
  if (!c.eligible && c.shortfall > 0) {
    detailParts.push(`Add ₹${c.shortfall} more to your cart to unlock this offer.`);
  } else if (minOrder > 0) {
    detailParts.push(`Valid on orders above ₹${minOrder}.`);
  }
  if (type === 'percentage' && c.maxDiscount) detailParts.push(`Maximum discount up to ₹${c.maxDiscount}.`);
  if (type === 'delivery') detailParts.push(`Saves ₹${c.discountValue} delivery fee on your order.`);

  return {
    code: c.code,
    description: c.description || (
      type === 'percentage' ? `Get ${c.discountValue}% OFF on medicine orders`
        : type === 'delivery' ? 'Free Delivery on your order'
          : type === 'fixed_total' ? `Pay just ₹${c.discountValue} on your order`
          : `Flat ₹${c.discountValue} OFF on your order`
    ),
    detail: detailParts.join(' ') || 'Applicable on eligible orders.',
    type,
    value: c.discountValue,
    maxValue: c.maxDiscount,
    minOrder,
    eligible: c.eligible,
    shortfall: c.shortfall,
  };
}

export default function CouponScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [coupons, setCoupons] = useState<DisplayCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const cartAmount = route.params?.amount;

  useEffect(() => {
    let cancelled = false;
    getStoreCoupons(cartAmount)
      .then(data => {
        if (cancelled) return;
        // free_subscription coupons don't apply to a medicine order at all
        // (the cart has no concept of them) - the backend already filters
        // to type:'medicine', this is just a defensive belt-and-suspenders
        // in case a medicine coupon is ever misconfigured with that value.
        setCoupons(data.filter(c => c.discountType !== 'free_subscription').map(toDisplayCoupon));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cartAmount]);

  const handleApplyCoupon = (coupon: DisplayCoupon) => {
    navigation.navigate('CartScreen', { appliedCoupon: coupon });
  };

  const handleCustomPromoApply = () => {
    const uppercaseCode = promoCode.trim().toUpperCase();
    if (!uppercaseCode) {
      setPromoMessage('Enter a promo code first.');
      return;
    }
    const matched = coupons.find(c => c.code === uppercaseCode);
    if (!matched) {
      setPromoMessage("That code isn't valid for this order. Check it and try again.");
      return;
    }
    if (!matched.eligible) {
      setPromoMessage(`Add ₹${matched.shortfall} more to your cart to use this coupon.`);
      return;
    }
    setPromoMessage('');
    handleApplyCoupon(matched);
  };

  return (
    <View style={styles.container}>
      <AdaptiveStatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coupons</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Promo code */}
        <Text style={styles.sectionTitle}>Have a promo code?</Text>
        <View style={styles.card}>
          <View style={styles.promoRow}>
            <TextInput
              style={styles.promoInput}
              placeholder={t('enter_promo')}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              value={promoCode}
              onChangeText={(v) => {
                setPromoCode(v);
                if (promoMessage) setPromoMessage('');
              }}
              onSubmitEditing={handleCustomPromoApply}
            />
            <TouchableOpacity
              style={[styles.applyBtn, !promoCode.trim() && styles.applyBtnDisabled]}
              onPress={handleCustomPromoApply}
              disabled={!promoCode.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.applyBtnText}>{t('apply').toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
          {!!promoMessage && (
            <View style={styles.promoNotice}>
              <Info size={14} color={theme.textSecondary} />
              <Text style={styles.promoNoticeText}>{promoMessage}</Text>
            </View>
          )}
        </View>

        {/* Offers */}
        <Text style={styles.sectionTitle}>{t('available_offers')}</Text>

        {loading ? (
          <ActivityIndicator color="#10B981" style={{ marginTop: 16 }} />
        ) : coupons.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <View style={styles.emptyIcon}>
              <Ticket size={22} color={theme.textMuted} />
            </View>
            <Text style={styles.emptyText}>{t('no_offers')}</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {coupons.map((coupon, index) => (
              <View key={coupon.code} style={[styles.offer, index < coupons.length - 1 && styles.offerDivider]}>
                <View style={styles.offerTop}>
                  <View style={[styles.codeChip, !coupon.eligible && styles.codeChipMuted]}>
                    <Ticket size={14} color={coupon.eligible ? '#10B981' : theme.textMuted} />
                    <Text style={[styles.codeText, !coupon.eligible && styles.codeTextMuted]}>{coupon.code}</Text>
                  </View>
                  {coupon.eligible ? (
                    <TouchableOpacity style={styles.offerApply} onPress={() => handleApplyCoupon(coupon)} activeOpacity={0.85}>
                      <Text style={styles.offerApplyText}>{t('apply').toUpperCase()}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.shortfallText}>Add ₹{coupon.shortfall} more</Text>
                  )}
                </View>
                <Text style={[styles.offerTitle, !coupon.eligible && styles.offerTitleMuted]}>{coupon.description}</Text>
                <Text style={styles.offerDetail}>{coupon.detail}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  scrollContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.borderLight, overflow: 'hidden' },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  promoInput: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.inputBorder,
    backgroundColor: c.inputBg,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
  applyBtn: { height: 46, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  applyBtnDisabled: { opacity: 0.4 },
  applyBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  promoNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 12, marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: c.cardSecondary },
  promoNoticeText: { flex: 1, fontSize: 12.5, fontWeight: '500', color: c.textSecondary, lineHeight: 18 },
  offer: { padding: 14 },
  offerDivider: { borderBottomWidth: 1, borderBottomColor: c.borderLight },
  offerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#10B981',
    backgroundColor: c.successBg,
  },
  codeChipMuted: { borderColor: c.border, backgroundColor: c.cardSecondary },
  codeText: { fontSize: 13, fontWeight: '800', color: '#10B981', letterSpacing: 0.4 },
  codeTextMuted: { color: c.textMuted },
  offerApply: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#10B981' },
  offerApplyText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  shortfallText: { fontSize: 12, fontWeight: '700', color: c.warning },
  offerTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 4 },
  offerTitleMuted: { color: c.textSecondary },
  offerDetail: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
  emptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, gap: 10 },
  emptyIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.cardSecondary, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13.5, color: c.textSecondary, textAlign: 'center' },
});
