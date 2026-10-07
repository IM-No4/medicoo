import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, Check, AlertCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { apiClient } from '../../services/api/client';
import { getDocumentViewUrl } from '../../services/api/document.api';
import { clearCart } from '../../services/api/cart.api';
import { createCashfreeOrder } from '../../services/api/cashfree.api';
import { clearStoreCartLocal } from '../../redux/slices/cartSlice';
import { dismissActivity } from '../../redux/slices/activitySlice';
import { setActiveOrder } from '../../redux/slices/orderSlice';
import { RootState } from '../../redux/store';

// Same live, uncached checks as before (see PaymentScreen.tsx's earlier
// history) - just now hosted on their own screen instead of a modal
// overlaid on the payment-method picker, so there's something real for the
// back button to cancel out of before any money moves.
async function validateCheckout(storeId: string, items: { medicineId: string; quantity: number }[]) {
  const response = await apiClient.post('/api/orders/validate-checkout', { storeId, items });
  return response.data as { success: true; holdId: string; expiresAt: string };
}

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

type Phase = 'verifying' | 'gateway' | 'confirming' | 'success' | 'error';

// The intermediate screen between "Pay" and an actual payment attempt -
// PaymentScreen.tsx now just collects the chosen method and navigates here
// with the order details. This is where the store/stock hold is taken.
// For COD, this screen places the order itself. For online, it creates the
// Cashfree order (the "is the payment gateway even reachable right now"
// check the user asked for) and hands off to CashfreePaymentScreen.tsx,
// which owns the actual custom payment UI - all behind one calm,
// Swiggy/Zomato-style "hang on" screen instead of a spinner modal.
export default function VerifyingOrderScreen() {
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
    paymentMethod,
  } = route.params || { storeId: '', amount: 0, paymentMethod: 'cod' };

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  const pharmacyName = useMemo(() => carts[storeId]?.storeName || 'Pharmacy', [carts, storeId]);

  const [phase, setPhase] = useState<Phase>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  // Snapshotted once, same reasoning as PaymentScreen.tsx previously had it:
  // the payment callback fires after this component may have re-rendered,
  // and needs a consistent set of items regardless.
  const cartItemsRef = useRef(Object.values(carts[storeId]?.items || {}));
  const holdIdRef = useRef<string | null>(null);
  // Flipped by the cancel button - every async continuation checks this
  // before touching state or moving the flow forward, so tapping cancel
  // mid-request actually stops the flow instead of only hiding a spinner
  // while the old request quietly keeps going and lands anyway.
  const cancelledRef = useRef(false);

  // Only ever called for COD now - the online path hands off to
  // CashfreePaymentScreen.tsx, which builds its own payload once payment
  // actually succeeds there.
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
    paymentMethod: 'cod',
    mode: 'online',
    prescription_mode: prescriptionMode === 'doctor' ? 'doctor' : prescriptionMode ? 'image' : 'none',
    prescription_id: prescriptionMode === 'doctor' ? prescriptionId : prescriptionDocumentId,
    prescription_uri: prescriptionMode === 'doctor' ? undefined : (prescriptionDocumentId ? getDocumentViewUrl(prescriptionDocumentId) : undefined),
    prescription_required: !!prescriptionRequired,
  });

  const finalizeOrder = async () => {
    const orderRes = await apiClient.post('/api/orders/place-order', buildOrderPayload());
    return orderRes.data;
  };

  const handleOrderPlaced = async (forcedOrderId: string, forcedOrderNumber: string) => {
    holdIdRef.current = null;
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
    if (!cancelledRef.current) setPhase('success');
  };

  const runFlow = async () => {
    setPhase('verifying');
    setErrorMessage('');

    let holdId: string;
    try {
      const result = await validateCheckout(
        storeId,
        cartItemsRef.current.map((item: any) => ({ medicineId: item.medicineId, quantity: item.quantity }))
      );
      holdId = result.holdId;
      holdIdRef.current = holdId;
    } catch (error: any) {
      if (cancelledRef.current) return;
      const shortages = error?.response?.data?.shortages;
      setErrorMessage(
        shortages?.length
          ? `Only ${shortages[0].available} left in stock for ${shortages[0].name}. Please update your cart.`
          : error?.response?.data?.message || 'This store or item is no longer available. Please try again.'
      );
      setPhase('error');
      return;
    }

    if (cancelledRef.current) {
      releaseCheckoutHold(holdId, 'cancelled');
      return;
    }

    if (paymentMethod === 'cod') {
      setPhase('confirming');
      try {
        const data = await finalizeOrder();
        if (cancelledRef.current) return;
        await handleOrderPlaced(data.orderId, data.orderNumber);
      } catch (error: any) {
        if (cancelledRef.current) return;
        releaseCheckoutHold(holdId, 'order_failed');
        setErrorMessage(error?.response?.data?.message || 'Could not place your order. Please try again.');
        setPhase('error');
      }
      return;
    }

    // Online - creating the Cashfree order here doubles as the "is the
    // payment gateway actually reachable right now" check the whole point
    // of this screen is to surface before the user is looking at a payment
    // screen that's about to fail anyway. The actual payment UI (custom
    // UPI Collect, etc.) lives on CashfreePaymentScreen.tsx, not here.
    setPhase('gateway');
    let cashfreeOrderId: string, paymentSessionId: string;
    try {
      const created = await createCashfreeOrder(amount);
      cashfreeOrderId = created.orderId;
      paymentSessionId = created.paymentSessionId;
    } catch (error: any) {
      if (!cancelledRef.current) {
        releaseCheckoutHold(holdId, 'payment_failed');
        setErrorMessage('Could not connect to the payment gateway. Please try again.');
        setPhase('error');
      }
      return;
    }

    if (cancelledRef.current) {
      releaseCheckoutHold(holdId, 'cancelled');
      return;
    }

    navigation.replace('CashfreePayment', {
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
      holdId,
      cashfreeOrderId,
      paymentSessionId,
    });
  };

  useEffect(() => {
    runFlow();
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    cancelledRef.current = true;
    if (holdIdRef.current) {
      releaseCheckoutHold(holdIdRef.current, 'cancelled');
      holdIdRef.current = null;
    }
    navigation.goBack();
  };

  const handleRetry = () => {
    cancelledRef.current = false;
    runFlow();
  };

  // Cancelling once an order is actively being placed (COD's 'confirming')
  // would leave the stock quietly un-held with no order to show for it -
  // the back button is disabled for that window. 'gateway' (creating the
  // Cashfree order) is a brief, cancellable step; by the time the user
  // would reach any actual payment UI, they've already been handed off to
  // CashfreePaymentScreen.tsx, which owns its own cancel logic.
  const canCancel = phase === 'verifying' || phase === 'gateway';

  // 'confirming' only ever fires for COD here now - the online path
  // navigates away during 'gateway', before reaching it (see runFlow).
  const messages: Record<Phase, { title: string; subtitle: string }> = {
    verifying: { title: 'Verifying your order', subtitle: 'Checking store availability and stock...' },
    gateway: { title: 'Connecting to payment gateway', subtitle: 'Just a moment, almost there...' },
    confirming: { title: 'Placing your order', subtitle: 'Hang on while we confirm it...' },
    success: { title: '', subtitle: '' },
    error: { title: '', subtitle: '' },
  };

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
      </View>

      <View style={styles.centerContent}>
        {(phase === 'verifying' || phase === 'gateway' || phase === 'confirming') && (
          <>
            <ActivityIndicator size="large" color="#089643" />
            <Text style={styles.title}>{messages[phase].title}</Text>
            <Text style={styles.subtitle}>{messages[phase].subtitle}</Text>
          </>
        )}

        {phase === 'success' && (
          <>
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

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.replace('LiveTracking')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Track Order Live</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'error' && (
          <>
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
          </>
        )}
      </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
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
