import { useNavigation } from '@react-navigation/native';
import { Activity, Plus, TrendingUp, Weight } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import RecordVitalsModal from '../../../components/modals/RecordVitalsModal';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';

export function VitalsSnapshot() {
  const navigation = useNavigation<any>();
  const { records } = useSelector((state: RootState) => state.vitals);

  const [modalVisible, setModalVisible] = useState(false);

  // Find latest recorded vitals. Heart Rate and Temperature are shown
  // higher up on this screen already (the ring, and the summary row), so
  // this snapshot only covers the two vitals that aren't shown anywhere
  // else - showing them again here would just be the same number twice.
  const latestManual = records[0];
  const latestSystolic = latestManual?.systolic;
  const latestDiastolic = latestManual?.diastolic;
  const latestWeight = latestManual?.weight;

  const openHistory = (metric: 'weight' | 'blood_pressure') => {
    navigation.navigate('VitalsHistory', { metric });
  };

  return (
    <HealthSection
      title="Vitals Snapshot"
      icon={
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Plus size={12} color="#0FBBA1" style={{ marginRight: 2 }} />
            <Text style={styles.headerActionBtnText}>Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => navigation.navigate('VitalsHistory')}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.vitalsContainer}>
        <View style={styles.topRow}>
          {/* Weight */}
          <VitalCard
            label="Weight"
            value={latestWeight !== undefined ? `${latestWeight}` : '--'}
            unit="KG"
            icon={<Weight size={16} color="#8B5CF6" />}
            bgColor="#F5F3FF"
            onPress={() => openHistory('weight')}
          />

          {/* Blood Pressure */}
          <VitalCard
            label="Blood Pressure"
            value={latestSystolic !== undefined && latestDiastolic !== undefined ? `${latestSystolic}/${latestDiastolic}` : '--'}
            unit="mmHg"
            icon={<Activity size={16} color="#3B82F6" />}
            bgColor="#EFF6FF"
            onPress={() => openHistory('blood_pressure')}
          />
        </View>
      </View>

      <RecordVitalsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </HealthSection>
  );
}

function VitalCard({ label, value, unit, icon, bgColor, onPress }: any) {
  return (
    <TouchableOpacity
      style={styles.vitalCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.vitalTop}>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        {value !== '--' && <TrendingUp size={14} color="#10B981" />}
      </View>
      <View style={styles.vitalBottom}>
        <View style={styles.valueRow}>
          <Text style={styles.vitalValue}>{value}</Text>
          <Text style={styles.vitalUnit}>{unit}</Text>
        </View>
        <Text style={styles.vitalLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerActionsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  headerActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0FBBA1',
    textTransform: 'uppercase',
  },
  vitalsContainer: {
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  vitalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalBottom: {
    gap: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  vitalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  vitalUnit: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vitalLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
});
