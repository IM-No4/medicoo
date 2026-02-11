import { executeAction } from '@/src/actions/ActionExecutor';
import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const suggestions = getSuggestions(query);

  return (
    <View style={styles.container}>
      <AppIcon name="search" size={36} color="#9CA3AF" />

      <Text style={styles.title}>
        No results for “{query}”
      </Text>

      <Text style={styles.subtitle}>
        Try one of these instead
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

const styles = StyleSheet.create({
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
    color: '#374151',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
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
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});
