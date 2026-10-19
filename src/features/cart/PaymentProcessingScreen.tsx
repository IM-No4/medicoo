import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { StatusBar } from '../../components/ThemedStatusBar';
import { apiClient } from '../../services/api/client';
import { getDocumentViewUrl } from '../../services/api/document.api';
import { createPaymentOrder } from '../../payments/api';
import { applyPaidMedicineOrder, mapOrderItems } from '../../payments/medicineCheckout';
import { takePendingInput } from '../../payments/paymentInputStore';
import { usePayment } from '../../payments/usePayment';
import { BANKS, WALLETS } from '../../payments/banks';
import type { AttemptStatusView, MethodInput } from '../../payments/types';
import PaymentProgressView from '../../payments/ui/PaymentProgressView';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

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

type IssueKind = 'stock' | 'store' | 'address' | 'prescription' | 'network';

// A rejection shaped like an API error that also says WHAT kind of problem it is,
// so the progress screen can explain it calmly and offer the right next step.
const problem = (kind: IssueKind, message: string) => Object.assign(new Error(message), { kind, response: { data: { message } } });

const STEPS = ['Checking the store and your items', 'Creating your order', 'Securing your payment'];

// The payment itself, on a screen of its own: tapping Pay (or "Pay" in the cart with a saved
// method) lands here, and this screen checks the store and stock, creates the order, takes the
// payment and confirms it - explaining any problem calmly with a clear next step. Gateway-
// agnostic (see src/payments/). The order is placed on the SERVER once the payment is confirmed,
// so it still happens if the app is closed mid-payment.
export default function PaymentProcessingScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const params = route.params || { storeId: '', amount: 0 };
  const {
    storeId,
    amount,
    deliveryFee = 0,
    subtotal = amount,
    taxes = 0,
    couponDiscount = 0,
    couponCode,
    platformFee = 0,
    otherCharges = 0,
    prescriptionMode,
    prescriptionDocumentId,
    prescriptionId,
    prescriptionRequired = false,
    autoPay = false,
    resumeOnly = false,
  } = params;

  // The cart + checkout params without the "how we got here" flags - what the options screen needs.
  const checkoutParams = useMemo(() => {
    const { autoPay: _a, resumeOnly: _r, ...rest } = params;
    return rest;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carts = useSelector((state: RootState) => state.cart);
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
  const maintenance = useSelector((state: RootState) => state.appConfig.maintenance);

  const pharmacyName = carts[storeId]?.storeName || 'Pharmacy';
  // Snapshotted once: payment callbacks can fire after re-renders, and the cart is cleared on success.
  const cartItemsRef = useRef<any[]>(Object.values(carts[storeId]?.items || {}));
  const holdIdRef = useRef<string | null>(null);
  const placedRef = useRef(false);

  const isCheckoutPaused = Boolean(maintenance?.enabled || maintenance?.services?.pharmacy === 'maintenance');

  const preflight = () => {
    if (isCheckoutPaused) {
      throw Object.assign(new Error(maintenance?.message || "We're performing scheduled maintenance. Please try again shortly."), {
        kind: 'maintenance',
        response: { data: { message: maintenance?.message || "We're performing scheduled maintenance. Please try again shortly." } },
      });
    }
    if (!selectedAddress) {
      throw problem('address', 'Please choose where this order should be delivered before paying.');
    }
    if (prescriptionRequired && !prescriptionMode) {
      throw problem('prescription', 'One or more items need a prescription. Please add one in your cart and try again.');
    }
  };

  const billDetails = {
    itemsCost: subtotal,
    deliveryCost: deliveryFee,
    taxes,
    feeGst: taxes, // GST on the platform and delivery fees only
    couponDiscount,
    platformFee,
    packagingCharges: otherCharges,
    totalAmount: amount,
    finalTotal: amount,
    totalItems: cartItemsRef.current.reduce((sum: number, item: any) => sum + item.quantity, 0),
  };

  const buildPayload = (holdId: string) => ({
    storeId,
    holdId,
    items: mapOrderItems(cartItemsRef.current),
    billDetails,
    couponCode,
    deliveryAddress: selectedAddress
      ? {
          label: selectedAddress.label || 'Home',
          fullAddress: selectedAddress.fullAddress || '',
          latitude: Number(selectedAddress.latitude) || 0,
          longitude: Number(selectedAddress.longitude) || 0,
          receiverName: selectedAddress.receiverName || '',
          receiverPhone: selectedAddress.receiverNumber || '',
        }
      : null,
    prescription_mode: prescriptionMode === 'doctor' ? 'doctor' : prescriptionMode ? 'image' : 'none',
    prescription_id: prescriptionMode === 'doctor' ? prescriptionId : prescriptionDocumentId,
    prescription_uri: prescriptionMode === 'doctor' ? undefined : prescriptionDocumentId ? getDocumentViewUrl(prescriptionDocumentId) : undefined,
    prescription_required: !!prescriptionRequired,
  });

  const createOrder = useCallback(
    async (report: (completedSteps: number) => void) => {
      preflight();

      // 1. Check the store and hold the stock.
      let holdId: string;
      try {
        const hold = await validateCheckout(
          storeId,
          cartItemsRef.current.map((item: any) => ({ medicineId: item.medicineId, quantity: item.quantity })),
        );
        holdId = hold.holdId;
        holdIdRef.current = holdId;
      } catch (error: any) {
        if (!error?.response) throw problem('network', 'We could not reach the server. Please check your connection and try again.');
        const data = error.response.data;
        const shortage = data?.shortages?.[0];
        if (shortage) {
          throw problem(
            'stock',
            shortage.available > 0
              ? `Only ${shortage.available} of ${shortage.name} ${shortage.available === 1 ? 'is' : 'are'} available right now. Please update your cart.`
              : `${shortage.name} is out of stock right now. Please update your cart.`,
          );
        }
        const message: string = data?.message || 'This store or one of your items is no longer available.';
        throw problem(/store|pharmacy|offline|closed|deliver/i.test(message) ? 'store' : 'stock', message);
      }
      report(1);

      // 2. The payable order, with everything needed to place the order server-side once paid.
      try {
        const order = await createPaymentOrder({ purpose: 'medicine', payload: buildPayload(holdId) });
        return order as { orderId: string };
      } catch (error) {
        releaseCheckoutHold(holdId, 'payment_failed');
        holdIdRef.current = null;
        throw error;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId, selectedAddress, amount],
  );

  // The order was placed on the server; mirror it into the app (active order, cart cleanup).
  const handlePaid = useCallback(
    async (view: AttemptStatusView) => {
      if (placedRef.current) return;
      placedRef.current = true;
      holdIdRef.current = null;
      const result = view.fulfillment?.result;
      await applyPaidMedicineOrder({
        dispatch,
        storeId,
        storeName: pharmacyName,
        items: cartItemsRef.current,
        amount,
        address: selectedAddress,
        orderId: result?.orderId,
        orderNumber: result?.orderNumber,
        billData: billDetails,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeId, amount],
  );

  const payment = usePayment({ contextKey: `medicine:${storeId}`, createOrder, onSuccess: handlePaid, steps: STEPS });
  const { phase } = payment;

  // ---- what to do on arrival ------------------------------------------------------------
  // The method picked on the options screen (kept in memory only - it may be a card).
  const inputRef = useRef<MethodInput | null>(takePendingInput());
  const [resumeChecked, setResumeChecked] = useState(false);
  const startedRef = useRef(false);

  // 1. Pick up a payment that was already in flight (app closed, left while confirming).
  useEffect(() => {
    payment.resume().finally(() => setResumeChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nothing to pay with - hand over to the options list.
  const toOptions = useCallback(() => {
    navigation.replace('PaymentScreen', checkoutParams);
  }, [navigation, checkoutParams]);

  // 2. Start the method that was picked, or the saved one when we came from the cart's Pay button.
  useEffect(() => {
    if (!resumeChecked || startedRef.current) return;
    if (payment.phase !== 'idle') {
      startedRef.current = true; // a payment was already in flight - let it finish
      return;
    }
    if (inputRef.current) {
      startedRef.current = true;
      const input = inputRef.current;
      inputRef.current = null;
      payment.start(input);
      return;
    }
    if (resumeOnly || !autoPay) {
      startedRef.current = true;
      toOptions();
      return;
    }
    if (payment.configError) {
      startedRef.current = true;
      toOptions();
      return;
    }
    if (!payment.config || !payment.appsLoaded) return; // wait for the methods + installed apps

    startedRef.current = true;
    const saved = payment.lastMethod;
    switch (saved?.method) {
      case 'cod':
        if (!isCheckoutPaused) {
          navigation.replace('VerifyingOrder', { ...checkoutParams, paymentMethod: 'cod' });
          return;
        }
        break;
      case 'upi_intent': {
        const app = payment.upiApps.find((a) => a.id === saved.refId);
        if (app) {
          payment.start({ method: 'upi_intent', app });
          return;
        }
        break;
      }
      case 'upi_collect':
        if (saved.refId) {
          payment.start({ method: 'upi_collect', vpa: saved.refId });
          return;
        }
        break;
      case 'netbanking': {
        const bank = BANKS.find((b) => b.id === saved.refId);
        if (bank) {
          payment.start({ method: 'netbanking', bank });
          return;
        }
        break;
      }
      case 'wallet': {
        const wallet = WALLETS.find((w) => w.id === saved.refId);
        if (wallet) {
          payment.start({ method: 'wallet', wallet });
          return;
        }
        break;
      }
      default:
        break; // a card needs its details typed - the options list is shown
    }
    toOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeChecked, payment.config, payment.configError, payment.appsLoaded, payment.lastMethod, payment.phase]);

  // ---- leaving ---------------------------------------------------------------------------
  const releaseHold = useCallback(() => {
    if (holdIdRef.current && !placedRef.current) {
      releaseCheckoutHold(holdIdRef.current, 'cancelled');
      holdIdRef.current = null;
    }
  }, []);

  // Back always returns to the screen we came from - the cart when Pay was tapped there, the options list
  // when a method was picked there. After a problem the stock hold taken for that try is freed first.
  const backAfterProblem = useCallback(() => {
    releaseHold();
    navigation.goBack();
  }, [navigation, releaseHold]);

  // While money may be moving (confirming / pending) leaving is safe: the server finishes the order and the
  // cart settles it next time it is opened. The hold is deliberately kept.
  const leaveWhileConfirming = useCallback(() => navigation.goBack(), [navigation]);

  const onBack = phase === 'failed' ? backAfterProblem : phase === 'verifying' || phase === 'pending' ? leaveWhileConfirming : undefined;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'success') {
        navigation.replace('LiveTracking');
        return true;
      }
      if (onBack) onBack();
      return true; // never fall through while a payment is in progress
    });
    return () => sub.remove();
  }, [navigation, onBack, phase]);

  // The next step for a problem that retrying will not fix.
  const issueKind = payment.error?.kind;
  const onFix = () => {
    releaseHold();
    navigation.popToTop();
    if (issueKind === 'address') setTimeout(() => navigation.navigate('AddressBookModal'), 0);
  };
  const fixLabel = issueKind === 'address' ? 'Choose address' : 'Back to cart';

  const result = payment.view?.fulfillment?.result;
  const waiting = phase === 'idle'; // deciding what to start - show the processing steps, never a blank screen

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <PaymentProgressView
        phase={waiting ? 'creating_attempt' : phase}
        onBack={phase === 'failed' ? onBack : undefined}
        steps={payment.steps}
        completedSteps={payment.completedSteps}
        issue={payment.error}
        onRetry={payment.retry}
        onFix={onFix}
        fixLabel={fixLabel}
        onLeave={leaveWhileConfirming}
        successTitle="Order placed successfully"
        successSubtitle={`Your medicine order from ${pharmacyName} has been accepted and is being processed.`}
        receipt={result?.orderNumber ? [{ label: 'Order ID', value: result.orderNumber }] : []}
        primaryLabel="Track order live"
        onPrimary={() => navigation.replace('LiveTracking')}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
  });
