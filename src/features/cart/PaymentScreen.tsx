import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  ShieldCheck,
  Check,
  Coins,
  AlertCircle,
} from 'lucide-react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { apiClient } from '../../services/api/client';
import { clearCart } from '../../services/api/cart.api';
import { createRazorpayOrder } from '../../services/api/payment.api';
import { clearStoreCartLocal } from '../../redux/slices/cartSlice';
import { dismissActivity } from '../../redux/slices/activitySlice';
import { setActiveOrder } from '../../redux/slices/orderSlice';
import { RootState } from '../../redux/store';
import { StatusBar } from 'expo-status-bar';

interface RazorpayResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

export default function PaymentScreen() {
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
  } = route.params || { storeId: '', amount: 0 };
  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  const pharmacyName = useMemo(() => {
    return carts[storeId]?.storeName || 'Pharmacy';
  }, [carts, storeId]);

  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cod'>('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initiating transaction...');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Cart items don't change mid-checkout - snapshot once so the payment
  // callback (which fires after this component may have re-rendered) always
  // builds the order from a consistent set of items.
  const cartItemsRef = useRef(Object.values(carts[storeId]?.items || {}));

  const buildOrderPayload = (paymentMethod: 'online' | 'cod', razorpayResult?: RazorpayResult) => ({
    storeId,
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
      receiverName: selectedAddress.receiverName || 'John Doe',
      receiverPhone: selectedAddress.receiverPhone || '+91 9876543210',
    } : null,
    paymentMethod,
    razorpayOrderId: razorpayResult?.razorpay_order_id,
    razorpayPaymentId: razorpayResult?.razorpay_payment_id,
    razorpaySignature: razorpayResult?.razorpay_signature,
    mode: 'online',
    prescription_mode: 'none',
    prescription_required: false,
  });

  const finalizeOrder = async (paymentMethod: 'online' | 'cod', razorpayResult?: RazorpayResult) => {
    setStatusMessage('Placing order...');
    const orderRes = await apiClient.post('/api/orders/place-order', buildOrderPayload(paymentMethod, razorpayResult));
    await handlePaymentSuccess(orderRes.data.orderId, orderRes.data.orderNumber);
  };

  const handlePay = async () => {
    setPaymentError(null);

    if (selectedMethod === 'cod') {
      setIsProcessing(true);
      try {
        await finalizeOrder('cod');
      } catch (error: any) {
        setIsProcessing(false);
        setPaymentError(error?.response?.data?.message || 'Could not place your order. Please try again.');
      }
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Connecting to payment gateway...');
    try {
      const { orderId: razorpayOrderId, amount: amountInPaise, currency, keyId } = await createRazorpayOrder(amount);
      setIsProcessing(false);

      const result: RazorpayResult = await RazorpayCheckout.open({
        key: keyId,
        order_id: razorpayOrderId,
        amount: amountInPaise,
        currency,
        name: 'Medicoo',
        description: `Order from ${pharmacyName}`,
        prefill: {
          name: selectedAddress?.receiverName || '',
          contact: selectedAddress?.receiverPhone || '',
        },
        theme: { color: '#089643' },
      });

      setIsProcessing(true);
      setStatusMessage('Payment received, confirming order...');
      try {
        await finalizeOrder('online', result);
      } catch (error: any) {
        setIsProcessing(false);
        setPaymentError(
          error?.response?.data?.message || 'Payment succeeded but we could not confirm your order. Please contact support before retrying.'
        );
      }
    } catch (error: any) {
      setIsProcessing(false);
      // RazorpayCheckout rejects with {code, description} on failure/cancel;
      // our own API calls reject with an axios error instead.
      setPaymentError(error?.description || error?.response?.data?.message || 'Could not complete payment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (forcedOrderId: string, forcedOrderNumber: string) => {
    setIsProcessing(true);
    setStatusMessage('Clearing shopping cart...');
    try {
      await clearCart(storeId);
    } catch (e) {
      console.warn('Failed clearing cart from database, continuing locally', e);
    }

    setOrderId(forcedOrderId);
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
    setIsProcessing(false);
    setShowSuccessOverlay(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color="#111827" />
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
          style={styles.payBtn}
          onPress={handlePay}
          activeOpacity={0.8}
        >
          <Text style={styles.payBtnText}>
            {selectedMethod === 'cod' ? 'Place Order' : `Pay ₹${formatPrice(amount)}`}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#089643" />
            <Text style={styles.loadingTitle}>Processing Payment</Text>
            <Text style={styles.loadingSubtitle}>{statusMessage}</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessOverlay} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Check size={40} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your medicine order from <Text style={{ fontWeight: '700' }}>{pharmacyName}</Text> has been accepted and is being processed.
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
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Address</Text>
                <Text style={[styles.receiptValue, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>
                  {selectedAddress?.label || 'Home'} - {selectedAddress?.fullAddress || 'Selected Address'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.continueBtn}
              onPress={() => {
                setShowSuccessOverlay(false);
                navigation.navigate('CartStack', { screen: 'LiveTracking' });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>Track Order Live</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
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
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successBox: {
    alignItems: 'center',
    width: '100%',
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#089643',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  receiptContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 40,
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
  continueBtn: {
    backgroundColor: '#089643',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
