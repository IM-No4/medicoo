import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { Brain, ChevronLeft, ChevronRight, Eye, Heart, Lightbulb, Moon, Music, Sparkles, Wind } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

// Each accent is chosen for what the activity actually is, not just to
// look distinct from its neighbors: cyan for breathing (air), emerald for
// stretching (the standard "active/movement" convention most fitness UIs
// already use), violet for mindfulness (the near-universal color
// association for meditation/calm across wellness apps), blue for eye
// rest (clarity/vision), amber for gratitude (warmth/appreciation).
const ACTIVITIES = [
    {
        key: 'breathing',
        label: 'Breathing Exercise',
        subtitle: 'A minute of guided box breathing to reset',
        Icon: Wind,
        accent: '#0891B2',
        tint: '#ECFEFF',
        screen: 'BreathingExercise',
    },
    {
        key: 'stretch',
        label: 'Quick Stretch',
        subtitle: 'Five easy desk stretches, about a minute',
        Icon: Sparkles,
        accent: '#059669',
        tint: '#ECFDF5',
        screen: 'StretchBreak',
    },
    {
        key: 'mindful',
        label: 'Mindful Pause',
        subtitle: 'A minute to pause, breathe, and reset',
        Icon: Moon,
        accent: '#7C3AED',
        tint: '#F5F3FF',
        screen: 'MindfulPause',
    },
    {
        key: 'eye-rest',
        label: 'Eye Rest',
        subtitle: 'The 20-20-20 rule for tired eyes',
        Icon: Eye,
        accent: '#2563EB',
        tint: '#EFF6FF',
        screen: 'EyeRest',
    },
    {
        key: 'gratitude',
        label: 'Gratitude Journal',
        subtitle: 'Three things you’re grateful for today',
        Icon: Heart,
        accent: '#D97706',
        tint: '#FFFBEB',
        screen: 'GratitudeJournal',
    },
    {
        key: 'dance',
        label: 'Dance Break',
        subtitle: 'Thirty seconds of silly, fun movement',
        Icon: Music,
        accent: '#DB2777',
        tint: '#FDF2F8',
        screen: 'DanceBreak',
    },
    {
        key: 'fun-fact',
        label: 'Fun Fact',
        subtitle: 'A fresh bite-sized fact, tap for another',
        Icon: Lightbulb,
        accent: '#EA580C',
        tint: '#FFF7ED',
        screen: 'FunFact',
    },
    {
        key: 'quiz',
        label: 'Quick Quiz',
        subtitle: 'A fun health trivia question',
        Icon: Brain,
        accent: '#4F46E5',
        tint: '#EEF2FF',
        screen: 'QuickQuiz',
    },
];

// Dedicated picker screen for the self-contained wellness activities -
// replaces an earlier bottom sheet version, reached from
// OfflineHomeContent's single "Wellness Break" tile (avoids that screen
// turning into an 8-card wall of near-identical tiles) so all of these
// stay reachable offline without each needing its own full grid card.
export default function WellnessActivitiesScreen() {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Take a Moment</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
                <Text style={styles.intro}>
                    {t('a_few_short_activities_to_reset_unwind')}
                </Text>

                {ACTIVITIES.map((activity) => (
                    <TouchableOpacity
                        key={activity.key}
                        style={[styles.card, { backgroundColor: isDark ? activity.accent + '26' : activity.tint }]}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate(activity.screen)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: theme.card }]}>
                            <activity.Icon size={24} color={activity.accent} />
                        </View>
                        <View style={styles.cardInfo}>
                            <Text style={styles.cardTitle}>{t(activity.label)}</Text>
                            <Text style={styles.cardSubtitle}>{t(activity.subtitle)}</Text>
                        </View>
                        <ChevronRight size={20} color={activity.accent} />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    content: { padding: 20, paddingBottom: 40, gap: 12 },
    intro: {
        fontSize: 13.5,
        lineHeight: 20,
        color: c.textSecondary,
        marginBottom: 8,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: 16,
        gap: 14,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 3 },
    cardSubtitle: { fontSize: 12.5, color: c.textSecondary },
});
