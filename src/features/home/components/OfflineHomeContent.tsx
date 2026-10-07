import { useNavigation } from '@react-navigation/native';
import { Activity, Calendar, Footprints, HeartPulse, LucideIcon, Target, TrendingUp, Wind } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import { markMedicineIntake } from '../../../redux/slices/calendarSlice';
import { selectActiveGoals } from '../../../redux/slices/goalsSlice';
import { selectTodaySteps } from '../../../redux/slices/deviceSlice';
import { getLocalDateString } from '../../../utils/dateUtils';
import { timeToMinutes } from '../../calendar/utils/scheduleSort';
import MedicineCard from '../../calendar/components/MedicineCard';
import { GoalsCard } from '../../health/components/GoalsCard';

// Rendered instead of the normal network-fed feed while offline - see
// HomeScreen.tsx's early return and OfflineHomeHeader.tsx for the header
// half of this. Card sizes/rhythm (one full-width hero, a middle grid) are
// modeled on Samsung Health's own offline-friendly home screen, at the
// user's suggestion - deliberately NOT copying its actual color choices
// (every card there is a different saturated hue), just a small,
// brand-consistent set of tints instead.
//
// Every card is sourced from data already proven to work with zero network
// (vitals/goals caches loaded at boot, on-device steps) - nothing here
// attempts a request that's guaranteed to fail.
function formatLatestVital(record?: { heartRate?: number; systolic?: number; diastolic?: number; weight?: number }) {
    if (!record) return null;
    if (record.heartRate) return `${record.heartRate} bpm`;
    if (record.systolic && record.diastolic) return `${record.systolic}/${record.diastolic} mmHg`;
    if (record.weight) return `${record.weight} kg`;
    return null;
}

type GridCard = {
    key: string;
    icon: LucideIcon;
    accent: string;
    tint: string;
    title: string;
    subtitle: string;
    screen: string;
};

// One shared renderer for every grid card, rather than six hand-copied
// TouchableOpacity blocks - guarantees the icon badge, title, and subtitle
// line up identically on all of them instead of drifting apart from small
// copy-paste differences. Colors are deliberately assigned so no two
// adjacent cards (in the same row OR the same column) share a hue - teal is
// reserved for the header/hero only, so nothing below repeats it.
function Card({ icon: Icon, accent, tint, title, subtitle, screen }: GridCard) {
    const navigation = useNavigation<any>();
    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: tint }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(screen)}
        >
            <View style={[styles.cardIcon, { backgroundColor: '#FFFFFF' }]}>
                <Icon size={22} color={accent} />
            </View>
            <View>
                <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>
            </View>
        </TouchableOpacity>
    );
}

