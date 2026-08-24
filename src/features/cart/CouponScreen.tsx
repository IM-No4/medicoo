import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Ticket } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CouponScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [promoCode, setPromoCode] = useState('');

  const coupons = [
    {
      code: 'MED30',
      description: 'Get 30% OFF on medicine orders',
      detail: 'Valid on orders above ₹199. Maximum discount up to ₹150.',
      type: 'percentage',
      value: 30,
      maxValue: 150,
      minOrder: 199,
    },
    {
      code: 'WELCOME50',
      description: 'Flat ₹50 OFF on your first order',
      detail: 'Valid on your very first medicine purchase.',
      type: 'flat',
      value: 50,
      minOrder: 0,
    },
    {
      code: 'FREESHIP',
      description: 'Free Delivery on orders above ₹299',
      detail: 'Saves ₹40 delivery fee on your order.',
      type: 'delivery',
      value: 40,
      minOrder: 299,
    },
  ];

  const handleApplyCoupon = (coupon: any) => {
    navigation.navigate('CartScreen', { appliedCoupon: coupon });
  };

  const handleCustomPromoApply = () => {
    const uppercaseCode = promoCode.trim().toUpperCase();
    const matched = coupons.find(c => c.code === uppercaseCode);
    if (matched) {
      handleApplyCoupon(matched);
    } else {
      alert('Invalid Promo Code');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply Coupon</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        {coupons.map((coupon) => (
          <View key={coupon.code} style={styles.couponCard}>
            <View style={styles.couponHeader}>
              <View style={styles.badgeWrapper}>
                <Ticket size={16} color="#007C69" />
                <Text style={styles.couponCodeText}>{coupon.code}</Text>
              </View>
              <TouchableOpacity
                style={styles.applyLinkBtn}
                onPress={() => handleApplyCoupon(coupon)}
              >
                <Text style={styles.applyLinkText}>Apply</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.couponDesc}>{coupon.description}</Text>
            <Text style={styles.couponDetail}>{coupon.detail}</Text>
          </View>
        ))}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
});
