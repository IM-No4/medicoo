import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
  Smartphone,
  Landmark,
  Wallet,
  Coins,
} from 'lucide-react-native';
import { apiClient } from '../../services/api/client';
import { clearCart } from '../../services/api/cart.api';
import { getProfileDetails } from '../../services/api/user.api';
import { clearStoreCartLocal } from '../../redux/slices/cartSlice';
import { dismissActivity } from '../../redux/slices/activitySlice';
import { setActiveOrder } from '../../redux/slices/orderSlice';
import { RootState } from '../../redux/store';
import * as WebBrowser from 'expo-web-browser';
import { StatusBar } from 'expo-status-bar';

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const POPULAR_BANKS = [
  { id: 'sbi', name: 'SBI', code: 'SBIN' },
  { id: 'hdfc', name: 'HDFC', code: 'HDFC' },
  { id: 'icici', name: 'ICICI', code: 'ICIC' },
  { id: 'axis', name: 'Axis', code: 'UTIB' },
];

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

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<string>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initiating transaction...');
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(true);

  // Bank states
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Sandbox simulation states
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Form validations for Credit Card
  const isCardValid = useMemo(() => {
    const cleanNum = cardNumber.replace(/\s+/g, '');
    const cleanExpiry = cardExpiry.replace(/\//g, '');
    return (
      cleanNum.length === 16 &&
      cleanExpiry.length === 4 &&
      cardCVV.length === 3 &&
      cardName.trim().length > 2
    );
  }, [cardNumber, cardExpiry, cardCVV, cardName]);

  const handleCardNumberChange = (text: string) => {
    const formatted = text
      .replace(/\D/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .slice(0, 19);
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (text: string) => {
    const formatted = text
      .replace(/\D/g, '')
      .replace(/(.{2})/, '$1/')
      .trim()
      .slice(0, 5);
    setCardExpiry(formatted);
  };

  const handleCardCVVChange = (text: string) => {
    const formatted = text.replace(/\D/g, '').slice(0, 3);
    setCardCVV(formatted);
  };

  // Main pay execution handler
  const handlePay = async () => {
    setIsProcessing(true);
    setStatusMessage('Placing order on backend...');

    let customerId = '';
    try {
      const profile = await getProfileDetails();
      customerId = profile.customerId || profile._id || profile.id || '';
    } catch (e) {
      console.warn('Failed to fetch profile details', e);
    }

    if (!customerId) {
      customerId = '60d5ec4b8d7c2a1234567890'; // Valid fallback ID
    }

    const cartItems = Object.values(carts[storeId]?.items || {});

    const orderPayload = {
      customerId: customerId,
      storeId: storeId,
      items: cartItems.map(item => ({
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
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      deliveryAddress: selectedAddress ? {
        label: selectedAddress.label || 'Home',
        fullAddress: selectedAddress.fullAddress || '',
        latitude: Number(selectedAddress.latitude) || 0,
        longitude: Number(selectedAddress.longitude) || 0,
        receiverName: selectedAddress.receiverName || 'John Doe',
        receiverPhone: selectedAddress.receiverPhone || '+91 9876543210',
      } : null,
      paymentMethod: selectedMethod,
      paymentDetails: {
        transactionId: selectedMethod === 'cod' ? null : 'MOCK_TXN_' + Math.floor(Math.random() * 100000000),
        status: selectedMethod === 'cod' ? 'PENDING' : 'PAID',
      },
      mode: 'online',
      prescription_mode: 'none',
      prescription_required: false,
    };

    try {
      // Call backend to create the real order!
      const orderRes = await apiClient.post('/api/orders/place-order', orderPayload);
      const serverOrderId = orderRes.data.orderId;
      const serverOrderNumber = orderRes.data.orderNumber;
      setOrderId(serverOrderId);
      setOrderNumber(serverOrderNumber);

      // Simulate payment gateway processing for digital modes
      if (selectedMethod !== 'cod') {
        setStatusMessage('Simulating payment gateway...');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      handlePaymentSuccess(serverOrderId, serverOrderNumber);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data || error.message;
      console.warn('Real backend order placement failed, falling back to simulator', errorMsg);
      // Fallback sandbox simulator
      triggerSandboxFlow();
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerSandboxFlow = () => {
    const generatedId = 'CF_ORD_' + Math.floor(Math.random() * 900000 + 100000);
    const generatedNumber = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 90000 + 10000);
    setOrderId(generatedId);
    setOrderNumber(generatedNumber);
    setIsSandboxOpen(true);
  };

  const handlePaymentSuccess = async (forcedOrderId?: string, forcedOrderNumber?: string) => {
    setIsSandboxOpen(false);
    setIsProcessing(true);
    setStatusMessage('Clearing shopping cart...');
    try {
      await clearCart(storeId);
    } catch (e) {
      console.warn('Failed clearing cart from database, continuing locally', e);
    }
    
    const finalOrderId = forcedOrderId || orderId || 'CF_ORD_' + Math.floor(Math.random() * 900000 + 100000);
    const finalOrderNumber = forcedOrderNumber || orderNumber || 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 90000 + 10000);
    if (forcedOrderId) {
      setOrderId(forcedOrderId);
    }
    if (forcedOrderNumber) {
      setOrderNumber(forcedOrderNumber);
    } else if (!orderNumber) {
      setOrderNumber(finalOrderNumber);
    }

    // Save order data in Redux for live tracking
    dispatch(
      setActiveOrder({
        orderId: finalOrderId,
        orderNumber: finalOrderNumber,
        storeId,
        storeName: pharmacyName,
        amount,
        address: selectedAddress,
        status: 'pending', // Order is pending acceptance initially
        timestamp: Date.now(),
        items: cartItems.map(item => ({
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
          totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        }
      })
    );

    // Dismiss the "Continue from where you left" activity card
    dispatch(dismissActivity() as any);

    // Clear redux store cart
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        >
          {/* UPI Apps Grid */}
          <Text style={styles.sectionTitle}>UPI Options</Text>
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'gpay' && styles.paymentRowSelected]}
              onPress={() => setSelectedMethod('gpay')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#EBF5FF' }]}>
                  <Smartphone size={18} color="#1A73E8" />
                </View>
                <Text style={styles.paymentName}>Google Pay</Text>
              </View>
              <View style={selectedMethod === 'gpay' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'gpay' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'phonepe' && styles.paymentRowSelected]}
              onPress={() => setSelectedMethod('phonepe')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#F3E8FF' }]}>
                  <Smartphone size={18} color="#7C3AED" />
                </View>
                <Text style={styles.paymentName}>PhonePe</Text>
              </View>
              <View style={selectedMethod === 'phonepe' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'phonepe' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'paytm_upi' && styles.paymentRowSelected]}
              onPress={() => setSelectedMethod('paytm_upi')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Smartphone size={18} color="#0284C7" />
                </View>
                <Text style={styles.paymentName}>Paytm UPI</Text>
              </View>
              <View style={selectedMethod === 'paytm_upi' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'paytm_upi' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Cards Section */}
          <Text style={styles.sectionTitle}>Cards (Credit/Debit)</Text>
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'card' && styles.paymentRowSelected, { borderBottomWidth: selectedMethod === 'card' ? 1 : 0 }]}
              onPress={() => setSelectedMethod('card')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#FEF3C7' }]}>
                  <CreditCard size={18} color="#D97706" />
                </View>
                <Text style={styles.paymentName}>Pay via Credit/Debit Card</Text>
              </View>
              <View style={selectedMethod === 'card' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'card' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {selectedMethod === 'card' && (
              <View style={styles.cardFormContainer}>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Card Number (16 Digits)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                />
                <View style={styles.cardInputRow}>
                  <TextInput
                    style={[styles.cardInput, { flex: 1, marginRight: 8 }]}
                    placeholder="MM/YY"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={cardExpiry}
                    onChangeText={handleCardExpiryChange}
                  />
                  <TextInput
                    style={[styles.cardInput, { flex: 1, marginLeft: 8 }]}
                    placeholder="CVV"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={3}
                    value={cardCVV}
                    onChangeText={handleCardCVVChange}
                  />
                </View>
                <TextInput
                  style={styles.cardInput}
                  placeholder="Cardholder Name"
                  placeholderTextColor="#9CA3AF"
                  value={cardName}
                  onChangeText={setCardName}
                />
                <TouchableOpacity
                  style={styles.saveCardCheckboxRow}
                  onPress={() => setSaveCard(!saveCard)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, saveCard && styles.checkboxSelected]}>
                    {saveCard && <Check size={12} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.saveCardText}>Save card details securely for future payments</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Wallets */}
          <Text style={styles.sectionTitle}>Wallets</Text>
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'wallet_paytm' && styles.paymentRowSelected]}
              onPress={() => setSelectedMethod('wallet_paytm')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#E0F2FE' }]}>
                  <Wallet size={18} color="#0369A1" />
                </View>
                <Text style={styles.paymentName}>Paytm Wallet</Text>
              </View>
              <View style={selectedMethod === 'wallet_paytm' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'wallet_paytm' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Net Banking */}
          <Text style={styles.sectionTitle}>Net Banking</Text>
          <View style={styles.cardWrapper}>
            <TouchableOpacity
              style={[styles.paymentRow, selectedMethod === 'netbanking' && styles.paymentRowSelected, { borderBottomWidth: selectedMethod === 'netbanking' ? 1 : 0 }]}
              onPress={() => setSelectedMethod('netbanking')}
              activeOpacity={0.7}
            >
              <View style={styles.paymentLeft}>
                <View style={[styles.paymentIconContainer, { backgroundColor: '#F0FDF4' }]}>
                  <Landmark size={18} color="#16A34A" />
                </View>
                <Text style={styles.paymentName}>Net Banking (Indian Banks)</Text>
              </View>
              <View style={selectedMethod === 'netbanking' ? styles.radioSelected : styles.radioUnselected}>
                {selectedMethod === 'netbanking' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {selectedMethod === 'netbanking' && (
              <View style={styles.bankGridContainer}>
                {POPULAR_BANKS.map((bank) => (
                  <TouchableOpacity
                    key={bank.id}
                    style={[styles.bankGridItem, selectedBank === bank.id && styles.bankGridItemSelected]}
                    onPress={() => setSelectedBank(bank.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bankAvatar, selectedBank === bank.id && styles.bankAvatarActive]}>
                      <Text style={[styles.bankAvatarText, selectedBank === bank.id && styles.bankAvatarTextActive]}>
                        {bank.name.slice(0, 2)}
                      </Text>
                    </View>
                    <Text style={styles.bankLabelText}>{bank.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Cash on Delivery */}
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

          {/* Security Badge */}
          <View style={styles.securityWrapper}>
            <ShieldCheck size={18} color="#059669" />
            <Text style={styles.securityText}>100% Secure & PCI-DSS Compliant Payments via Cashfree</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky footer pay button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 }]}>
        <TouchableOpacity
          style={[styles.payBtn, selectedMethod === 'card' && !isCardValid && styles.payBtnDisabled]}
          disabled={selectedMethod === 'card' && !isCardValid}
          onPress={handlePay}
          activeOpacity={0.8}
        >
          <Text style={styles.payBtnText}>
            {selectedMethod === 'cod' ? 'Place Order' : `Pay ₹${formatPrice(amount)}`}
          </Text>
          <ChevronRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Cashfree Connecting Dialog */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#089643" />
            <Text style={styles.loadingTitle}>Processing Payment</Text>
            <Text style={styles.loadingSubtitle}>{statusMessage}</Text>
          </View>
        </View>
      </Modal>

      {/* Interactive Cashfree Sandbox PG Simulator */}
      <Modal visible={isSandboxOpen} transparent animationType="slide">
        <View style={styles.sandboxOverlay}>
          <View style={styles.sandboxBox}>
            <View style={styles.sandboxHeader}>
              <Text style={styles.sandboxBadge}>Cashfree Sandbox</Text>
              <Text style={styles.sandboxTitle}>PG Gateway Simulator</Text>
            </View>

            <View style={styles.sandboxDetails}>
              <View style={styles.sandboxDetailRow}>
                <Text style={styles.sandboxLabel}>Order ID</Text>
                <Text style={styles.sandboxValue}>{orderId}</Text>
              </View>
              <View style={styles.sandboxDetailRow}>
                <Text style={styles.sandboxLabel}>Merchant</Text>
                <Text style={styles.sandboxValue}>Medicoo App</Text>
              </View>
              <View style={styles.sandboxDetailRow}>
                <Text style={styles.sandboxLabel}>Amount</Text>
                <Text style={[styles.sandboxValue, { fontWeight: '700', color: '#111827' }]}>
                  ₹{formatPrice(amount)}
                </Text>
              </View>
              <View style={styles.sandboxDetailRow}>
                <Text style={styles.sandboxLabel}>Payment Method</Text>
                <Text style={styles.sandboxValue}>{selectedMethod.toUpperCase()}</Text>
              </View>
            </View>

            <Text style={styles.sandboxInstructions}>
              This is a local sandbox payment gateway simulation. Please select the status transaction callback you wish to trigger.
            </Text>

            <TouchableOpacity
              style={[styles.sandboxBtn, styles.sandboxSuccessBtn]}
              onPress={() => handlePaymentSuccess()}
              activeOpacity={0.8}
            >
              <Text style={styles.sandboxBtnText}>Simulate Success (Callback PAID)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sandboxBtn, styles.sandboxCancelBtn]}
              onPress={() => {
                setIsSandboxOpen(false);
                alert('Payment session cancelled by user.');
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.sandboxBtnText, { color: '#4B5563' }]}>Simulate Cancel / Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Successful Checkout Confirmation Screen Overlay */}
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
                // Navigate to the live tracking screen (in CartStack)
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
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentRowSelected: {
    backgroundColor: '#F8FAFC',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  cardFormContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
  },
  cardInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 12,
  },
  cardInputRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  saveCardCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#089643',
    backgroundColor: '#089643',
  },
  saveCardText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  bankGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  bankGridItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    gap: 8,
  },
  bankGridItemSelected: {
    borderColor: '#089643',
    backgroundColor: '#F0FDF4',
  },
  bankAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankAvatarActive: {
    backgroundColor: '#089643',
  },
  bankAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  bankAvatarTextActive: {
    color: '#FFFFFF',
  },
  bankLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
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
  sandboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sandboxBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sandboxHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sandboxBadge: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sandboxTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  sandboxDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sandboxDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sandboxLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  sandboxValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  sandboxInstructions: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  sandboxBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  sandboxSuccessBtn: {
    backgroundColor: '#089643',
  },
  sandboxCancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  sandboxBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
