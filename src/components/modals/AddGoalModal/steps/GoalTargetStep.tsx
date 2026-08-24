import React from 'react';
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

interface Props {
    data: any;
    onChange: (d: any) => void;
}

export default function GoalTargetStep({ data, onChange }: Props) {
    const goalMeta = GOAL_TYPES.find(g => g.id === data.type);
    const color = goalMeta?.color ?? '#0FBBA1';
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
            <Text style={styles.heading}>Set your target</Text>
            <Text style={styles.subheading}>
                How much do you aim for {data.type === 'custom' ? 'your goal' : `your ${data.title?.toLowerCase()}`}?
            </Text>

            {/* Custom goal name */}
            {data.type === 'custom' && (
                <View style={styles.section}>
                    <Text style={styles.label}>Goal Name</Text>
                    <TextInput
                        style={[styles.textInput, { borderColor: color }]}
                        placeholder="e.g. Read 20 pages daily"
                        placeholderTextColor="#94A3B8"
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
            <Text style={styles.presetsLabel}>QUICK PRESETS</Text>
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
                This is your daily target. You can adjust it anytime from Manage Goals.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    heading: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 28,
        fontWeight: '500',
    },
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    stepperCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
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
        color: '#94A3B8',
        marginTop: -4,
    },
    presetsLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
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
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    presetText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
    },
    hint: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
});
