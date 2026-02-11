import AppIcon from '@/src/components/icons/AppIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  message?: string;
  onRetry: () => void;
};

export default function SearchErrorState({
  message,
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <AppIcon name="alert-triangle" size={36} color="#F59E0B" />

      <Text style={styles.title}>
        Something went wrong
      </Text>

      <Text style={styles.subtitle}>
        {message || 'Unable to fetch search results'}
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        activeOpacity={0.85}
      >
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#374151',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});
