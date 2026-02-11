import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CATEGORIES = [
  { id: 'doctors', label: 'Doctors', icon: 'stethoscope' },
  { id: 'medicines', label: 'Medicines', icon: 'pill' },
  { id: 'labs', label: 'Labs', icon: 'flask' },
  { id: 'services', label: 'Services', icon: 'grid' },
];

export default function SearchCategories() {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Browse by category</Text>

      <View style={styles.row}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity key={item.id} style={styles.card}>
            <AppIcon name={item.icon} size={22} color="#1a998e" />
            <Text style={styles.label}>{item.label}</Text>
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F0FDF9',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
});
