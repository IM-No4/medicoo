import React, { useCallback, useEffect, useMemo } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { createPaymentOrder } from '../../payments/api';
import { usePayment } from '../../payments/usePayment';
import PaymentOptionsView from '../../payments/ui/PaymentOptionsView';
import PaymentHeader from '../../payments/ui/PaymentHeader';
import PaymentProgressView from '../../payments/ui/PaymentProgressView';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { Modal } from '../ThemedModal';

interface Props {
  visible: boolean;
  /** The appointment request being paid for. */
  requestId: string;
  amount: number;
  /** Payment confirmed and the appointment is now paid (done by the server). */
  onPaid: () => void;
  /** Leave without paying (or after the "confirming" notice). */
  onClose: () => void;
}

const formatPrice = (amount: number): string => {
  const parts = amount.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

// The same Swiggy-style payment screen as the cart, for consultation fees.
// Gateway-agnostic (see src/payments/): the backend decides who takes the
// payment and marks the appointment paid itself once it is confirmed.
export default function PaymentMethodsModal({ visible, requestId, amount, onPaid, onClose }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const createOrder = useCallback(async () => {
    try {
      const order = await createPaymentOrder({ purpose: 'appointment', referenceId: requestId });
      return order as { orderId: string } | { free: true };
    } catch (e: any) {
      // Say what kind of problem it is, so the progress screen can explain it calmly.
      throw Object.assign(e, { kind: e?.response ? 'order' : 'network' });
    }
  }, [requestId]);

  const payment = usePayment({
    contextKey: `appointment:${requestId}`,
    createOrder,
    steps: ['Checking your appointment', 'Securing your payment'],
    onSuccess: () => {
      // Give the tick a moment, then let the screen refresh itself.
      setTimeout(onPaid, 1200);
    },
    onFree: () => setTimeout(onPaid, 600),
  });
  const { phase } = payment;

  useEffect(() => {
    if (visible) payment.resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Leaving is safe while confirming (the server finishes the appointment); not while the payment is being started.
  const onProgressBack = phase === 'failed' ? payment.backToOptions : phase === 'verifying' || phase === 'pending' ? onClose : undefined;

  useEffect(() => {
    if (!visible) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'idle') onClose();
      else if (onProgressBack) onProgressBack();
      return true;
    });
    return () => sub.remove();
  }, [visible, phase, onClose, onProgressBack]);

  const inProgress = phase !== 'idle';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => (phase === 'idle' ? onClose() : onProgressBack?.())}>
      {inProgress ? (
        <PaymentProgressView
          phase={phase}
          onBack={phase === 'success' ? onClose : onProgressBack}
          steps={payment.steps}
          completedSteps={payment.completedSteps}
          issue={payment.error}
          onRetry={payment.retry}
          onFix={onClose}
          fixLabel="Go back"
          onLeave={onClose}
          successTitle="Payment confirmed"
          successSubtitle="Your appointment is now confirmed. Chat and call will unlock shortly."
        />
      ) : (
        <View style={styles.container}>
          <PaymentHeader title="Payment options" subtitle={`Total: ₹${formatPrice(amount)}`} onBack={onClose} />
          <PaymentOptionsView payment={payment} amountPaise={Math.round(amount * 100)} />
        </View>
      )}
    </Modal>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
  });
