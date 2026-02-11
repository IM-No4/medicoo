import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '@/src/components/icons/AppIcon';

/* Mock – replace with API */
const PROVIDERS = [
  {
    id: 'a1',
    name: 'City Emergency Ambulance',
    phone: '+919876543210',
    eta: '8–10 min',
  },
  {
    id: 'a2',
    name: 'Rapid Care Ambulance',
    phone: '+918888888888',
    eta: '12–15 min',
  },
];

export default function AmbulanceScreen() {
  const insets = useSafeAreaInsets();

  const primaryProvider = PROVIDERS[0];

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ambulance</Text>
      </View>

      {/* Emergency Card */}
      <View style={styles.emergencyCard}>
        <AppIcon name="ambulance" size={36} color="#DC2626" />
        <Text style={styles.emergencyTitle}>
          Emergency Assistance
        </Text>
        <Text style={styles.emergencyText}>
          Call nearest ambulance immediately
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.callButton}
          onPress={() =>
            callNumber(primaryProvider.phone)
          }
        >
          <Text style={styles.callText}>
            Call Now • {primaryProvider.eta}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Providers */}
      <Text style={styles.sectionTitle}>
        Nearby Ambulance Providers
      </Text>

      {PROVIDERS.map((p) => (
        <TouchableOpacity
          key={p.id}
          activeOpacity={0.85}
          style={styles.providerCard}
          onPress={() => callNumber(p.phone)}
        >
          <View>
            <Text style={styles.providerName}>
              {p.name}
            </Text>
            <Text style={styles.providerEta}>
              ETA {p.eta}
            </Text>
          </View>

          <AppIcon
            name="phone"
            size={18}
            color="#2563EB"
          />
        </TouchableOpacity>
      ))}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Medicoo connects you with nearby private ambulance
        services. Availability and response time may vary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },

  header: {
    height: 56,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  emergencyCard: {
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },

  emergencyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#7F1D1D',
  },

  emergencyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#991B1B',
    textAlign: 'center',
  },

  callButton: {
    marginTop: 16,
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
  },

  callText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  providerCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  providerEta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },

  disclaimer: {
    marginTop: 24,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
