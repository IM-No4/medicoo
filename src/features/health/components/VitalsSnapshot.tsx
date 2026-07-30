import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Activity, Heart, TrendingUp, Weight, Plus } from 'lucide-react-native';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';
import RecordVitalsModal from '../../../components/modals/RecordVitalsModal';
import HealthHistoryModal from '../../../components/modals/HealthHistoryModal';

export function VitalsSnapshot() {
  const { records } = useSelector((state: RootState) => state.vitals);
  const { connectedDevice } = useSelector((state: RootState) => state.device);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  // Find latest recorded vitals
  const latestManual = records[0];
  
  const latestHeartRate = latestManual?.heartRate ?? connectedDevice?.data?.heartRate;
  const latestSystolic = latestManual?.systolic;
  const latestDiastolic = latestManual?.diastolic;
  const latestWeight = latestManual?.weight;

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
            <Plus size={12} color="#2FA561" style={{ marginRight: 2 }} />
            <Text style={styles.headerActionBtnText}>Log</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerActionBtn} 
            onPress={() => setHistoryVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.headerActionBtnText}>History</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.vitalsContainer}>
        <View style={styles.topRow}>
          {/* Heart Rate */}
          <VitalCard
            label="Heart Rate"
            value={latestHeartRate !== undefined ? `${latestHeartRate}` : '--'}
            unit="BPM"
            icon={<Heart size={16} color="#EF4444" />}
            bgColor="#FEF2F2"
            onPress={() => setModalVisible(true)}
          />

          {/* Weight */}
          <VitalCard
            label="Weight"
            value={latestWeight !== undefined ? `${latestWeight}` : '--'}
            unit="KG"
            icon={<Weight size={16} color="#8B5CF6" />}
            bgColor="#F5F3FF"
            onPress={() => setModalVisible(true)}
          />
        </View>

        {/* Blood Pressure */}
        <VitalCard
          label="Blood Pressure"
          value={latestSystolic !== undefined && latestDiastolic !== undefined ? `${latestSystolic}/${latestDiastolic}` : '--'}
          unit="mmHg"
          icon={<Activity size={16} color="#3B82F6" />}
          bgColor="#EFF6FF"
          fullWidth
          onPress={() => setModalVisible(true)}
        />
      </View>

      <RecordVitalsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <HealthHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        records={records}
        connectedDeviceHeartRate={connectedDevice?.data?.heartRate}
      />
    </HealthSection>
  );
}

function VitalCard({ label, value, unit, icon, bgColor, fullWidth, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.vitalCard, fullWidth && styles.fullWidthCard]} 
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
    color: '#2FA561',
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
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  fullWidthCard: {
    width: '100%',
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
