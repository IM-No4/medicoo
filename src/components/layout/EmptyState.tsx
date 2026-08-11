import { CalendarClock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  title: string;
  message: string;
  icon?: typeof CalendarClock;
  iconColor?: string;
  iconBg?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  icon: Icon = CalendarClock,
  iconColor = '#2FA561',
  iconBg = '#EAFBF3',
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Icon size={28} color={iconColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.8}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    alignItems: 'center',
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#151517',
    marginBottom: 6,
  },

  message: {
    fontSize: 14,
    color: '#151517',
    opacity: 0.6,
    textAlign: 'center',
  },

  actionButton: {
    marginTop: 20,
    backgroundColor: '#2FA561',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
