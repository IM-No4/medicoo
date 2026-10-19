import React, { useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import {
    Droplets,
    Footprints,
    Moon,
    Activity,
    Target,
    Salad,
    Heart,
    Brain,
} from 'lucide-react-native';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

// Each goal type has a vivid, meaningful color baked in permanently.
// Custom goals let the user pick their own color in step 3.
export const GOAL_TYPES = [
    {
        id: 'hydration',
        title: 'Hydration',
        description: 'Track daily water intake',
        icon: Droplets,
        color: '#0EA5E9',     // Sky blue — water
        bg: '#F0F9FF',
        unit: 'L',
        defaultTarget: 2.5,
        presets: [1.5, 2, 2.5, 3, 3.5],
    },
    {
        id: 'steps',
        title: 'Daily Steps',
        description: 'Count steps every day',
        icon: Footprints,
        color: '#10B981',    // Emerald green — movement / nature
        bg: '#ECFDF5',
        unit: 'steps',
        defaultTarget: 8000,
        presets: [5000, 7500, 8000, 10000, 12000],
    },
    {
        id: 'sleep',
        title: 'Sleep',
        description: 'Get enough rest each night',
        icon: Moon,
        color: '#7C3AED',    // Deep violet — night / rest
        bg: '#F5F3FF',
        unit: 'hrs',
        defaultTarget: 8,
        presets: [6, 7, 7.5, 8, 9],
    },
    {
        id: 'activity',
        title: 'Active Minutes',
        description: 'Stay active every day',
        icon: Activity,
        color: '#EF4444',    // Vivid red — energy / intensity
        bg: '#FEF2F2',
        unit: 'mins',
        defaultTarget: 30,
        presets: [15, 20, 30, 45, 60],
    },
    {
        id: 'nutrition',
        title: 'Nutrition',
        description: 'Healthy meals per day',
        icon: Salad,
        color: '#F59E0B',    // Warm amber — food / warmth
        bg: '#FFFBEB',
        unit: 'meals',
        defaultTarget: 3,
        presets: [2, 3, 4, 5],
    },
    {
        id: 'meditation',
        title: 'Meditation',
        description: 'Mindfulness sessions',
        icon: Brain,
        color: '#EC4899',    // Rose pink — calm / mind
        bg: '#FDF2F8',
        unit: 'mins',
        defaultTarget: 10,
        presets: [5, 10, 15, 20, 30],
    },
    {
        id: 'heartrate',
        title: 'Heart Health',
        description: 'Monitor resting heart rate',
        icon: Heart,
        color: '#DC2626',    // Deep crimson — heart / vitality
        bg: '#FFF1F2',
        unit: 'bpm',
        defaultTarget: 70,
        presets: [60, 65, 70, 75, 80],
    },
    {
        id: 'custom',
        title: 'Custom Goal',
        description: 'Create your own habit',
        icon: Target,
        color: '#6366F1',    // Indigo — creativity / custom
        bg: '#EEF2FF',
        unit: '',
        defaultTarget: 1,
        presets: [1, 5, 10, 20],
    },
];

interface Props {
    data: any;
    onChange: (d: any) => void;
}

export default function GoalTypeStep({ data, onChange }: Props) {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{t('what_would_you_like_to_track')}</Text>
            <Text style={styles.subheading}>{t('choose_a_category_to_get_started')}</Text>

            <View style={styles.grid}>
                {GOAL_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = data.type === type.id;
                    return (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.card,
                                { backgroundColor: isDark ? type.color + '26' : type.bg },
                                isSelected && {
                                    borderColor: type.color,
                                },
                            ]}
                            activeOpacity={0.75}
                            onPress={() =>
                                onChange({
                                    type: type.id,
                                    // For custom goals, leave title blank so user can enter their own
                                    title: type.id !== 'custom' ? type.title : '',
                                    unit: type.unit,
                                    // Store the type's baked-in color — for custom it's the default until user changes it
                                    color: type.color,
                                    target: String(type.defaultTarget),
                                })
                            }
                        >
                            {/* Selected indicator dot */}
                            {isSelected && (
                                <View style={[styles.selectedDot, { backgroundColor: type.color }]} />
                            )}

                            {/* Icon box - white, so the category's own light
                                background tint (always on, not just when
                                selected) is what actually distinguishes each
                                card, same pattern as the offline home
                                screen's cards. */}
                            <View style={styles.iconBox}>
                                <Icon size={20} color={type.color} />
                            </View>

                            <Text style={[
                                styles.cardTitle,
                                isSelected && { color: type.color },
                            ]}>
                                {t(type.title)}
                            </Text>
                            <Text style={styles.cardDesc} numberOfLines={2}>
                                {t(type.description)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: c.textSecondary,
        marginBottom: 24,
        fontWeight: '500',
    },
    // width: '48%' + space-between instead of a Dimensions-computed pixel
    // width - the computed width didn't quite account for the container's
    // own horizontal padding plus the grid gap together, so cards drifted
    // out of alignment with each other row to row on some screen widths.
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    card: {
        width: '48%',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1.5,
        borderColor: 'transparent',
        position: 'relative',
    },
    selectedDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 13,
        backgroundColor: c.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: c.text,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 11,
        color: c.textSecondary,
        lineHeight: 15,
        fontWeight: '500',
    },
});
