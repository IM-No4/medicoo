import { Activity, Heart, TrendingUp, Weight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  title?: string;
}

function HealthSummary({ title = 'HEALTH SUMMARY' }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        {/* Heart Rate */}
        <HealthCard
          info={{
            label: 'Heart Rate',
            value: '72',
            unit: 'bpm',
            color: '#EF4444',
            bgColor: '#FEF2F2',
            icon: Heart
          }}
        />

        {/* BP */}
        <HealthCard
          info={{
            label: 'Blood Pressure',
            value: '118/76',
            unit: 'mmHg',
            color: '#3B82F6',
            bgColor: '#EFF6FF',
            icon: Activity
          }}
        />

        {/* Weight */}
        <HealthCard
          info={{
            label: 'Weight',
            value: '72.5',
            unit: 'kg',
            color: '#10B981',
            bgColor: '#ECFDF5',
            icon: Weight
          }}
        />
      </View>
    </View>
  );
}

function HealthCard({ info }: any) {
  const Icon = info.icon;
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
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
    color: '#3B82F6',
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
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    fontWeight: '700',
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
    fontWeight: '500',
    marginTop: 2,
  },
  trendIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.8
  }
});
