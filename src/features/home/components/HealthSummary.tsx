import { Activity, Heart, TrendingUp, Weight, PlusCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';

interface Props {
  title?: string;
}

function HealthSummary({ title = 'HEALTH SUMMARY' }: Props) {
  const navigation = useNavigation<any>();

  const { records } = useSelector((state: RootState) => state.vitals);
  const { connectedDevice } = useSelector((state: RootState) => state.device);

  const latestManual = records[0];
  const latestHeartRate = latestManual?.heartRate ?? connectedDevice?.data?.heartRate;
  const latestSystolic = latestManual?.systolic;
  const latestDiastolic = latestManual?.diastolic;
  const latestWeight = latestManual?.weight;

  const hasVitals = latestHeartRate !== undefined || latestSystolic !== undefined || latestWeight !== undefined;

  const handleNavigateToHealth = () => {
    navigation.navigate('Tabs', { screen: 'Health' });
  };

  const openHistory = (metric: 'heart_rate' | 'blood_pressure' | 'weight') => {
    navigation.navigate('VitalsHistory', { metric });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        {hasVitals && (
          <TouchableOpacity onPress={() => navigation.navigate('VitalsHistory')}>
            <Text style={styles.seeAll}>History</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hasVitals ? (
        <TouchableOpacity 
          style={styles.emptyPlaceholder}
          onPress={handleNavigateToHealth}
          activeOpacity={0.8}
        >
          <View style={styles.placeholderIconWrapper}>
            <PlusCircle size={28} color="#2FA561" />
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
              value: latestHeartRate !== undefined ? `${latestHeartRate}` : '--',
              unit: 'bpm',
              color: '#EF4444',
              bgColor: '#FEF2F2',
              icon: Heart
            }}
            onPress={() => openHistory('heart_rate')}
          />

          {/* BP */}
          <HealthCard
            info={{
              label: 'Blood Pressure',
              value: latestSystolic !== undefined && latestDiastolic !== undefined ? `${latestSystolic}/${latestDiastolic}` : '--',
              unit: 'mmHg',
              color: '#3B82F6',
              bgColor: '#EFF6FF',
              icon: Activity
            }}
            onPress={() => openHistory('blood_pressure')}
          />

          {/* Weight */}
          <HealthCard
            info={{
              label: 'Weight',
              value: latestWeight !== undefined ? `${latestWeight}` : '--',
              unit: 'kg',
              color: '#8B5CF6',
              bgColor: '#F5F3FF',
              icon: Weight
            }}
            onPress={() => openHistory('weight')}
          />
        </View>
      )}
    </View>
  );
}

function HealthCard({ info, onPress }: any) {
  const Icon = info.icon;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: info.bgColor }]}>
        <Icon size={18} color={info.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{info.value}</Text>
          <Text style={styles.unit}>{info.unit}</Text>
        </View>
        <Text style={styles.label} numberOfLines={1}>{info.label}</Text>
      </View>

      <View style={styles.trendIcon}>
        <TrendingUp size={12} color="#10B981" />
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(HealthSummary);

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    fontSize: 13,
    color: '#494949',
    letterSpacing: 2,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2FA561',
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
