import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Footprints, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepsBarChart } from './components/StepsBarChart';
import {
  enableStepsTracking,
  getStepsRange,
  isHealthConnectSupported,
  isStepsTrackingEnabled,
  openHealthConnectInPlayStore,
  shiftAnchorDate,
  StepsRangeData,
  StepsRangeType,
} from '../../services/health/healthConnectStepsService';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const TABS: { type: StepsRangeType; label: string }[] = [
  { type: 'day', label: 'Daily' },
  { type: 'week', label: 'Weekly' },
  { type: 'month', label: 'Monthly' },
  { type: 'year', label: 'Yearly' },
];

// Presentation-only naming for whatever a single bar represents in each
// range, so "Avg / day", "Best week", "3/8 months" etc. read naturally
// instead of a generic "bucket".
const BUCKET_UNIT: Record<StepsRangeType, { singular: string; plural: string }> = {
  day: { singular: '3hr block', plural: '3hr blocks' },
  week: { singular: 'day', plural: 'days' },
  month: { singular: 'week', plural: 'weeks' },
  year: { singular: 'month', plural: 'months' },
};

export default function ActivityHistoryScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [trackingEnabled, setTrackingEnabled] = useState<boolean | null>(null);
  const [rangeType, setRangeType] = useState<StepsRangeType>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [data, setData] = useState<StepsRangeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);

  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    primaryAction?: () => void;
    primaryActionText?: string;
  }>({ visible: false, type: 'idle', title: '', message: '' });

  const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
    setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
  };
  const hideStatus = () => setStatus((prev) => ({ ...prev, visible: false }));

  useEffect(() => {
    isStepsTrackingEnabled().then(setTrackingEnabled);
  }, []);

  // Same flow as ManageGoalsScreen's "Track Steps Automatically?" prompt -
  // previously this screen's only way to enable tracking was to send the
  // user away to Manage Goals first, even though the exact same toggle
  // could just live here.
  const handleEnableTracking = async () => {
    if (enabling) return;
    setEnabling(true);
    try {
      const result = await enableStepsTracking();
      if (result.success) {
        setTrackingEnabled(true);
        return;
      }

      if (result.reason === 'not_installed' || result.reason === 'update_required') {
        showStatus(
          'warning',
          result.reason === 'not_installed' ? 'Health Connect Required' : 'Health Connect Update Required',
          result.reason === 'not_installed'
            ? 'Automatic step tracking needs the Health Connect app, which isn\'t installed on this device yet.'
            : 'Your Health Connect app needs an update before Medicoo can read step data from it.',
          openHealthConnectInPlayStore,
          'Get Health Connect'
        );
        return;
      }

      showStatus('error', t('could_not_enable_tracking'), t('permission_wasn_t_granted_in_health_co'));
    } finally {
      setEnabling(false);
    }
  };

  const load = useCallback(async (type: StepsRangeType, anchor: Date) => {
    setLoading(true);
    const result = await getStepsRange(type, anchor);
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (trackingEnabled) load(rangeType, anchorDate);
  }, [trackingEnabled, rangeType, anchorDate, load]);

  const handleTabPress = (type: StepsRangeType) => {
    if (type === rangeType) return;
    setRangeType(type);
    // Jump back to the current period whenever the granularity changes,
    // rather than carrying over an anchor that means something different
    // in the new range (e.g. "this week" doesn't map onto a month view).
    setAnchorDate(new Date());
  };

  const handlePrev = () => setAnchorDate((d) => shiftAnchorDate(rangeType, d, -1));
  const handleNext = () => {
    if (data?.canGoNext) setAnchorDate((d) => shiftAnchorDate(rangeType, d, 1));
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('activity_history_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.type}
            style={[styles.tab, rangeType === tab.type && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => handleTabPress(tab.type)}
            // The visual pill is only ~34px tall (paddingVertical: 9 + text),
            // under Android's ~48dp comfortable tap target - hitSlop pads
            // the actual touchable area without changing how it looks.
            // pressRetentionOffset widens how far a finger can drift during
            // a quick tap before Android's Touchable mixin cancels it as a
            // "drag" instead of firing onPress, which is the other half of
            // why a fast tap here could silently do nothing.
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            pressRetentionOffset={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.tabText, rangeType === tab.type && styles.tabTextActive]}>{t(tab.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {trackingEnabled === false ? (
        <View style={styles.emptyState}>
          <Footprints size={36} color="#10B981" />
          <Text style={styles.emptyTitle}>Step tracking isn&apos;t enabled</Text>
          <Text style={styles.emptySubtitle}>
            {isHealthConnectSupported
              ? 'Turn on step tracking to start seeing your activity history here.'
              : 'Turn on the Steps goal from Manage Goals to start seeing your activity history here.'}
          </Text>
          {isHealthConnectSupported && (
            <TouchableOpacity style={styles.enableButton} onPress={handleEnableTracking} activeOpacity={0.85} disabled={enabling}>
              {enabling ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.enableButtonText}>{t('enable_step_tracking')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.periodNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrev} activeOpacity={0.7}>
              <ChevronLeft size={18} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.periodLabel}>{data?.periodLabel ?? ' '}</Text>
            <TouchableOpacity
              style={[styles.navBtn, !data?.canGoNext && styles.navBtnDisabled]}
              onPress={handleNext}
              activeOpacity={0.7}
              disabled={!data?.canGoNext}
            >
              <ChevronRight size={18} color={data?.canGoNext ? '#374151' : '#D1D5DB'} />
            </TouchableOpacity>
          </View>

          {loading || !data ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#10B981" />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                {rangeType === 'day' ? (
                  <>
                    <Text style={styles.totalValue}>{data.total.toLocaleString()}</Text>
                    <Text style={styles.totalLabel}>{t('total_steps')}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.totalValue}>{data.average.toLocaleString()}</Text>
                    <Text style={styles.totalLabel}>{t('avg_steps')}</Text>
                  </>
                )}
                <View style={styles.chartWrap}>
                  <StepsBarChart buckets={data.buckets} highlightIndex={data.currentIndex} height={140} />
                </View>
              </View>

              <View style={styles.listCard}>
                {rangeType !== 'day' && (
                  <InfoRow
                    icon={<TrendingUp size={16} color="#3B82F6" />}
                    iconBg="#EFF6FF"
                    label={t('total_steps_2')}
                    value={data.total.toLocaleString()}
                  />
                )}
                <InfoRow
                  icon={<Award size={16} color="#F59E0B" />}
                  iconBg="#FFFBEB"
                  label={`Best ${BUCKET_UNIT[rangeType].singular}`}
                  value={data.bestBucket ? `${data.bestBucket.value.toLocaleString()} · ${data.bestBucket.label}` : '--'}
                />
                <InfoRow
                  icon={<CheckCircle2 size={16} color="#10B981" />}
                  iconBg="#F0FDF4"
                  label={`Active ${BUCKET_UNIT[rangeType].plural}`}
                  value={`${data.activeCount}/${data.elapsedCount}`}
                  isLast
                />
              </View>
            </>
          )}
        </View>
      )}

      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={hideStatus}
        primaryAction={status.primaryAction}
        primaryActionText={status.primaryActionText}
      />
    </View>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  isLast?: boolean;
}

function InfoRow({ icon, iconBg, label, value, isLast }: InfoRowProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={[styles.listRow, !isLast && styles.listRowDivider]}>
      <View style={[styles.listIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.listLabel}>{label}</Text>
      <Text style={styles.listValue}>{value}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },

  // Same header recipe as the rest of the app - white bar + shadow, plain
  // icon back button, fontSize 20/600/#111827 title.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: c.cardSecondary,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: c.card,
  },
  tabText: { fontSize: 12, fontWeight: '700', color: c.textSecondary },
  tabTextActive: { color: c.text },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.5 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: c.text },

  loadingBox: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    padding: 20,
  },
  totalValue: { fontSize: 28, fontWeight: '800', color: c.text },
  totalLabel: { fontSize: 12, color: c.textSecondary, fontWeight: '500', marginTop: 2 },
  chartWrap: { marginTop: 24 },

  listCard: {
    backgroundColor: c.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb76',
  },
  listIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
  listValue: { fontSize: 14, fontWeight: '800', color: c.text },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 19 },
  enableButton: {
    marginTop: 12,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
});
