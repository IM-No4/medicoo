import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { Activity, Bell, Flame, Thermometer } from 'lucide-react-native';
import React, { useCallback, useRef, useState, useMemo } from 'react';
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
import MedicalDisclaimerNote from '../../components/MedicalDisclaimerNote';
import { loadOnDeviceSteps, selectTodayCalories, selectTodaySteps } from '../../redux/slices/deviceSlice';
import { loadVitalRecords } from '../../redux/slices/vitalsSlice';
import { AppDispatch, RootState } from '../../redux/store';
import { watchLiveSteps } from '../../services/health/stepsService';
import { DeviceConnectCard } from './components/DeviceConnectCard';
import { FriendInvitesCard } from './components/FriendInvitesCard';
import { askForStepsAccessOnce } from './stepsAccess';
import { GoalsCard } from './components/GoalsCard';
import { HealthHighlights } from './components/HealthHighlights';
import { HeartRateRing, isNormalHeartRate } from './components/HeartRateRing';
import { MedicationsSummary } from './components/MedicationsSummary';
import { RelaxCard } from './components/RelaxCard';
import { VitalsSnapshot } from './components/VitalsSnapshot';
import { WeeklyActivityCard } from './components/WeeklyActivityCard';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

export default function HealthScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      // First time the Health screen shows up: explain and ask for step access (once). Not from a button in Manage Goals.
      askForStepsAccessOnce().then((asked) => { if (!asked) dispatch(loadOnDeviceSteps()); });
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
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <View style={{ flex: 1 }}>
          {/* <Text style={styles.greeting}>{t('daily_check_in')}</Text> */}
          <Text style={styles.headerTitle}>{t('my_health')}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            activeOpacity={0.7}
            onPress={() => executeAction('OPEN_NOTIFICATIONS')}
          >
            <Bell size={22} color={theme.text} />
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
        {/* Friends waiting for an answer (renders nothing when there are none) */}
        <FriendInvitesCard />

        {/* Heart Rate Ring */}
        <TouchableOpacity
          style={styles.heartRateSection}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('VitalsHistory', { metric: 'heart_rate' })}
        >
          <HeartRateRing heartRate={hasHeartRateData ? heartRateNumeric : null} />
          <View style={styles.heartRateInfo}>
            <Text style={styles.heartRateLabel}>{t('heart_rate')}</Text>
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
                    { backgroundColor: isNormalHeartRate(heartRateNumeric!) ? '#10B981' : '#F59E0B' },
                  ]}
                />
                <Text
                  style={[
                    styles.heartRateStatusText,
                    { color: isNormalHeartRate(heartRateNumeric!) ? '#10B981' : '#B45309' },
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
            label={t('calories')}
            color="#FEF2F2"
          />
          <SummaryCard
            icon={<Activity size={18} color="#10B981" />}
            value={steps}
            unit="steps"
            label={stepsLabel}
            color="#F0FDF4"
          />
          <SummaryCard
            icon={<Thermometer size={18} color="#0EA5E9" />}
            value={temperature}
            unit="°F"
            label={t('temperature')}
            color="#F0F9FF"
            onPress={() => navigation.navigate('VitalsHistory', { metric: 'temperature' })}
          />
        </View>

        <MedicalDisclaimerNote />

        <WeeklyActivityCard />

        <MedicationsSummary />
        <RelaxCard />
        <GoalsCard />
        <VitalsSnapshot />
        <HealthHighlights />
        <DeviceConnectCard />
      </ScrollView>
    </View>
  );
}

function SummaryCard({ icon, value, unit, label, color, onPress }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  // Same white bar + shadow recipe as the Calendar and Records screen
  // headers, so all three read as one consistent header style.
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  greeting: { fontSize: 13, fontWeight: '600', color: c.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
  headerActions: { flexDirection: 'row', gap: 12 },
  // Same size/shape/shadow as the icon buttons in the Calendar header, so
  // the icon chips read as one consistent style across screens.
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    borderColor: c.borderLight
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
    color: c.textSecondary,
  },
  heartRateValue: {
    fontSize: 26,
    fontWeight: '800',
    color: c.text,
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
    backgroundColor: c.card,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: c.text },
  summaryUnit: { fontSize: 10, color: c.textSecondary, fontWeight: '600' },
  summaryLabel: { fontSize: 11, color: c.textSecondary, fontWeight: '500', marginTop: 2 }
});
