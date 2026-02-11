import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '@/src/components/icons/AppIcon';

const HOSPITALS = [
  {
    id: 'h1',
    name: 'Apollo Hospitals',
    subtitle: 'Multi-specialty • Emergency 24/7',
    distance: '2.3 km',
  },
  {
    id: 'h2',
    name: 'Fortis Hospital',
    subtitle: 'Cardiology • Neurology',
    distance: '3.8 km',
  },
];

export default function HospitalListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hospitals</Text>
      </View>

      <FlatList
        data={HOSPITALS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate('HospitalDetail', {
                hospitalId: item.id,
              })
            }
          >
            <View style={styles.iconWrapper}>
              <AppIcon name="hospital" size={20} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>
                {item.subtitle}
              </Text>
              <Text style={styles.distance}>
                {item.distance} away
              </Text>
            </View>

            <AppIcon
              name="chevron-right"
              size={18}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
      />
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  distance: {
    marginTop: 6,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
});
