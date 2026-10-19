import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

function getSuggestions(query: string) {
  const q = query.toLowerCase();

  if (
    q.includes('doctor') ||
    q.includes('derma') ||
    q.includes('cardio')
  ) {
    return [
      {
        label: 'Browse doctors',
        action: () => executeAction('OPEN_DOCTOR_LIST'),
      },
    ];
  }

  if (
    q.includes('med') ||
    q.includes('tablet') ||
    q.includes('capsule') ||
    q.includes('para')
  ) {
    return [
      {
        label: 'Find pharmacies',
        action: () => executeAction('OPEN_PHARMACY_LIST'),
      },
    ];
  }

  if (
    q.includes('lab') ||
    q.includes('test') ||
    q.includes('blood')
  ) {
    return [
      {
        label: 'Browse lab tests',
        action: () => executeAction('OPEN_LAB_TESTS'),
      },
    ];
  }

  // Safe default
  return [
    {
      label: 'Browse doctors',
      action: () => executeAction('OPEN_DOCTOR_LIST'),
    },
    {
      label: 'Find pharmacies',
      action: () => executeAction('OPEN_PHARMACY_LIST'),
    },
  ];
}

export default function SearchEmptyState({ query }: { query: string }) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const suggestions = getSuggestions(query);

  return (
    <View style={styles.container}>
      <AppIcon name="search" size={36} color={theme.textMuted} />

      <Text style={styles.title}>
        No results for “{query}”
      </Text>

      <Text style={styles.subtitle}>
        {t('try_one_of_these_instead')}
      </Text>

      <View style={styles.actions}>
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.action}
            onPress={s.action}
          >
            <Text style={styles.actionText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
  },
  actions: {
    marginTop: 16,
    width: '100%',
    gap: 10,
  },
  action: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: c.cardSecondary,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
});
