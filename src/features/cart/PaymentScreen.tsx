import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Coins,
  AlertCircle,
} from 'lucide-react-native';
import { RootState } from '../../redux/store';
import { StatusBar } from 'expo-status-bar';

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// Purely the "pick a payment method" screen - everything that actually
// moves money or touches stock (the store/inventory hold, the Razorpay
// order, the checkout itself, placing the order) lives on
// VerifyingOrderScreen.tsx now, reached from the Pay button below. Keeping
// this screen lean means tapping Pay always lands on a real "here's what's
// happening" screen instead of a spinner modal sitting on top of the
// method picker.
export default function PaymentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    storeId,
    amount,
    deliveryFee = amount > 500 ? 0 : 40,
    subtotal = amount - (amount > 500 ? 0 : 40) - (amount * 0.18),
    taxes = amount * 0.18,
    couponDiscount = 0,
    platformFee = 5,
    otherCharges = 2,
    prescriptionMode,
    prescriptionDocumentId,
    prescriptionId,
    prescriptionRequired = false,
  } = route.params || { storeId: '', amount: 0 };
  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  const pharmacyName = useMemo(() => {
    return carts[storeId]?.storeName || 'Pharmacy';
  }, [carts, storeId]);

  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cod'>('online');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Backend still rejects a submitted order either way (maintenanceGate.js
  // on /order/validate-checkout and /order/place-order) - this just avoids
  // letting someone pick a payment method first only to hit an error.
  const maintenance = useSelector((state: RootState) => state.appConfig.maintenance);
  const isCheckoutPaused = Boolean(maintenance?.enabled || maintenance?.services?.pharmacy === 'maintenance');

  const handlePay = () => {
    if (isCheckoutPaused) {
      setPaymentError(maintenance?.message || "We're performing scheduled maintenance. Please try again shortly.");
      return;
    }
    setPaymentError(null);

    // Defense in depth: CartScreen already blocks getting here without a
    // selected address, but this screen shouldn't trust that and hand off
    // to VerifyingOrderScreen with deliveryAddress: null if it's ever
    // reached another way (deep link, back-forward navigation, etc).
    if (!selectedAddress) {
      setPaymentError('Please select a delivery address before paying.');
      navigation.navigate('AddressBookModal');
      return;
    }

    if (prescriptionRequired && !prescriptionMode) {
      setPaymentError('Please add a prescription before paying.');
      navigation.goBack();
      return;
    }

    navigation.navigate('VerifyingOrder', {
      storeId,
      amount,
      deliveryFee,
      subtotal,
      taxes,
      couponDiscount,
      platformFee,
      otherCharges,
      prescriptionMode,
      prescriptionDocumentId,
      prescriptionId,
      prescriptionRequired,
      paymentMethod: selectedMethod,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Select Payment Options</Text>
            <Text style={styles.headerSubtitle}>{pharmacyName} • ₹{formatPrice(amount)}</Text>
          </View>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>₹{formatPrice(amount)}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {paymentError && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{paymentError}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pay Online</Text>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={[styles.paymentRow, selectedMethod === 'online' && styles.paymentRowSelected]}
            onPress={() => setSelectedMethod('online')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <CreditCard size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.paymentName}>UPI / Card / Netbanking / Wallet</Text>
                <Text style={styles.paymentSubtext}>Via Razorpay - all major methods supported</Text>
              </View>
            </View>
            <View style={selectedMethod === 'online' ? styles.radioSelected : styles.radioUnselected}>
              {selectedMethod === 'online' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Cash on Delivery (COD)</Text>
        <View style={styles.cardWrapper}>
          <TouchableOpacity
            style={[styles.paymentRow, selectedMethod === 'cod' && styles.paymentRowSelected]}
            onPress={() => setSelectedMethod('cod')}
            activeOpacity={0.7}
          >
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIconContainer, { backgroundColor: '#F5F5F5' }]}>
                <Coins size={18} color="#4B5563" />
              </View>
              <Text style={styles.paymentName}>Cash on Delivery (Pay at home)</Text>
            </View>
            <View style={selectedMethod === 'cod' ? styles.radioSelected : styles.radioUnselected}>
              {selectedMethod === 'cod' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.securityWrapper}>
          <ShieldCheck size={18} color="#059669" />
          <Text style={styles.securityText}>100% Secure & PCI-DSS Compliant Payments via Razorpay</Text>
        </View>
      </ScrollView>

      {/* Sticky footer pay button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
        <TouchableOpacity
          style={[styles.payBtn, isCheckoutPaused && styles.payBtnDisabled]}
          onPress={handlePay}
          activeOpacity={0.8}
          disabled={isCheckoutPaused}
        >
          <Text style={styles.payBtnText}>
            {isCheckoutPaused
              ? 'Temporarily Unavailable'
              : selectedMethod === 'cod' ? 'Place Order' : `Pay ₹${formatPrice(amount)}`}
          </Text>
          {!isCheckoutPaused && <ChevronRight size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  totalBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  totalBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#089643',
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  paymentRowSelected: {
    backgroundColor: '#F8FAFC',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 12,
  },
  paymentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  radioUnselected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#089643',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#089643',
  },
  securityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
  },
  payBtn: {
    backgroundColor: '#089643',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
