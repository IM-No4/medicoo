import React, { useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Check, ChevronLeft, Clock, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import type { Phase, PaymentIssue } from '../usePayment';

interface Props {
  phase: Phase;
  /** Checks done before the payment starts, and how many are finished. */
  steps: string[];
  completedSteps: number;
  /** Set when phase is 'failed'. */
  issue: PaymentIssue | null;
  /** Back arrow + "Back" at the top left. Missing = leaving is not safe right now, so it is hidden. */
  onBack?: () => void;
  onRetry?: () => void;
  /** Where the fix for a cart/address/prescription problem lives. */
  onFix?: () => void;
  fixLabel?: string;
  /** Leave while the payment keeps being confirmed in the background. */
  onLeave?: () => void;
  /** Success. */
  successTitle?: string;
  successSubtitle?: string;
  receipt?: { label: string; value: string }[];
  primaryLabel?: string;
  onPrimary?: () => void;
}

// Everything between "the customer tapped Pay" and "it is settled", on a plain
// screen: just a back arrow at the top left and one centred message - no header
// bar, no cards, no repeated address or price. A problem is explained in plain
// words with clear next steps, never a red banner.
export default function PaymentProgressView({
  phase,
  steps,
  completedSteps,
  issue,
  onBack,
  onRetry,
  onFix,
  fixLabel = 'Back to cart',
  onLeave,
  successTitle,
  successSubtitle,
  receipt,
  primaryLabel,
  onPrimary,
}: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const Button = ({ label, onPress }: { label: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.buttonText}>{label.toUpperCase()}</Text>
    </TouchableOpacity>
  );

  const body = (() => {
    if (phase === 'success') {
      return (
        <>
          <View style={[styles.badge, { backgroundColor: theme.successBg }]}>
            <View style={styles.tick}>
              <Check size={30} color="#FFFFFF" strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.title}>{successTitle || 'Payment successful'}</Text>
          {!!successSubtitle && <Text style={styles.subtitle}>{successSubtitle}</Text>}
          {!!receipt?.length && (
            <View style={styles.receipt}>
              {receipt.map((r) => (
                <Text key={r.label} style={styles.receiptLine}>
                  {r.label}: <Text style={styles.receiptValue}>{r.value}</Text>
                </Text>
              ))}
            </View>
          )}
          {!!primaryLabel && <Button label={primaryLabel} onPress={onPrimary} />}
        </>
      );
    }

    if (phase === 'failed' && issue) {
      const fixable = !issue.retryable && issue.kind !== 'payment' && issue.kind !== 'network';
      return (
        <>
          <View style={[styles.badge, { backgroundColor: theme.warningBg }]}>
            <Info size={28} color="#D97706" />
          </View>
          <Text style={styles.title}>{issue.title}</Text>
          <Text style={styles.subtitle}>{issue.message}</Text>
          {issue.retryable && !!onRetry && <Button label="Try again" onPress={onRetry} />}
          {fixable && !!onFix && <Button label={fixLabel} onPress={onFix} />}
        </>
      );
    }

    if (phase === 'pending') {
      return (
        <>
          <View style={[styles.badge, { backgroundColor: theme.warningBg }]}>
            <Clock size={28} color="#D97706" />
          </View>
          <Text style={styles.title}>We're confirming your payment</Text>
          <Text style={styles.subtitle}>
            This is taking a little longer than usual. You'll be notified as soon as it is confirmed, and any money that was debited will be refunded automatically if it fails.
          </Text>
          {!!onLeave && <Button label="Got it" onPress={onLeave} />}
        </>
      );
    }

    if (phase === 'verifying') {
      return (
        <>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.title}>Confirming your payment</Text>
          <Text style={styles.subtitle}>This only takes a moment. Please don't close the app.</Text>
        </>
      );
    }

    if (phase === 'awaiting_user') {
      return (
        <>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.title}>Complete your payment</Text>
          <Text style={styles.subtitle}>Finish paying in the window that just opened. We'll continue here automatically.</Text>
        </>
      );
    }

    // processing: one line saying what is being checked right now
    const current = steps[Math.min(completedSteps, steps.length - 1)] || '';
    return (
      <>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.title}>Processing</Text>
        {!!current && <Text style={styles.subtitle}>{current}…</Text>}
      </>
    );
  })();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        {onBack ? (
          <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 24 }}>
            <ChevronLeft size={22} color={theme.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backRow} />
        )}
      </View>
      <View style={styles.center}>{body}</View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    topBar: { paddingHorizontal: 16, paddingBottom: 8 },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 40, marginLeft: -6 },
    backText: { fontSize: 16, fontWeight: '600', color: c.text },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 72, gap: 10 },
    badge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    tick: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: c.text, textAlign: 'center', marginTop: 8 },
    subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21 },
    receipt: { alignItems: 'center', gap: 4, marginTop: 8 },
    receiptLine: { fontSize: 13, color: c.textSecondary, textAlign: 'center' },
    receiptValue: { fontWeight: '700', color: c.text },
    button: { minWidth: 200, height: 48, paddingHorizontal: 28, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  });
