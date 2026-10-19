import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { StatusBar } from '../../components/ThemedStatusBar';
import { saveLastMethod } from '../../payments/pendingStore';
import { setPendingInput } from '../../payments/paymentInputStore';
import { usePaymentConfig } from '../../payments/usePaymentConfig';
import type { MethodInput } from '../../payments/types';
import PaymentHeader from '../../payments/ui/PaymentHeader';
import PaymentOptionsView from '../../payments/ui/PaymentOptionsView';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// "How do you want to pay?" - only choosing. Everything that happens after tapping Pay
// (checking the store and stock, creating the order, taking and confirming the payment)
// runs on its own full screen, PaymentProcessingScreen.
export default function PaymentScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const config = usePaymentConfig();

  const params = route.params || { storeId: '', amount: 0 };
  const { storeId, amount, prescriptionMode, prescriptionRequired = false } = params;

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
  const maintenance = useSelector((state: RootState) => state.appConfig.maintenance);

  const pharmacyName = carts[storeId]?.storeName || 'Pharmacy';
  const itemCount = Object.keys(carts[storeId]?.items || {}).length;
  const amountPaise = Math.round(Number(amount) * 100);
  const isCheckoutPaused = Boolean(maintenance?.enabled || maintenance?.services?.pharmacy === 'maintenance');
  const pausedMessage = isCheckoutPaused ? maintenance?.message || "We're performing scheduled maintenance. Please try again shortly." : undefined;

  // Paying: hand the chosen method to the processing screen (in memory - it may be a card).
  const onPay = useCallback(
    (input: MethodInput) => {
      setPendingInput(input);
      navigation.navigate('PaymentProcessing', params);
    },
    [navigation, params],
  );

  const placeCod = useCallback(() => {
    if (!selectedAddress) {
      navigation.navigate('AddressBookModal');
      return;
    }
    if (prescriptionRequired && !prescriptionMode) {
      Alert.alert('Prescription needed', 'One or more items need a prescription. Please add one in your cart first.');
      return;
    }
    saveLastMethod({ method: 'cod', label: 'Cash on delivery', sub: 'Pay on delivery' });
    navigation.navigate('VerifyingOrder', { ...params, paymentMethod: 'cod' });
  }, [navigation, params, prescriptionMode, prescriptionRequired, selectedAddress]);

  const source = useMemo(
    () => ({ ...config, phase: 'idle', error: null, start: onPay, dismissError: () => {} }),
    [config, onPay],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <PaymentHeader
        title={t('select_payment_options')}
        subtitle={`${itemCount} item${itemCount !== 1 ? 's' : ''} • Total: ₹${formatPrice(Number(amount))}`}
        summary={{ store: pharmacyName, addressTitle: selectedAddress?.label || 'Delivery address', addressLine: selectedAddress?.fullAddress || '' }}
        onBack={() => navigation.goBack()}
      />
      <PaymentOptionsView payment={source} amountPaise={amountPaise} onlineBlockedReason={pausedMessage} cod={{ enabled: !isCheckoutPaused, onPlace: placeCod }} />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
  });
