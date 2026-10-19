import { Info } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MEDICAL_DISCLAIMER_SHORT_HEALTH, MEDICAL_DISCLAIMER_SHORT_MEDICATION } from '../constants/medicalDisclaimer';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/colors';

type Props = {
  // 'health' for vitals/steps/heart-rate/goals screens, 'medication' for
  // medication reminder/prescription screens - see medicalDisclaimer.ts
  // for the exact wording each renders.
  variant?: 'health' | 'medication';
  style?: ViewStyle;
};

// Shared, single-source-of-truth caption used on every health-tracking and
// medication/prescription screen per Google Play's Health Content and
// Services policy requirement - kept as one component (rather than each
// screen copy-pasting its own Text) so the wording and styling can only
// ever be changed in one place. Uses the app's existing secondary-caption
// convention (#9CA3AF at 11px) rather than introducing a new text style.
export default function MedicalDisclaimerNote({ variant = 'health', style }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const text = variant === 'medication' ? MEDICAL_DISCLAIMER_SHORT_MEDICATION : MEDICAL_DISCLAIMER_SHORT_HEALTH;

  return (
    <View style={[styles.container, style]}>
      <Info size={12} color={theme.textMuted} style={styles.icon} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 11,
    color: c.textMuted,
    lineHeight: 15,
  },
});
