import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from '../../components/ThemedStatusBar';
import { fetchBadges, fetchGoalComparison, GoalComparison, BadgeInfo, EarnedBadge } from '../../services/api/goals.api';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { BadgesStrip } from './components/BadgesStrip';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const ME_COLOR = '#10B981';
const FRIEND_COLOR = '#6366F1';

const fmt = (n: number) => Math.round(n).toLocaleString('en-IN');

interface Params {
  friendId: string;
  friendName?: string;
  goalKey: string;
}

/** You against one friend on one goal: who is ahead today, and how the last week / month / three months went day by day. */
export default function GoalComparisonScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { friendId, friendName, goalKey } = (route.params || {}) as Params;

  const [days, setDays] = useState(7);
  const [data, setData] = useState<GoalComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<{ earned: EarnedBadge[]; available: BadgeInfo[] }>({ earned: [], available: [] });

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchGoalComparison(friendId, goalKey, range));
    } catch (e: any) {
      setData(null);
      setError(e?.response?.data?.message || 'Could not load this comparison.');
    } finally {
      setLoading(false);
    }
  }, [friendId, goalKey]);

  useEffect(() => {
    load(days);
  }, [load, days]);

  useEffect(() => {
    fetchBadges().then(setBadges).catch(() => {});
  }, []);

  const friend = data?.friend.profile?.name || friendName || 'Your friend';
  const unit = data?.unit ? ` ${data.unit}` : '';
  const s = data?.summary;

  // Headline for today
  const headline = (() => {
    if (!s) return '';
    const gap = Math.abs(s.today.gap);
    if (s.today.me === 0 && s.today.friend === 0) return 'Nobody has started today. Be the first!';
    if (s.today.leader === 'tie') return `Dead heat with ${friend} today.`;
    if (s.today.leader === 'me') return `You are ahead of ${friend} by ${fmt(gap)}${unit} today.`;
    return `You are ${fmt(gap)}${unit} behind ${friend} today. Catch up!`;
  })();

  const maxValue = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, ...data.days.map((d) => Math.max(d.me, d.friend)), data.me.target, data.friend.target);
  }, [data]);

  const barWidth = days <= 7 ? 16 : days <= 30 ? 8 : 4;
  const showLabels = days <= 30;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>You vs {friend}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !data ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#10B981" /></View>
      ) : error || !data || !s ? (
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Cannot compare yet</Text>
          <Text style={styles.errorText}>{error || 'No data.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          {/* Today */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>TODAY · {data.title.toUpperCase()}</Text>
            <Text style={styles.headline}>{headline}</Text>
            <View style={styles.vsRow}>
              <View style={styles.side}>
                <Text style={[styles.sideValue, { color: ME_COLOR }]}>{fmt(s.today.me)}</Text>
                <Text style={styles.sideName}>You</Text>
              </View>
              <Text style={styles.vs}>vs</Text>
              <View style={styles.side}>
                <Text style={[styles.sideValue, { color: FRIEND_COLOR }]}>{fmt(s.today.friend)}</Text>
                <Text style={styles.sideName} numberOfLines={1}>{friend}</Text>
              </View>
            </View>
            <View style={styles.tugBg}>
              <View style={[styles.tugFill, { flex: Math.max(s.today.me, 1), backgroundColor: ME_COLOR }]} />
              <View style={[styles.tugFill, { flex: Math.max(s.today.friend, 1), backgroundColor: FRIEND_COLOR }]} />
            </View>
          </View>

          {/* Range */}
          <View style={styles.rangeRow}>
            {RANGES.map((r) => (
              <TouchableOpacity key={r.days} style={[styles.rangeChip, days === r.days && styles.rangeChipActive]} onPress={() => setDays(r.days)} activeOpacity={0.8}>
                <Text style={[styles.rangeText, days === r.days && styles.rangeTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart */}
          <View style={styles.card}>
            <View style={styles.legendRow}>
              <View style={styles.legend}><View style={[styles.dot, { backgroundColor: ME_COLOR }]} /><Text style={styles.legendText}>You</Text></View>
              <View style={styles.legend}><View style={[styles.dot, { backgroundColor: FRIEND_COLOR }]} /><Text style={styles.legendText} numberOfLines={1}>{friend}</Text></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chart}>
              {data.days.map((d) => (
                <View key={d.date} style={styles.dayCol}>
                  <View style={styles.bars}>
                    <View style={[styles.bar, { width: barWidth, height: Math.max(2, (d.me / maxValue) * 120), backgroundColor: ME_COLOR }]} />
                    <View style={[styles.bar, { width: barWidth, height: Math.max(2, (d.friend / maxValue) * 120), backgroundColor: FRIEND_COLOR }]} />
                  </View>
                  {showLabels ? (
                    <Text style={styles.dayLabel}>{days <= 7 ? new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }) : new Date(d.date).getDate()}</Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Numbers */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LAST {days} DAYS</Text>
            <StatRow label="Total" me={`${fmt(s.totals.me)}`} friend={`${fmt(s.totals.friend)}`} meAhead={s.totals.me >= s.totals.friend} styles={styles} />
            <StatRow label="Daily average" me={fmt(s.averages.me)} friend={fmt(s.averages.friend)} meAhead={s.averages.me >= s.averages.friend} styles={styles} />
            <StatRow label="Best day" me={fmt(s.bestDay.me)} friend={fmt(s.bestDay.friend)} meAhead={s.bestDay.me >= s.bestDay.friend} styles={styles} />
            <StatRow label="Days in the lead" me={`${s.daysLed.me}`} friend={`${s.daysLed.friend}`} meAhead={s.daysLed.me >= s.daysLed.friend} styles={styles} />
            <StatRow label="Goal reached" me={`${s.goalDays.me} days`} friend={`${s.goalDays.friend} days`} meAhead={s.goalDays.me >= s.goalDays.friend} styles={styles} />
            <StatRow label="Current streak" me={`${s.streak.me} days`} friend={`${s.streak.friend} days`} meAhead={s.streak.me >= s.streak.friend} styles={styles} last />
            <Text style={styles.verdict}>
              {s.totals.gap === 0
                ? 'All square over this period.'
                : s.totals.gap > 0
                  ? `You are ${fmt(s.totals.gap)}${unit} ahead of ${friend} over ${days} days.`
                  : `${friend} is ${fmt(-s.totals.gap)}${unit} ahead of you over ${days} days.`}
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>YOUR BADGES</Text>
            <BadgesStrip earned={badges.earned} available={badges.available} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function StatRow({ label, me, friend, meAhead, last, styles }: { label: string; me: string; friend: string; meAhead: boolean; last?: boolean; styles: any }) {
  return (
    <View style={[styles.statRow, last && { borderBottomWidth: 0 }]}>
      <Text style={[styles.statValue, meAhead && { color: ME_COLOR, fontWeight: '800' }]}>{me}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { textAlign: 'right' }, !meAhead && { color: FRIEND_COLOR, fontWeight: '800' }]}>{friend}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
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
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: c.text, textAlign: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    errorTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6 },
    errorText: { fontSize: 13, color: c.textSecondary, textAlign: 'center', lineHeight: 19 },
    content: { padding: 20, gap: 14 },
    card: { backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.borderLight, padding: 16 },
    cardLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: c.textMuted, marginBottom: 8 },
    headline: { fontSize: 15, fontWeight: '700', color: c.text, lineHeight: 21, marginBottom: 14 },
    vsRow: { flexDirection: 'row', alignItems: 'center' },
    side: { flex: 1, alignItems: 'center' },
    sideValue: { fontSize: 26, fontWeight: '800' },
    sideName: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    vs: { fontSize: 12, fontWeight: '700', color: c.textMuted },
    tugBg: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 14, backgroundColor: c.cardSecondary, gap: 2 },
    tugFill: { height: 8 },
    rangeRow: { flexDirection: 'row', gap: 8 },
    rangeChip: { flex: 1, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: 'center', backgroundColor: c.card },
    rangeChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    rangeText: { fontSize: 12.5, fontWeight: '700', color: c.textSecondary },
    rangeTextActive: { color: '#fff' },
    legendRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
    legend: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11.5, color: c.textSecondary, fontWeight: '600' },
    chart: { alignItems: 'flex-end', gap: 6, paddingTop: 4, minWidth: '100%' },
    dayCol: { alignItems: 'center' },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 124 },
    bar: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
    dayLabel: { fontSize: 9.5, color: c.textMuted, marginTop: 4 },
    statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    statLabel: { flex: 1.3, fontSize: 12, color: c.textSecondary, textAlign: 'center' },
    statValue: { flex: 1, fontSize: 13.5, fontWeight: '600', color: c.text },
    verdict: { fontSize: 12.5, fontWeight: '600', color: c.textSecondary, marginTop: 12, lineHeight: 18 },
  });
