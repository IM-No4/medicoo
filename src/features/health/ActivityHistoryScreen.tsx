import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Footprints, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepsBarChart } from './components/StepsBarChart';
import {
  getStepsRange,
  isStepsTrackingEnabled,
  shiftAnchorDate,
  StepsRangeData,
  StepsRangeType,
} from '../../services/health/healthConnectStepsService';

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [trackingEnabled, setTrackingEnabled] = useState<boolean | null>(null);
  const [rangeType, setRangeType] = useState<StepsRangeType>('week');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [data, setData] = useState<StepsRangeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isStepsTrackingEnabled().then(setTrackingEnabled);
  }, []);

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

      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.type}
            style={[styles.tab, rangeType === tab.type && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => handleTabPress(tab.type)}
          >
            <Text style={[styles.tabText, rangeType === tab.type && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {trackingEnabled === false ? (
        <View style={styles.emptyState}>
          <Footprints size={36} color="#0FBBA1" />
          <Text style={styles.emptyTitle}>Step tracking isn&apos;t enabled</Text>
          <Text style={styles.emptySubtitle}>
            Turn on the Steps goal from Manage Goals to start seeing your activity history here.
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.periodNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrev} activeOpacity={0.7}>
              <ChevronLeft size={18} color="#374151" />
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
              <ActivityIndicator color="#0FBBA1" />
            </View>
          ) : (
            <>
              <View style={styles.card}>
                {rangeType === 'day' ? (
                  <>
                    <Text style={styles.totalValue}>{data.total.toLocaleString()}</Text>
                    <Text style={styles.totalLabel}>total steps</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.totalValue}>{data.average.toLocaleString()}</Text>
                    <Text style={styles.totalLabel}>avg steps</Text>
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
                    label="Total steps"
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
                  icon={<CheckCircle2 size={16} color="#0FBBA1" />}
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
  return (
    <View style={[styles.listRow, !isLast && styles.listRowDivider]}>
      <View style={[styles.listIconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.listLabel}>{label}</Text>
      <Text style={styles.listValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },

  // Same header recipe as the rest of the app - white bar + shadow, plain
  // icon back button, fontSize 20/600/#111827 title.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#FFFFFF',
  },
  tabText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#111827' },

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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.5 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },

  loadingBox: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb76',
    padding: 20,
  },
  totalValue: { fontSize: 28, fontWeight: '800', color: '#111827' },
  totalLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  chartWrap: { marginTop: 24 },

  listCard: {
    backgroundColor: '#FFFFFF',
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
  listLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  listValue: { fontSize: 14, fontWeight: '800', color: '#111827' },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
});
