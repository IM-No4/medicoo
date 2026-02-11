import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  items: string[];
  onSelect: (item: string) => void;
};

export default function RecentSearches({ items, onSelect }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Recent searches</Text>

      {items.map((item) => (
        <TouchableOpacity
          key={item}
          style={styles.row}
          onPress={() => onSelect(item)}
        >
          <AppIcon name="clock" size={16} color="#6B7280" />
          <Text style={styles.text}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    color: '#374151',
  },
});
