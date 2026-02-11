import QuantityControl from '@/src/features/pharmacy/components/QuantityControl';
import { CartItem, StoreCart } from '@/src/redux/slices/cart.types';
import { RootState } from '@/src/redux/store';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Plus,
  ShoppingBag,
  Ticket,
  User
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../actions/ActionExecutor';

export default function CartScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { storeID } = route.params || {};

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);

  // Get all available carts
  const storeCarts = useMemo(() => {
    if (storeID) {
      const storeCart = carts[storeID];
      return storeCart ? [storeCart] : [];
    } else {
      return Object.values(carts);
    }
  }, [carts, storeID]);

  // Local state for which store is currently visible
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    storeCarts.length > 0 ? storeCarts[0].storeId : null
  );

  const activeCart = useMemo(() => {
    return storeCarts.find(c => c.storeId === selectedStoreId) || storeCarts[0];
  }, [storeCarts, selectedStoreId]);

  const renderCartItem = (item: CartItem, storeId: string) => {
    const itemTotal = (item.discountPrice || item.price) * item.quantity;

    return (
      <View style={styles.itemRow} key={item.sku}>
        <View style={styles.itemIconContainer}>
          <View style={styles.vegDot} />
        </View>
        <View style={styles.itemMainInfo}>
          <Text style={styles.itemNameText}>{item.name}</Text>
          <Text style={styles.itemPriceText}>₹{item.discountPrice || item.price}</Text>
        </View>
        <View style={styles.itemQuantityControl}>
          <QuantityControl
            storeId={storeId}
            sku={item.sku}
            quantity={item.quantity}
            size="small"
          />
          <Text style={styles.itemRowTotal}>₹{itemTotal.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  const renderActiveCart = (storeCart: StoreCart) => {
    if (!storeCart) return null;

    const cartItems = Object.values(storeCart.items);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + ((item.discountPrice || item.price) * item.quantity),
      0
    );
    const deliveryFee = 40;
    const taxes = subtotal * 0.18;
    const total = subtotal + deliveryFee + taxes;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.pharmacyCard}>
          {/* Pharmacy Header */}
          <View style={styles.pharmacyHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pharmacyNameText}>{storeCart.storeName}</Text>
              <View style={styles.deliveryTimeRow}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.deliveryTimeText}>Delivery in 25-30 mins</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => executeAction('OPEN_PHARMACY', { storeId: storeCart.storeId })}>
              <Text style={styles.addMoreText}>+ Add Items</Text>
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <View style={styles.itemsListContainer}>
            {cartItems.map(item => renderCartItem(item, storeCart.storeId))}
          </View>

          {/* Instructions */}
          <TouchableOpacity style={styles.instructionButton}>
            <Plus size={16} color="#4B5563" />
            <Text style={styles.instructionText}>Add delivery instructions</Text>
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          {/* Coupon Section */}
          <TouchableOpacity style={styles.couponRow}>
            <Ticket size={20} color="#E11D48" />
            <Text style={styles.couponText}>Use Coupons / Offers</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.cardDivider} />

          {/* Receiver Details */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderLine}>
              <User size={18} color="#4B5563" />
              <Text style={styles.sectionTitleText}>Receiver Details</Text>
            </View>
            <View style={styles.receiverInfoBox}>
              <Text style={styles.receiverName}>John Doe</Text>
              <Text style={styles.receiverPhone}>+91 9876543210</Text>
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderLine}>
              <MapPin size={18} color="#4B5563" />
              <Text style={styles.sectionTitleText}>Delivery Address</Text>
              <TouchableOpacity onPress={() => executeAction('OPEN_ADDRESS_BOOK')}>
                <Text style={styles.changeActionText}>Change</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.addressBox}>
              <Text style={styles.addressLabelText}>{selectedAddress?.label || 'Home'}</Text>
              <Text style={styles.fullAddressText} numberOfLines={2}>
                {selectedAddress?.fullAddress || 'Please select an address from your book'}
              </Text>
            </View>
          </View>

          {/* Billing Details */}
          <View style={styles.billingContainer}>
            <Text style={styles.billingTitle}>Bill Summary</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Charges</Text>
              <Text style={styles.billValue}>₹{taxes.toFixed(2)}</Text>
            </View>
            <View style={[styles.billRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment & Checkout */}
          <View style={styles.checkoutFooter}>
            <View style={styles.paymentMethodSelect}>
              <CreditCard size={18} color="#4B5563" />
              <Text style={styles.paymentMethodText}>Google Pay</Text>
              <ChevronDown size={16} color="#9CA3AF" />
            </View>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => executeAction('OPEN_CHECKOUT', { storeId: storeCart.storeId })}
            >
              <View style={styles.payButtonContent}>
                <View>
                  <Text style={styles.payPrice}>₹{total.toFixed(2)}</Text>
                  <Text style={styles.paySubtext}>TOTAL</Text>
                </View>
                <View style={styles.placeOrderAction}>
                  <Text style={styles.placeOrderText}>PLACE ORDER</Text>
                  <ChevronRight size={20} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.policyCard}>
            <Info size={16} color="#9CA3AF" />
            <Text style={styles.policyText}>
              Orders cannot be cancelled once packed. Any discrepancy will be handled by our support.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (storeCarts.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <StatusBar style="dark" />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContent}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329061.png' }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>Nothing in your cart</Text>
          <Text style={styles.emptySubtitle}>
            Browse our pharmacies and add medicines to your cart
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => executeAction('OPEN_PHARMACY_LIST')}
          >
            <Text style={styles.browseButtonText}>Browse Pharmacies</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Carts</Text>
          {storeCarts.length > 1 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{storeCarts.length}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Store Selector Buttons */}
      {storeCarts.length > 1 && (
        <View style={styles.selectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorContent}
          >
            {storeCarts.map((item) => (
              <TouchableOpacity
                key={item.storeId}
                style={[
                  styles.selectorTab,
                  selectedStoreId === item.storeId && styles.selectorTabActive
                ]}
                onPress={() => setSelectedStoreId(item.storeId)}
                activeOpacity={0.8}
              >
                <ShoppingBag size={14} color={selectedStoreId === item.storeId ? '#fff' : '#6B7280'} />
                <Text style={[
                  styles.selectorTabText,
                  selectedStoreId === item.storeId && styles.selectorTabTextActive
                ]}>
                  {item.storeName}
                </Text>
                <View style={[
                  styles.selectorBadge,
                  selectedStoreId === item.storeId && styles.selectorBadgeActive
                ]}>
                  <Text style={[
                    styles.selectorBadgeText,
                    selectedStoreId === item.storeId && styles.selectorBadgeTextActive
                  ]}>
                    {Object.keys(item.items).length}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content Wrapper */}
      <View style={styles.contentWrapper}>
        {renderActiveCart(activeCart)}
      </View>
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerBadge: {
    backgroundColor: '#2FA561',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  backButton: {
    padding: 8,
    marginLeft: -12,
  },
  selectorWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  selectorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectorTabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  selectorTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  selectorTabTextActive: {
    color: '#fff',
  },
  selectorBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  selectorBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  selectorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  selectorBadgeTextActive: {
    color: '#fff',
  },
  contentWrapper: {
    flex: 1,
  },
  pharmacyCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 12,
  },
  pharmacyNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  deliveryTimeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2FA561',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  itemsListContainer: {
    paddingHorizontal: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 1,
    borderWidth: 1,
    borderColor: '#34D399',
    backgroundColor: '#34D399',
  },
  itemMainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  itemPriceText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  itemQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRowTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    width: 60,
    textAlign: 'right',
  },
  instructionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  couponText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  receiverInfoBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    gap: 2,
  },
  receiverName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  receiverPhone: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  addressBox: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  addressLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  fullAddressText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  billingContainer: {
    padding: 20,
  },
  billingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  billValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  checkoutFooter: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethodSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  payButton: {
    backgroundColor: '#2FA561',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#2FA561',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  payButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  paySubtext: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
  },
  placeOrderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  policyCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    marginTop: 10,
    alignItems: 'flex-start',
  },
  policyText: {
    flex: 1,
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
  },
  emptyContainer: {
    backgroundColor: '#fff',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: '#2FA561',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 20,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
