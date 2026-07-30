import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Activity, Bell, Flame, Heart } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { DeviceConnectCard } from './components/DeviceConnectCard';
import { GoalsCard } from './components/GoalsCard';
import { HealthHighlights } from './components/HealthHighlights';
import HealthNotificationsModal from './components/HealthNotificationsModal';
import { MedicationsSummary } from './components/MedicationsSummary';
import { TodaysFocus } from './components/TodaysFocus';
import { VitalsSnapshot } from './components/VitalsSnapshot';

// Modals
import AddGoalModal from '../../components/modals/AddGoalModal/AddGoalModal';

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { connectedDevice } = useSelector((state: RootState) => state.device);
  const { records } = useSelector((state: RootState) => state.vitals);

  const latestManual = records[0];
  const heartRate = latestManual?.heartRate ?? connectedDevice?.data?.heartRate ?? '--';
  const steps = connectedDevice?.data?.steps !== undefined ? connectedDevice.data.steps.toLocaleString() : '--';
  const calories = connectedDevice?.data?.calories !== undefined ? `${connectedDevice.data.calories}` : '--';

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Daily Check-in</Text>
          <Text style={styles.headerTitle}>My Health</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => setShowNotifications(true)}
          >
            <Bell size={22} color="#1F2937" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Activity Summary Row */}
        <View style={styles.activitySummary}>
          <SummaryCard
            icon={<Flame size={18} color="#EF4444" />}
            value={calories}
            unit="kcal"
            label="Burned"
            color="#FEF2F2"
          />
          <SummaryCard
            icon={<Activity size={18} color="#2FA561" />}
            value={steps}
            unit="steps"
            label="Steps"
            color="#F0FDF4"
          />
          <SummaryCard
            icon={<Heart size={18} color="#EF4444" />}
            value={heartRate !== '--' ? `${heartRate}` : '--'}
            unit="bpm"
            label="Heart Rate"
            color="#FEF2F2"
          />
        </View>

        <TodaysFocus />
        <MedicationsSummary />
        <GoalsCard onAddGoal={() => setShowAddGoal(true)} />
        <VitalsSnapshot />
        <HealthHighlights />
        <DeviceConnectCard />
      </ScrollView>

      {/* Modals */}
      <AddGoalModal
        visible={showAddGoal}
        onClose={() => setShowAddGoal(false)}
      />

      <HealthNotificationsModal
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </View>
  );
}

function SummaryCard({ icon, value, unit, label, color }: any) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: color }]}>
      <View style={styles.summaryIcon}>{icon}</View>
      <View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{value}</Text>
          <Text style={styles.summaryUnit}>{unit}</Text>
        </View>
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },

  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 }
    })
  },
  greeting: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#111827', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#F9FAFB'
  },

  activitySummary: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)'
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
  summaryUnit: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  summaryLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', marginTop: 2 }
});
