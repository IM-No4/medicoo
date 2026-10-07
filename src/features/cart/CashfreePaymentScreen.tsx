import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, Check, AlertCircle, Smartphone, CreditCard } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { apiClient } from '../../services/api/client';
import { getDocumentViewUrl } from '../../services/api/document.api';
import { clearCart } from '../../services/api/cart.api';
import { payUpiCollect, getCashfreeOrderStatus } from '../../services/api/cashfree.api';
import { clearStoreCartLocal } from '../../redux/slices/cartSlice';
import { dismissActivity } from '../../redux/slices/activitySlice';
import { setActiveOrder } from '../../redux/slices/orderSlice';
import { RootState } from '../../redux/store';

async function releaseCheckoutHold(holdId: string, reason: string) {
  try {
    await apiClient.post('/api/orders/release-checkout-hold', { holdId, reason });
  } catch (e) {
    console.warn('Failed to release checkout hold', e);
  }
}

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const UPI_ID_PATTERN = /^[\w.+-]{2,256}@[a-zA-Z]{2,64}$/;
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

type Phase = 'entering' | 'awaiting_approval' | 'confirming' | 'success' | 'error';

// The actual custom, Swiggy-style payment screen - reached from
// VerifyingOrderScreen.tsx once the store/stock hold + Cashfree order are
// both confirmed. UPI Collect (type a UPI ID, approve in your own UPI app)
// is the one path here with genuinely zero Cashfree UI at any point. The
// "pay via app icon" and "more payment options" (cards/netbanking/wallets)
// slots are visible but intentionally disabled for now - both need a
// WebView (react-native-webview isn't installed in this project yet, and
// adding it means a native rebuild) - see cashfreeService.js's own
// payUpiIntent comment for why intent can't be a raw deep link either.
export default function CashfreePaymentScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

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
    holdId,
    cashfreeOrderId,
    paymentSessionId,
  } = route.params || {};

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
  const pharmacyName = useMemo(() => carts[storeId]?.storeName || 'Pharmacy', [carts, storeId]);

  const [phase, setPhase] = useState<Phase>('entering');
  const [upiId, setUpiId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  const cartItemsRef = useRef(Object.values(carts[storeId]?.items || {}));
  const holdIdRef = useRef<string | null>(holdId || null);
  const cancelledRef = useRef(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const buildOrderPayload = () => ({
    storeId,
    holdId: holdIdRef.current,
    items: cartItemsRef.current.map((item: any) => ({
      productId: item.medicineId,
      sku: item.sku,
      name: item.name,
      price: item.price,
      discountPrice: item.discountPrice,
      quantity: item.quantity,
      brand: item.brand || '',
      composition: item.composition || '',
      prescriptionRequired: item.prescriptionRequired || false,
      image: item.image || null,
      batchId: item.batchId || String(item.medicineId),
      expiryDate: item.expiryDate || null,
    })),
    billDetails: {
      itemsCost: subtotal,
      deliveryCost: deliveryFee,
      taxes: taxes,
      couponDiscount: couponDiscount,
      platformFee: platformFee,
      packagingCharges: otherCharges,
      totalAmount: amount,
      finalTotal: amount,
      totalItems: cartItemsRef.current.reduce((sum: number, item: any) => sum + item.quantity, 0),
    },
    deliveryAddress: selectedAddress ? {
      label: selectedAddress.label || 'Home',
      fullAddress: selectedAddress.fullAddress || '',
      latitude: Number(selectedAddress.latitude) || 0,
      longitude: Number(selectedAddress.longitude) || 0,
      receiverName: selectedAddress.receiverName || '',
      receiverPhone: selectedAddress.receiverNumber || '',
    } : null,
    paymentMethod: 'online',
    paymentGateway: 'cashfree',
    cashfreeOrderId,
    mode: 'online',
    prescription_mode: prescriptionMode === 'doctor' ? 'doctor' : prescriptionMode ? 'image' : 'none',
    prescription_id: prescriptionMode === 'doctor' ? prescriptionId : prescriptionDocumentId,
    prescription_uri: prescriptionMode === 'doctor' ? undefined : (prescriptionDocumentId ? getDocumentViewUrl(prescriptionDocumentId) : undefined),
    prescription_required: !!prescriptionRequired,
  });

  const handleOrderPlaced = async (forcedOrderId: string, forcedOrderNumber: string) => {
    holdIdRef.current = null;
    try {
      await clearCart(storeId);
    } catch (e) {
      console.warn('Failed clearing cart from database, continuing locally', e);
    }

    setOrderNumber(forcedOrderNumber);

    dispatch(
      setActiveOrder({
        orderId: forcedOrderId,
        orderNumber: forcedOrderNumber,
        storeId,
        storeName: pharmacyName,
        amount,
        address: selectedAddress,
        status: 'pending',
        timestamp: Date.now(),
        items: cartItemsRef.current.map((item: any) => ({
          productId: item.medicineId,
          sku: item.sku,
          name: item.name,
          price: item.price,
          discountPrice: item.discountPrice,
          quantity: item.quantity,
          brand: item.brand || '',
          composition: item.composition || '',
          prescriptionRequired: item.prescriptionRequired || false,
          image: item.image || null,
          batchId: item.batchId || String(item.medicineId),
          expiryDate: item.expiryDate || null,
        })),
        billData: {
          itemsCost: subtotal,
          deliveryCost: deliveryFee,
          taxes: taxes,
          couponDiscount: couponDiscount,
          platformFee: platformFee,
          packagingCharges: otherCharges,
          totalAmount: amount,
          finalTotal: amount,
          totalItems: cartItemsRef.current.reduce((sum: number, item: any) => sum + item.quantity, 0),
        }
      })
    );

    dispatch(dismissActivity() as any);
    dispatch(clearStoreCartLocal({ storeId }));
    if (!cancelledRef.current) setPhase('success');
  };

  const finalizeOrder = async () => {
    setPhase('confirming');
    try {
      const orderRes = await apiClient.post('/api/orders/place-order', buildOrderPayload());
      await handleOrderPlaced(orderRes.data.orderId, orderRes.data.orderNumber);
    } catch (error: any) {
      // Payment already succeeded - deliberately not releasing the hold,
      // same reasoning as VerifyingOrderScreen.tsx's own online-path catch:
      // the customer's money has moved, the reserved stock should still be
      // there if support needs to retry order creation shortly.
      setErrorMessage(
        error?.response?.data?.message || 'Payment succeeded but we could not confirm your order. Please contact support before retrying.'
      );
      setPhase('error');
    }
  };

  const pollForSuccess = (startedAt: number) => {
    if (cancelledRef.current) return;
    getCashfreeOrderStatus(cashfreeOrderId)
      .then((result) => {
        if (cancelledRef.current) return;
        if (result.status === 'SUCCESS') {
          finalizeOrder();
          return;
        }
        if (result.status === 'FAILED' || result.status === 'CANCELLED' || result.status === 'VOID') {
          releaseCheckoutHold(holdIdRef.current!, 'payment_failed');
          setErrorMessage('The payment was declined or cancelled. Please try again.');
          setPhase('error');
          return;
        }
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          releaseCheckoutHold(holdIdRef.current!, 'payment_failed');
          setErrorMessage('We did not receive your approval in time. Please try again.');
          setPhase('error');
          return;
        }
        pollTimerRef.current = setTimeout(() => pollForSuccess(startedAt), POLL_INTERVAL_MS);
      })
      .catch(() => {
        if (cancelledRef.current) return;
        pollTimerRef.current = setTimeout(() => pollForSuccess(startedAt), POLL_INTERVAL_MS);
      });
  };

  const handleSubmitUpi = async () => {
    if (!UPI_ID_PATTERN.test(upiId.trim())) {
      setErrorMessage('Please enter a valid UPI ID, like name@bank.');
      return;
    }
    setErrorMessage('');
    setPhase('awaiting_approval');
    try {
      await payUpiCollect(paymentSessionId, upiId.trim());
      pollForSuccess(Date.now());
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || 'Could not send the payment request. Please check the UPI ID and try again.');
      setPhase('entering');
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (holdIdRef.current) {
      releaseCheckoutHold(holdIdRef.current, 'cancelled');
      holdIdRef.current = null;
    }
    navigation.goBack();
  };

  const handleRetry = () => {
    cancelledRef.current = false;
    setErrorMessage('');
    setPhase('entering');
  };

  // Same reasoning as VerifyingOrderScreen.tsx: cancelling once payment has
  // actually succeeded and order-placement is in flight would leave the
  // customer paid with no order.
  const canCancel = phase === 'entering' || phase === 'awaiting_approval';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity
          onPress={handleCancel}
          disabled={!canCancel}
          style={[styles.backButton, !canCancel && styles.backButtonDisabled]}
          activeOpacity={0.7}
        >
          <ChevronLeft size={22} color={canCancel ? '#111827' : '#D1D5DB'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay ₹{formatPrice(amount)}</Text>
        <View style={{ width: 40 }} />
      </View>

      {(phase === 'entering' || phase === 'awaiting_approval') && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.body}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pay by UPI ID</Text>
            <View style={styles.upiRow}>
              <TextInput
                style={styles.upiInput}
                placeholder="yourname@bank"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                value={upiId}
                onChangeText={setUpiId}
                editable={phase === 'entering'}
              />
              <TouchableOpacity
                style={[styles.payBtn, phase !== 'entering' && styles.payBtnDisabled]}
                onPress={handleSubmitUpi}
                disabled={phase !== 'entering'}
                activeOpacity={0.8}
              >
                {phase === 'awaiting_approval' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.payBtnText}>Pay</Text>
                )}
              </TouchableOpacity>
            </View>
            {phase === 'awaiting_approval' && (
              <Text style={styles.awaitingText}>
                Approve the ₹{formatPrice(amount)} request in your UPI app...
              </Text>
            )}
            {!!errorMessage && phase === 'entering' && (
              <View style={styles.errorBanner}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={[styles.section, styles.sectionDisabled]}>
            <Text style={styles.sectionTitle}>Pay via UPI App</Text>
            <View style={styles.comingSoonRow}>
              <Smartphone size={18} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>GPay, PhonePe, Paytm - coming soon</Text>
            </View>
          </View>

          <View style={[styles.section, styles.sectionDisabled]}>
            <Text style={styles.sectionTitle}>More Payment Options</Text>
            <View style={styles.comingSoonRow}>
              <CreditCard size={18} color="#9CA3AF" />
              <Text style={styles.comingSoonText}>Cards, Netbanking, Wallets - coming soon</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {(phase === 'confirming') && (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#089643" />
          <Text style={styles.title}>Payment received</Text>
          <Text style={styles.subtitle}>Confirming your order...</Text>
        </View>
      )}

      {phase === 'success' && (
        <View style={styles.centerContent}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Check size={40} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.title}>Order Placed Successfully!</Text>
          <Text style={styles.subtitle}>
            Your medicine order from {pharmacyName} has been accepted and is being processed.
          </Text>
          <View style={styles.receiptContainer}>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Order ID</Text>
              <Text style={styles.receiptValue}>{orderNumber}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Paid Amount</Text>
              <Text style={styles.receiptValue}>₹{formatPrice(amount)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.replace('LiveTracking')} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Track Order Live</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'error' && (
        <View style={styles.centerContent}>
          <View style={styles.errorIconOuter}>
            <AlertCircle size={40} color="#DC2626" />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{errorMessage}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  backButtonDisabled: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  body: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  upiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  upiInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  payBtn: {
    backgroundColor: '#089643',
    borderRadius: 12,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  awaitingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: '#6B7280',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
  },
  comingSoonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
  },
  comingSoonText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#089643',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginTop: 28,
    marginBottom: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  primaryBtn: {
    backgroundColor: '#089643',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '700',
  },
});
