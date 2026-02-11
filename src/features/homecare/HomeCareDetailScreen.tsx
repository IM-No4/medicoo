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

export default function HomeCareDetailScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();

  const { serviceId } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppIcon name="arrow-left" size={22} color='#6B7280' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Service Details
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>
          Home Nursing Care
        </Text>

        <Text style={styles.description}>
          Certified professionals providing medical care
          at your home including injections, wound care,
          post-surgery support, and monitoring.
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Availability
          </Text>
          <Text style={styles.infoValue}>
            7 days a week
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>
            Starting from
          </Text>
          <Text style={styles.infoValue}>
            ₹499 / visit
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.requestButton}
          onPress={() => {
            // future: request form / call / chat
          }}
        >
          <Text style={styles.requestText}>
            Request Service
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

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

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
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

  requestButton: {
    marginTop: 32,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  requestText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
