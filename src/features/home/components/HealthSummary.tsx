import { Activity, Heart, TrendingUp, Weight, PlusCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';
import { getLocalDateString } from '../../../utils/dateUtils';

interface Props {
  title?: string;
}

function HealthSummary({ title = 'HEALTH SUMMARY' }: Props) {
  const navigation = useNavigation<any>();

  const { records } = useSelector((state: RootState) => state.vitals);
  const { connectedDevice } = useSelector((state: RootState) => state.device);

  // This is meant to be a DAILY summary, not "whatever the most recent
  // reading ever was" - the old code just read records[0] for every
  // metric, so a heart rate logged three weeks ago kept showing up as if
  // it were current. Each metric now only counts if it was actually
  // logged today; otherwise it falls through to the "not logged today"
  // state below (a Log CTA) instead of silently displaying stale data.
  const todayStr = getLocalDateString();
  const latestToday = useMemo(
    () => records.find((r) => getLocalDateString(new Date(r.timestamp)) === todayStr),
    [records, todayStr]
  );

  const latestHeartRate = latestToday?.heartRate ?? (connectedDevice?.data?.heartRate !== undefined ? connectedDevice.data.heartRate : undefined);
  const latestSystolic = latestToday?.systolic;
  const latestDiastolic = latestToday?.diastolic;
  const latestWeight = latestToday?.weight;

  // Controls the header's "History" link and whether we show the full
  // empty-state placeholder (no vitals ever logged) vs. the per-metric
  // cards (some history exists, even if nothing is from today yet).
  const hasAnyVitals = records.length > 0 || connectedDevice?.data?.heartRate !== undefined;

  const handleNavigateToHealth = () => {
    navigation.navigate('Tabs', { screen: 'Health' });
  };

  const openHistory = (metric: 'heart_rate' | 'blood_pressure' | 'weight') => {
    navigation.navigate('VitalsHistory', { metric });
  };

  const logMetric = (metric: 'heart_rate' | 'blood_pressure' | 'weight') => {
    navigation.navigate('LogVitals', { focusMetric: metric });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('LogVitals')}>
            <Text style={styles.seeAll}>Log</Text>
          </TouchableOpacity>
          {hasAnyVitals && (
            <>
              <View style={styles.headerDot} />
              <TouchableOpacity onPress={() => navigation.navigate('VitalsHistory')}>
                <Text style={styles.seeAll}>History</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {!hasAnyVitals ? (
        <TouchableOpacity 
          style={styles.emptyPlaceholder}
          onPress={handleNavigateToHealth}
          activeOpacity={0.8}
        >
          <View style={styles.placeholderIconWrapper}>
            <PlusCircle size={28} color="#0FBBA1" />
          </View>
          <View style={styles.placeholderTextWrapper}>
            <Text style={styles.placeholderTitle}>Record Vitals</Text>
            <Text style={styles.placeholderDesc}>
              Log your heart rate, pressure, and weight to unlock trends and smart health insights.
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.row}>
          {/* Heart Rate */}
          <HealthCard
            info={{
              label: 'Heart Rate',
              value: latestHeartRate !== undefined ? `${latestHeartRate}` : undefined,
              unit: 'bpm',
              color: '#EF4444',
              bgColor: '#FEF2F2',
              icon: Heart
            }}
            onPress={latestHeartRate !== undefined ? () => openHistory('heart_rate') : () => logMetric('heart_rate')}
          />

          {/* BP */}
          <HealthCard
            info={{
              label: 'Blood Pressure',
              value: latestSystolic !== undefined && latestDiastolic !== undefined ? `${latestSystolic}/${latestDiastolic}` : undefined,
              unit: 'mmHg',
              color: '#3B82F6',
              bgColor: '#EFF6FF',
              icon: Activity
            }}
            onPress={latestSystolic !== undefined ? () => openHistory('blood_pressure') : () => logMetric('blood_pressure')}
          />

          {/* Weight */}
          <HealthCard
            info={{
              label: 'Weight',
              value: latestWeight !== undefined ? `${latestWeight}` : undefined,
              unit: 'kg',
              color: '#8B5CF6',
              bgColor: '#F5F3FF',
              icon: Weight
            }}
            onPress={latestWeight !== undefined ? () => openHistory('weight') : () => logMetric('weight')}
          />
        </View>
      )}
    </View>
  );
}

function HealthCard({ info, onPress }: any) {
  const Icon = info.icon;
  const hasTodayValue = info.value !== undefined;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: info.bgColor }]}>
        <Icon size={18} color={info.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{hasTodayValue ? info.value : '-'}</Text>
          {hasTodayValue && <Text style={styles.unit}>{info.unit}</Text>}
        </View>
        <Text style={styles.label} numberOfLines={1}>{info.label}</Text>
      </View>

      {hasTodayValue && (
        <View style={styles.trendIcon}>
          <TrendingUp size={12} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(HealthSummary);

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    // Matches SectionHeader.tsx's marginBottom (the shared header used by
    // most other feed cards) instead of a slightly smaller one-off value.
    marginBottom: 16,
  },
  title: {
    fontSize: 13,
    color: '#494949',
    letterSpacing: 2,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0FBBA1',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Clean light border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0, // Clean, zero elevation to avoid harsh Android shadows
    position: 'relative'
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  content: {},
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    flexWrap: 'wrap', // Handle long BP on small screens
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  unit: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 1,
  },
  label: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  trendIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.8
  },
  /* Placeholder Empty State */
  emptyPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Subtle slate border
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 0, // Clean, zero elevation to avoid harsh Android shadows
  },
  placeholderIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  placeholderTextWrapper: {
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  placeholderDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
