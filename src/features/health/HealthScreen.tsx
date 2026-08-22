import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Activity, Bell, Flame, Thermometer } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../actions/ActionExecutor';
import { loadOnDeviceSteps, selectTodayCalories, selectTodaySteps } from '../../redux/slices/deviceSlice';
import { loadVitalRecords } from '../../redux/slices/vitalsSlice';
import { AppDispatch, RootState } from '../../redux/store';
import { watchLiveSteps } from '../../services/health/stepsService';
import { DeviceConnectCard } from './components/DeviceConnectCard';
import { GoalsCard } from './components/GoalsCard';
import { HealthHighlights } from './components/HealthHighlights';
import { HeartRateRing, isNormalHeartRate } from './components/HeartRateRing';
import { MedicationsSummary } from './components/MedicationsSummary';
import { VitalsSnapshot } from './components/VitalsSnapshot';
import { WeeklyActivityCard } from './components/WeeklyActivityCard';

export default function HealthScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const [isFocused, setIsFocused] = useState(false);
  // Android has no "steps since midnight" query without Health Connect (see
  // stepsService.ts), so with no wearable connected there's nothing for
  // selectTodaySteps to read - this is a live, session-only count from the
  // moment the screen was opened instead, kept deliberately separate from
  // todaySteps so it never gets written to a goal or a friends leaderboard
  // as if it were a real daily total.
  const [liveSteps, setLiveSteps] = useState<number | null>(null);
  // Tracks only pull-to-refresh gestures, separate from the focus-effect
  // loads below - same split used on the Calendar screen.
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const { connectedDevice, onDeviceSteps } = useSelector((state: RootState) => state.device);
  const { records } = useSelector((state: RootState) => state.vitals);
  const todaySteps = useSelector(selectTodaySteps);
  const todayCalories = useSelector(selectTodayCalories);
  const unreadNotificationCount = useSelector((state: RootState) => state.notifications.unreadCount);

  const latestManual = records[0];
  const heartRate = latestManual?.heartRate ?? connectedDevice?.data?.heartRate ?? '--';
  const heartRateNumeric = typeof heartRate === 'number' ? heartRate : (typeof heartRate === 'string' && heartRate !== '--' ? parseFloat(heartRate) : null);
  const hasHeartRateData = heartRateNumeric !== null && !isNaN(heartRateNumeric);
  const isLiveStepsFallback = Platform.OS === 'android' && !connectedDevice && onDeviceSteps === null;
  const hasStepsData = connectedDevice?.data?.steps !== undefined || onDeviceSteps !== null || (isLiveStepsFallback && liveSteps !== null);
  const steps = hasStepsData ? (isLiveStepsFallback ? liveSteps! : todaySteps).toLocaleString() : '--';
  const stepsLabel = isLiveStepsFallback && hasStepsData ? 'Steps (live)' : 'Steps';
  const calories = todayCalories !== null ? todayCalories.toLocaleString() : '--';
  const temperature = latestManual?.temperature !== undefined ? latestManual.temperature.toFixed(1) : '--';

  const stepsSubscriptionRef = useRef<{ remove: () => void } | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      dispatch(loadOnDeviceSteps());
      dispatch(loadVitalRecords());

      let cancelled = false;
      if (Platform.OS === 'android' && !connectedDevice) {
        setLiveSteps(null);
        watchLiveSteps((count) => setLiveSteps(count)).then((sub) => {
          // The screen may have already lost focus by the time this
          // promise resolves - don't leak a subscription past cleanup.
          if (cancelled) {
            sub?.remove();
          } else {
            stepsSubscriptionRef.current = sub;
          }
        });
      }

      return () => {
        setIsFocused(false);
        cancelled = true;
        stepsSubscriptionRef.current?.remove();
        stepsSubscriptionRef.current = null;
      };
    }, [dispatch, connectedDevice])
  );

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        dispatch(loadOnDeviceSteps()),
        dispatch(loadVitalRecords()),
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [dispatch]);

  return (
    <View style={styles.container}>
      {isFocused && (
        <StatusBar style="dark" translucent backgroundColor="transparent" />
      )}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={{ flex: 1 }}>
          {/* <Text style={styles.greeting}>Daily Check-in</Text> */}
          <Text style={styles.headerTitle}>My Health</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => executeAction('OPEN_NOTIFICATIONS')}
          >
            <Bell size={22} color="#1F2937" />
            {unreadNotificationCount > 0 && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Heart Rate Ring */}
        <TouchableOpacity
          style={styles.heartRateSection}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('VitalsHistory', { metric: 'heart_rate' })}
        >
          <HeartRateRing heartRate={hasHeartRateData ? heartRateNumeric : null} />
          <View style={styles.heartRateInfo}>
            <Text style={styles.heartRateLabel}>Heart Rate</Text>
            <Text style={styles.heartRateValue}>
              {hasHeartRateData ? `${heartRateNumeric} bpm` : '--'}
            </Text>
            {hasHeartRateData && (
              <View
                style={[
                  styles.heartRateStatusPill,
                  { backgroundColor: isNormalHeartRate(heartRateNumeric!) ? '#F0FDF4' : '#FFFBEB' },
                ]}
              >
                <View
                  style={[
                    styles.heartRateStatusDot,
                    { backgroundColor: isNormalHeartRate(heartRateNumeric!) ? '#2FA561' : '#F59E0B' },
                  ]}
                />
                <Text
                  style={[
                    styles.heartRateStatusText,
                    { color: isNormalHeartRate(heartRateNumeric!) ? '#2FA561' : '#B45309' },
                  ]}
                >
                  {isNormalHeartRate(heartRateNumeric!) ? 'Normal' : 'Outside normal range'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Activity Summary Row */}
        <View style={styles.activitySummary}>
          <SummaryCard
            icon={<Flame size={18} color="#EF4444" />}
            value={calories}
            unit="kcal"
            label="Calories"
            color="#FEF2F2"
          />
          <SummaryCard
            icon={<Activity size={18} color="#2FA561" />}
            value={steps}
            unit="steps"
            label={stepsLabel}
            color="#F0FDF4"
          />
          <SummaryCard
            icon={<Thermometer size={18} color="#0EA5E9" />}
            value={temperature}
            unit="°F"
            label="Temperature"
            color="#F0F9FF"
            onPress={() => navigation.navigate('VitalsHistory', { metric: 'temperature' })}
          />
        </View>

        <WeeklyActivityCard />

        <MedicationsSummary />
        <GoalsCard />
        <VitalsSnapshot />
        <HealthHighlights />
        <DeviceConnectCard />
      </ScrollView>
    </View>
  );
}

function SummaryCard({ icon, value, unit, label, color, onPress }: any) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container style={[styles.summaryCard]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.summaryIcon}>{icon}</View>
      <View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryValue}>{value}</Text>
          <Text style={styles.summaryUnit}>{unit}</Text>
        </View>
        <Text style={styles.summaryLabel} numberOfLines={1}>{label}</Text>
      </View>
    </Container>
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
    borderWidth: 1,
    borderColor: '#e5e7eb76',
  },
  greeting: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginTop: 4 },
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

  heartRateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 20,
  },
  heartRateInfo: {
    flex: 1,
    gap: 0,
  },
  heartRateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  heartRateValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  heartRateStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 2,
  },
  heartRateStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heartRateStatusText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderColor: '#e5e7eb76',
    backgroundColor: '#fff',
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