export default function OfflineHomeContent() {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const latestVital = useSelector((state: RootState) => state.vitals.records[0]);
    const activeGoals = useSelector(selectActiveGoals);
    const todaySteps = useSelector(selectTodaySteps);
    const latestVitalValue = formatLatestVital(latestVital);

    // Today's medicines, cached at boot (see App.tsx's loadCalendarCache
    // dispatch) specifically so this list isn't empty the first time
    // someone opens the app offline without having visited the Calendar
    // tab yet. markMedicineIntake already queues offline writes on its own
    // (see calendarSlice.ts) - same "Taken"/"Skipped" card and dispatch as
    // CalendarScreen.tsx, just filtered to today and never treated as a
    // future/uneditable date the way a date-navigable calendar can be.
    const todaysMedicines = useSelector((state: RootState) => state.calendar.data.medicines) ?? [];
    const sortedMedicines = [...todaysMedicines].sort(
        (a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );
    const todayStr = getLocalDateString();

    const CARDS: GridCard[][] = [
        [
            {
                key: 'log-vitals',
                icon: HeartPulse,
                accent: '#EF4444',
                tint: '#FFF1F0',
                title: 'Log Vitals',
                subtitle: latestVitalValue ?? 'Tap to add one',
                screen: 'LogVitals',
            },
            {
                key: 'medications',
                icon: Calendar,
                accent: '#6366F1',
                tint: '#EEF2FF',
                title: 'Medications',
                subtitle: 'View schedule',
                screen: 'ManageMedications',
            },
        ],
        [
            {
                key: 'goals',
                icon: Target,
                accent: '#F59E0B',
                tint: '#FFFBEB',
                title: 'My Goals',
                subtitle: activeGoals.length > 0 ? `${activeGoals.length} active` : 'Set a goal',
                screen: 'ManageGoals',
            },
            {
                key: 'vitals-history',
                icon: TrendingUp,
                accent: '#2563EB',
                tint: '#EFF6FF',
                title: 'Vitals History',
                subtitle: latestVital ? 'View all records' : 'Nothing yet',
                screen: 'VitalsHistory',
            },
        ],
        [
            {
                key: 'activity',
                icon: Activity,
                accent: '#8B5CF6',
                tint: '#F5F3FF',
                title: 'Activity History',
                subtitle: 'See everything logged',
                screen: 'ActivityHistory',
            },
            // Opens a dedicated picker screen (WellnessActivitiesScreen)
            // rather than committing to one activity - a 4th grid row with
            // Quick Stretch/Mindful Pause each as their own full card made
            // this screen an 8-card wall of near-identical tiles. All 3
            // activities are self-contained, zero-network, so nothing here
            // needs its own dedicated tile to stay reachable.
            {
                key: 'wellness',
                icon: Wind,
                accent: '#DB2777',
                tint: '#FDF2F8',
                title: 'Wellness Break',
                subtitle: 'A few quick activities',
                screen: 'WellnessActivities',
            },
        ],
    ];

    return (
        <View style={styles.container}>
            {/* Hero - full width, the one glanceable number that means
                anything without a tap (steps, always on-device/live). A
                soft pastel sky-blue - distinct from Vitals History's own
                (more indigo) blue tint below, and from every bold gradient
                tried earlier (teal, blue, orange, sea-blue, mint) that
                fought the header's own bold teal right above it. */}
            <TouchableOpacity style={styles.heroCard} activeOpacity={0.9} onPress={() => navigation.navigate('ActivityHistory')}>
                <View style={styles.heroTop}>
                    <View style={[styles.cardIcon, { backgroundColor: '#FFFFFF' }]}>
                        <Footprints size={22} color="#0284C7" />
                    </View>
                    <Text style={styles.heroLabel}>Steps Today</Text>
                </View>
                <Text style={styles.heroValue}>
                    {todaySteps > 0 ? todaySteps.toLocaleString() : '0'}
                </Text>
                <Text style={styles.heroSubtitle}>
                    {todaySteps > 0 ? 'Synced from your device' : 'Start walking to see it here'}
                </Text>
            </TouchableOpacity>

            {sortedMedicines.length > 0 && (
                <View>
                    <Text style={styles.sectionLabel}>Today's Medications</Text>
                    {sortedMedicines.map((item: any) => (
                        <MedicineCard
                            key={item.id}
                            scheduleId={item.id.split('_')[0]}
                            date={todayStr}
                            name={item.title}
                            dosage={item.subtitle}
                            time={item.time}
                            status={item.status}
                            shape={item.shape}
                            color={item.color}
                            leftColor={item.leftColor}
                            rightColor={item.rightColor}
                            isFuture={false}
                            onMarkIntake={(status) => {
                                dispatch(markMedicineIntake({
                                    scheduleId: item.id.split('_')[0],
                                    date: todayStr,
                                    time: item.time,
                                    status,
                                }));
                            }}
                        />
                    ))}
                </View>
            )}

            {/* Same GoalsCard the online feed shows (HomeFeedRenderer's
                GOALS_SECTION case) - it's already fully offline-safe, since
                it only ever reads from the goals/device redux caches and
                writes progress locally, so there's no reason offline mode
                should fall back to a bare "My Goals" nav tile instead of
                the real progress summary. */}
            {activeGoals.length > 0 && (
                // Cancels HealthSection's own paddingHorizontal:20 (this
                // container already provides that) and marginVertical:16
                // (this container's own `gap: 12` already provides
                // consistent spacing between siblings) - without this,
                // GoalsCard would sit double-inset and double-spaced
                // compared to every other section here.
                <View style={{ marginHorizontal: -20, marginVertical: -16 }}>
                    <GoalsCard />
                </View>
            )}

            {CARDS.map((pair, i) => (
                <View style={styles.row} key={i}>
                    {pair.map((card) => (
                        <View style={styles.cardHalf} key={card.key}>
                            <Card {...card} />
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: 12,
    },
    heroCard: {
        backgroundColor: '#E0F2FE',
        borderRadius: 22,
        padding: 20,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    heroLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    heroValue: {
        fontSize: 34,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    heroSubtitle: {
        fontSize: 12.5,
        color: '#9CA3AF',
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    cardHalf: {
        flex: 1,
    },
    card: {
        flex: 1,
        borderRadius: 20,
        padding: 16,
        minHeight: 118,
        justifyContent: 'space-between',
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 14.5,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 3,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
});
