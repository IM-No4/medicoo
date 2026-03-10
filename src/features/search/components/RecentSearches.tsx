import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  items: string[];
  onSelect: (item: string) => void;
  onClear: () => void;
};

export default function RecentSearches({ items, onSelect, onClear }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Recent searches</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bubbleContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.bubble}
            onPress={() => onSelect(item)}
          >
            <AppIcon name="clock" size={14} color="#6B7280" />
            <Text style={styles.bubbleText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EB6E25',
  },
  bubbleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  bubbleText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});
