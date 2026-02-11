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

const LABS = [
  {
    id: 'lab1',
    name: 'Thyrocare Diagnostics',
    subtitle: 'NABL Certified • Home collection',
    rating: 4.5,
  },
  {
    id: 'lab2',
    name: 'Dr. Lal PathLabs',
    subtitle: '2000+ tests available',
    rating: 4.6,
  },
];

export default function LabListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Path Labs</Text>
      </View>

      <FlatList
        data={LABS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() =>
              navigation.navigate('LabDetail', {
                labId: item.id,
              })
            }
          >
            <View style={styles.iconWrapper}>
              <AppIcon name="flask" size={20} color="#2563EB" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>

              <View style={styles.ratingRow}>
                <AppIcon name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {item.rating}
                </Text>
              </View>
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
    backgroundColor: '#ECFDF5',
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

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },

  ratingText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
});
