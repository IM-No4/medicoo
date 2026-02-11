import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '@/src/components/icons/AppIcon';

export default function LabDetailScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();

  const { labId } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-left" size={22} color='#6B7280' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.labName}>
          Dr. Lal PathLabs
        </Text>

        <Text style={styles.description}>
          Home sample collection • Same day reports •
          Certified labs
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available Tests</Text>
          <Text style={styles.infoValue}>2000+</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Report Time</Text>
          <Text style={styles.infoValue}>24 hrs</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.bookButton}
          onPress={() => {
            // future: navigate to test selection
          }}
        >
          <Text style={styles.bookText}>Book Lab Test</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  content: {
    padding: 16,
  },

  labName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  infoLabel: {
    fontSize: 14,
    color: '#374151',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  bookButton: {
    marginTop: 32,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  bookText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
