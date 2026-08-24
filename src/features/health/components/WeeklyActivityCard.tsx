import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ChevronRight, Footprints } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getStepsRange, isStepsTrackingEnabled, StepsRangeData } from '../../../services/health/healthConnectStepsService';
import { HealthSection } from './HealthSection';
import { StepsBarChart } from './StepsBarChart';

export function WeeklyActivityCard() {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<StepsRangeData | null>(null);
  // null = still loading the very first time, undefined-style tri-state
  // kept as a separate flag so a background refresh on refocus doesn't
  // blank out an already-loaded chart.
  const [trackingEnabled, setTrackingEnabled] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const enabled = await isStepsTrackingEnabled();
        if (cancelled) return;
        setTrackingEnabled(enabled);
        if (!enabled) return;

        const result = await getStepsRange('week');
        if (!cancelled) setData(result);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleViewAll = () => navigation.navigate('ActivityHistory');
  const handleEnable = () => navigation.navigate('ManageGoals');

  return (
    <HealthSection title="Weekly Activity" icon={<Footprints size={14} color="#0FBBA1" />}>
      {trackingEnabled === false ? (
        <TouchableOpacity style={styles.emptyCard} activeOpacity={0.8} onPress={handleEnable}>
          <Text style={styles.emptyTitle}>Step tracking isn&apos;t enabled yet</Text>
          <Text style={styles.emptySubtitle}>Turn on the Steps goal to see your weekly activity chart here.</Text>
        </TouchableOpacity>
      ) : trackingEnabled === null || data === null ? (
        <View style={[styles.card, styles.loadingCard]}>
          <ActivityIndicator color="#0FBBA1" />
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.totalValue}>{data.total.toLocaleString()}</Text>
              <Text style={styles.totalLabel}>steps this week</Text>
            </View>
            <TouchableOpacity style={styles.viewAllLink} activeOpacity={0.7} onPress={handleViewAll}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color="#0FBBA1" />
            </TouchableOpacity>
          </View>
          <StepsBarChart buckets={data.buckets} highlightIndex={data.currentIndex} />
        </View>
      )}
    </HealthSection>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  loadingCard: {
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
  totalLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  viewAllLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 4,
  },
  viewAllText: { fontSize: 13, fontWeight: '700', color: '#0FBBA1' },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
});
