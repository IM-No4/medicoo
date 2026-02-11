import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GenericResultCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.iconWrapper}>
        <AppIcon name={icon} size={18} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <AppIcon name="chevron-right" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6B7280',
  },
});
