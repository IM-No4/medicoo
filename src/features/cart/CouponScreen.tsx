import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Ticket } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiCoupon, getStoreCoupons } from '@/src/services/api/cart.api';

// The shape CartScreen's own discount math already expects (type:
// percentage/flat/delivery) - kept as-is rather than reworking that logic,
// so fetching real coupons here is just a different source for the same
// shape the hardcoded list used to produce.
type DisplayCoupon = {
  code: string;
  description: string;
  detail: string;
  type: 'percentage' | 'flat' | 'delivery';
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
  const type = c.discountType === 'free_shipping' ? 'delivery' : (c.discountType as 'percentage' | 'flat');
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
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');
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
    const matched = coupons.find(c => c.code === uppercaseCode);
    if (!matched) {
      alert('Invalid Promo Code');
      return;
    }
    if (!matched.eligible) {
      alert(`Add ₹${matched.shortfall} more to your cart to use this coupon.`);
      return;
    }
    handleApplyCoupon(matched);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Coupon</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Custom Code Input */}
        <View style={styles.promoInputWrapper}>
          <TextInput
            style={styles.promoInput}
            placeholder="Enter promo code"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            value={promoCode}
            onChangeText={setPromoCode}
          />
          <TouchableOpacity style={styles.promoApplyBtn} onPress={handleCustomPromoApply}>
            <Text style={styles.promoApplyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Available Offers</Text>

        {loading ? (
          <ActivityIndicator color="#007C69" style={{ marginTop: 12 }} />
        ) : coupons.length === 0 ? (
          <Text style={styles.emptyText}>No offers available right now - check back soon.</Text>
        ) : (
          coupons.map((coupon) => (
            <View key={coupon.code} style={[styles.couponCard, !coupon.eligible && styles.couponCardIneligible]}>
              <View style={styles.couponHeader}>
                <View style={[styles.badgeWrapper, !coupon.eligible && styles.badgeWrapperIneligible]}>
                  <Ticket size={16} color={coupon.eligible ? '#007C69' : '#9CA3AF'} />
                  <Text style={[styles.couponCodeText, !coupon.eligible && styles.couponCodeTextIneligible]}>
                    {coupon.code}
                  </Text>
                </View>
                {coupon.eligible ? (
                  <TouchableOpacity
                    style={styles.applyLinkBtn}
                    onPress={() => handleApplyCoupon(coupon)}
                  >
                    <Text style={styles.applyLinkText}>Apply</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.shortfallText}>Add ₹{coupon.shortfall} more</Text>
                )}
              </View>
              <Text style={[styles.couponDesc, !coupon.eligible && styles.couponDescIneligible]}>
                {coupon.description}
              </Text>
              <Text style={styles.couponDetail}>{coupon.detail}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
  },
  promoInputWrapper: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  promoInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  promoApplyBtn: {
    backgroundColor: '#007C69',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  couponCodeText: {
    color: '#007C69',
    fontWeight: '800',
    fontSize: 13,
  },
  applyLinkBtn: {
    padding: 4,
  },
  applyLinkText: {
    color: '#007C69',
    fontWeight: '700',
    fontSize: 14,
  },
  couponDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  couponDetail: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  // Not-yet-eligible coupons (minOrderValue not met by this cart) stay
  // visible but visually muted, rather than either fully hiding them or
  // letting them look identical to ones the user can tap right now.
  couponCardIneligible: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F3F4F6',
  },
  badgeWrapperIneligible: {
    backgroundColor: '#F3F4F6',
  },
  couponCodeTextIneligible: {
    color: '#9CA3AF',
  },
  couponDescIneligible: {
    color: '#6B7280',
  },
  shortfallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
