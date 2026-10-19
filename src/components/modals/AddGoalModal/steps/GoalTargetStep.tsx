import React, { useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { GOAL_TYPES } from './GoalTypeStep';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    data: any;
    onChange: (d: any) => void;
}

export default function GoalTargetStep({ data, onChange }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const goalMeta = GOAL_TYPES.find(g => g.id === data.type);
    const color = goalMeta?.color ?? '#10B981';
    const presets = goalMeta?.presets ?? [1, 5, 10, 20];
    const numTarget = parseFloat(data.target) || 0;

    const increment = () => {
        const step = data.unit === 'steps' ? 500 : data.unit === 'bpm' ? 1 : data.unit === 'L' ? 0.5 : 1;
        onChange({ target: String(+(numTarget + step).toFixed(1)) });
    };

    const decrement = () => {
        const step = data.unit === 'steps' ? 500 : data.unit === 'bpm' ? 1 : data.unit === 'L' ? 0.5 : 1;
        const next = Math.max(0, +(numTarget - step).toFixed(1));
        onChange({ target: String(next) });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{t('set_your_target')}</Text>
            <Text style={styles.subheading}>
                How much do you aim for {data.type === 'custom' ? 'your goal' : `your ${data.title?.toLowerCase()}`}?
            </Text>

            {/* Custom goal name */}
            {data.type === 'custom' && (
                <View style={styles.section}>
                    <Text style={styles.label}>{t('goal_name')}</Text>
                    <TextInput
                        style={[styles.textInput, { borderColor: color }]}
                        placeholder="e.g. Read 20 pages daily"
                        placeholderTextColor={theme.textMuted}
                        value={data.title}
                        onChangeText={(v) => onChange({ title: v })}
                        returnKeyType="done"
                    />
                </View>
            )}

            {/* Big stepper */}
            <View style={[styles.stepperCard, { borderColor: color + '30' }]}>
                <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: color + '15' }]}
                    onPress={decrement}
                    activeOpacity={0.7}
                >
                    <Minus size={22} color={color} />
                </TouchableOpacity>

                <View style={styles.stepperCenter}>
                    <TextInput
                        style={[styles.bigNumber, { color }]}
                        keyboardType="numeric"
                        value={data.target}
                        onChangeText={(v) => onChange({ target: v })}
                        textAlign="center"
                        selectTextOnFocus
                    />
                    <Text style={styles.unitLabel}>{data.unit || 'units'}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.stepperBtn, { backgroundColor: color + '15' }]}
                    onPress={increment}
                    activeOpacity={0.7}
                >
                    <Plus size={22} color={color} />
                </TouchableOpacity>
            </View>

            {/* Presets */}
            <Text style={styles.presetsLabel}>{t('quick_presets')}</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presets}
            >
                {presets.map((p) => {
                    const isActive = String(p) === data.target || p === numTarget;
                    return (
                        <TouchableOpacity
                            key={p}
                            style={[
                                styles.presetChip,
                                isActive && { backgroundColor: color, borderColor: color },
                            ]}
                            onPress={() => onChange({ target: String(p) })}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.presetText, isActive && { color: '#FFF' }]}>
                                {p} {data.unit}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <Text style={styles.hint}>
                {t('this_is_your_daily_target_you_can_adju')}
            </Text>
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
        marginBottom: 28,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: c.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
    },
    stepperCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.card,
        borderRadius: 24,
        borderWidth: 1,
        padding: 16,
        marginBottom: 28,
    },
    stepperBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperCenter: {
        flex: 1,
        alignItems: 'center',
    },
    bigNumber: {
        fontSize: 52,
        fontWeight: '900',
        letterSpacing: -2,
        minWidth: 100,
        textAlign: 'center',
    },
    unitLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: c.textMuted,
        marginTop: -4,
    },
    presetsLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: c.textMuted,
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    presets: {
        gap: 8,
        paddingRight: 20,
        marginBottom: 24,
    },
    presetChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
    },
    presetText: {
        fontSize: 13,
        fontWeight: '700',
        color: c.textSecondary,
    },
    hint: {
        fontSize: 13,
        color: c.textMuted,
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
});
