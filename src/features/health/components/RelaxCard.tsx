import { useNavigation } from '@react-navigation/native';
import { Brain, ChevronRight, Eye, Heart, Lightbulb, LucideIcon, Moon, Music, Sparkles, Wind } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthSection } from './HealthSection';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

// Entry points into the app's short, self-contained wellness activities
// from the normal (online) Health tab - each is a pure client-side
// screen with no data or network dependency, so they're exactly as useful
// here as from OfflineHomeContent.tsx's offline hub (reached there via a
// single "Wellness Break" tile into WellnessActivitiesScreen, which lists
// the same set with the same colors).
type Activity = {
    key: string;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    screen: string;
    accent: string;
    tint: string;
};

// Each accent is chosen for what the activity actually is, not just to
// look distinct from its neighbors - see WellnessActivitiesScreen.tsx,
// which uses this exact same palette.
const ACTIVITIES: Activity[] = [
    {
        key: 'breathing',
        icon: Wind,
        title: 'Breathing Exercise',
        subtitle: 'A minute of guided box breathing to reset',
        screen: 'BreathingExercise',
        accent: '#0891B2',
        tint: '#ECFEFF',
    },
    {
        key: 'stretch',
        icon: Sparkles,
        title: 'Quick Stretch',
        subtitle: 'Five easy desk stretches, about a minute',
        screen: 'StretchBreak',
        accent: '#059669',
        tint: '#ECFDF5',
    },
    {
        key: 'mindful',
        icon: Moon,
        title: 'Mindful Pause',
        subtitle: 'A minute to pause, breathe, and reset',
        screen: 'MindfulPause',
        accent: '#7C3AED',
        tint: '#F5F3FF',
    },
    {
        key: 'eye-rest',
        icon: Eye,
        title: 'Eye Rest',
        subtitle: 'The 20-20-20 rule for tired eyes',
        screen: 'EyeRest',
        accent: '#2563EB',
        tint: '#EFF6FF',
    },
    {
        key: 'gratitude',
        icon: Heart,
        title: 'Gratitude Journal',
        subtitle: 'Three things you’re grateful for today',
        screen: 'GratitudeJournal',
        accent: '#D97706',
        tint: '#FFFBEB',
    },
    {
        key: 'dance',
        icon: Music,
        title: 'Dance Break',
        subtitle: 'Thirty seconds of silly, fun movement',
        screen: 'DanceBreak',
        accent: '#DB2777',
        tint: '#FDF2F8',
    },
    {
        key: 'fun-fact',
        icon: Lightbulb,
        title: 'Fun Fact',
        subtitle: 'A fresh bite-sized fact, tap for another',
        screen: 'FunFact',
        accent: '#EA580C',
        tint: '#FFF7ED',
    },
    {
        key: 'quiz',
        icon: Brain,
        title: 'Quick Quiz',
        subtitle: 'A fun health trivia question',
        screen: 'QuickQuiz',
        accent: '#4F46E5',
        tint: '#EEF2FF',
    },
];

// The Health tab shows just a taste; "See all" opens the full list (WellnessActivitiesScreen).
const PREVIEW_COUNT = 3;

export function RelaxCard() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();

    return (
        <HealthSection
            title={t('take_a_moment')}
            icon={
                <TouchableOpacity style={styles.seeAll} onPress={() => navigation.navigate('WellnessActivities')} activeOpacity={0.7}>
                    <Text style={styles.seeAllText}>See all</Text>
                    <ChevronRight size={14} color="#10B981" />
                </TouchableOpacity>
            }
        >
            <View style={styles.list}>
                {ACTIVITIES.slice(0, PREVIEW_COUNT).map((activity) => (
                    <TouchableOpacity
                        key={activity.key}
                        style={[styles.card, { backgroundColor: isDark ? activity.accent + '26' : activity.tint }]}
                        activeOpacity={0.88}
                        onPress={() => navigation.navigate(activity.screen)}
                    >
                        <View style={styles.iconCircle}>
                            <activity.icon size={22} color={activity.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{t(activity.title)}</Text>
                            <Text style={styles.subtitle}>{t(activity.subtitle)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.moreRow} onPress={() => navigation.navigate('WellnessActivities')} activeOpacity={0.7}>
                    <Text style={styles.moreText}>{`${ACTIVITIES.length - PREVIEW_COUNT} more activities`}</Text>
                    <ChevronRight size={16} color="#10B981" />
                </TouchableOpacity>
            </View>
        </HealthSection>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    list: {
        gap: 10,
    },
    seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 12.5, fontWeight: '700', color: '#10B981' },
    moreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
    moreText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderRadius: 18,
        padding: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: c.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 14.5,
        fontWeight: '700',
        color: c.text,
        marginBottom: 3,
    },
    subtitle: {
        fontSize: 12.5,
        color: c.textSecondary,
    },
});
