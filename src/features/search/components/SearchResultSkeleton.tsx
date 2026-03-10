import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppIcon from '@/src/components/icons/AppIcon';

export default function SearchResultSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AppIcon name="search" size={48} color="#10B981" />
      </View>
      <Text style={styles.title}>Searching nearby...</Text>
      <Text style={styles.subtitle}>Looking for medicines, pharmacies, and tests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 60,
  },
  iconContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinnerContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
