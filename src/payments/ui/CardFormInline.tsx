import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { NetworkLogo } from './BrandIcon';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import {
  CardErrors,
  CardForm,
  cvvLength,
  detectNetwork,
  formatExpiry,
  formatNumber,
} from '../cardUtils';

interface Props {
  value: CardForm;
  errors: CardErrors;
  disabled?: boolean;
  onChange: (next: CardForm) => void;
}

// Our own card form (never a gateway's): network detection while typing, Luhn
// and expiry validation (see cardUtils.ts). Card details live only in this
// component's state and are handed straight to the SDK - never stored or logged.
export default function CardFormInline({ value, errors, disabled, onChange }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const nameRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const network = detectNetwork(value.number);

  return (
    <View style={styles.wrap}>
      <View style={[styles.field, errors.number && styles.fieldError]}>
        <CreditCard size={18} color={theme.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Card number"
          placeholderTextColor={theme.textMuted}
          keyboardType="number-pad"
          value={value.number}
          editable={!disabled}
          onChangeText={(t) => {
            const next = formatNumber(t);
            onChange({ ...value, number: next });
            // jump on once the number is complete
            const max = network === 'amex' ? 17 : 19;
            if (next.length >= max) nameRef.current?.focus();
          }}
          maxLength={19}
          autoComplete="cc-number"
          textContentType="creditCardNumber"
          importantForAutofill="no"
        />
        {network !== 'unknown' ? <NetworkLogo network={network} height={20} /> : null}
      </View>
      {!!errors.number && <Text style={styles.error}>{errors.number}</Text>}

      <View style={[styles.field, errors.name && styles.fieldError]}>
        <TextInput
          ref={nameRef}
          style={styles.input}
          placeholder="Name on card"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          value={value.name}
          editable={!disabled}
          onChangeText={(t) => onChange({ ...value, name: t })}
          onSubmitEditing={() => expiryRef.current?.focus()}
          returnKeyType="next"
          maxLength={60}
          importantForAutofill="no"
        />
      </View>
      {!!errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <View style={[styles.field, errors.expiry && styles.fieldError]}>
            <TextInput
              ref={expiryRef}
              style={styles.input}
              placeholder="MM/YY"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              value={value.expiry}
              editable={!disabled}
              onChangeText={(t) => {
                const next = formatExpiry(t);
                onChange({ ...value, expiry: next });
                if (next.length === 5) cvvRef.current?.focus();
              }}
              maxLength={5}
              importantForAutofill="no"
            />
          </View>
          {!!errors.expiry && <Text style={styles.error}>{errors.expiry}</Text>}
        </View>
        <View style={styles.rowItem}>
          <View style={[styles.field, errors.cvv && styles.fieldError]}>
            <TextInput
              ref={cvvRef}
              style={styles.input}
              placeholder="CVV"
              placeholderTextColor={theme.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              value={value.cvv}
              editable={!disabled}
              onChangeText={(t) => onChange({ ...value, cvv: t.replace(/\D/g, '').slice(0, cvvLength(network)) })}
              maxLength={cvvLength(network)}
              importantForAutofill="no"
            />
          </View>
          {!!errors.cvv && <Text style={styles.error}>{errors.cvv}</Text>}
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 8 },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.inputBorder,
      backgroundColor: c.inputBg,
      paddingHorizontal: 12,
    },
    fieldError: { borderColor: c.error },
    input: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 0 },
    network: { fontSize: 11, fontWeight: '800', color: c.textSecondary },
    row: { flexDirection: 'row', gap: 10 },
    rowItem: { flex: 1 },
    error: { fontSize: 12, color: c.error, marginTop: -2 },
  });
