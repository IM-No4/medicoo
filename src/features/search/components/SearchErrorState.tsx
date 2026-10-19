import AppIcon from '@/src/components/icons/AppIcon';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

type Props = {
  message?: string;
  onRetry: () => void;
};

export default function SearchErrorState({
  message,
  onRetry,
}: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      <AppIcon name="alert-triangle" size={36} color="#F59E0B" />

      <Text style={styles.title}>
        {t('something_went_wrong')}
      </Text>

      <Text style={styles.subtitle}>
        {message || 'Unable to fetch search results'}
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.85}
      >
        <Text style={styles.retryText}>{t('retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  subtitle: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.cardSecondary,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
});
