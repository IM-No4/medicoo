import { executeAction } from '@/src/actions/ActionExecutor';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  query: string;
};

type Suggestion = {
  label: string;
  action: () => void;
};

function buildSuggestions(query: string): Suggestion[] {
  const q = query.toLowerCase();

  if (q.includes('doc') || q.includes('derma') || q.includes('cardio')) {
    return [
      {
        label: 'Browse Doctors',
        action: () => executeAction('OPEN_DOCTOR_LIST'),
      },
    ];
  }

  if (q.includes('med') || q.includes('tab') || q.includes('cap') || q.includes('para')) {
    return [
      {
        label: 'Find Pharmacies',
        action: () => executeAction('OPEN_PHARMACY_LIST'),
      },
    ];
  }

  if (q.includes('lab') || q.includes('test') || q.includes('blood')) {
    return [
      {
        label: 'Browse Lab Tests',
        action: () => executeAction('OPEN_LAB_TESTS'),
      },
    ];
  }

  return [
    {
      label: 'Browse Doctors',
      action: () => executeAction('OPEN_DOCTOR_LIST'),
    },
    {
      label: 'Find Pharmacies',
      action: () => executeAction('OPEN_PHARMACY_LIST'),
    },
    {
      label: 'Browse Lab Tests',
      action: () => executeAction('OPEN_LAB_TESTS'),
    },
  ];
}

export default function SearchSuggestions({ query }: Props) {
  const suggestions = useMemo(
    () => buildSuggestions(query),
    [query]
  );

  if (!query.trim()) return null;

  return (
    <View style={styles.wrap}>
      {suggestions.map((s) => (
        <TouchableOpacity
          key={s.label}
          style={styles.chip}
          onPress={s.action}
          activeOpacity={0.85}
        >
          <Text style={styles.text}>{s.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
});
