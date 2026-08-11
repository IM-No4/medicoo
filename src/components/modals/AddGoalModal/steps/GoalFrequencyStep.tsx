import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { GOAL_TYPES } from './GoalTypeStep';

const FREQUENCIES = [
    { id: 'Daily', label: 'Daily', desc: 'Every day' },
    { id: 'Weekdays', label: 'Weekdays', desc: 'Mon – Fri' },
    { id: 'Weekends', label: 'Weekends', desc: 'Sat & Sun' },
    { id: '3x/week', label: '3× a Week', desc: 'Mon, Wed, Fri' },
    { id: '5x/week', label: '5× a Week', desc: 'Mon – Fri' },
];

// Color palette only shown for custom goals
const CUSTOM_COLORS = [
    { hex: '#6366F1', name: 'Indigo' },
    { hex: '#8B5CF6', name: 'Violet' },
    { hex: '#EC4899', name: 'Pink' },
    { hex: '#EF4444', name: 'Red' },
    { hex: '#F59E0B', name: 'Amber' },
    { hex: '#10B981', name: 'Emerald' },
    { hex: '#0EA5E9', name: 'Sky' },
    { hex: '#06B6D4', name: 'Cyan' },
    { hex: '#F97316', name: 'Orange' },
    { hex: '#84CC16', name: 'Lime' },
];

interface Props {
    data: any;
    onChange: (d: any) => void;
}

export default function GoalFrequencyStep({ data, onChange }: Props) {
    const goalMeta = GOAL_TYPES.find(g => g.id === data.type);
    const accentColor = data.color ?? goalMeta?.color ?? '#6366F1';
    const isCustom = data.type === 'custom';

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>
                {isCustom ? 'Frequency & Color' : 'Frequency'}
            </Text>
            <Text style={styles.subheading}>
                {isCustom
                    ? 'How often will you track this goal, and pick a color?'
                    : 'How often will you track this goal?'}
            </Text>

            {/* Frequency */}
            <Text style={styles.sectionLabel}>FREQUENCY</Text>
            <View style={styles.freqList}>
                {FREQUENCIES.map((f) => {
                    const isActive = data.frequency === f.id;
                    return (
                        <TouchableOpacity
                            key={f.id}
                            style={[
                                styles.freqRow,
                                isActive && { borderColor: accentColor, backgroundColor: accentColor + '0D' },
                            ]}
                            onPress={() => onChange({ frequency: f.id })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.freqText}>
                                <Text style={[styles.freqLabel, isActive && { color: accentColor }]}>
                                    {f.label}
                                </Text>
                                <Text style={styles.freqDesc}>{f.desc}</Text>
                            </View>
                            <View style={[
                                styles.radio,
                                isActive && { borderColor: accentColor, backgroundColor: accentColor },
                            ]}>
                                {isActive && <View style={styles.radioDot} />}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Color picker — only for custom goals */}
            {isCustom && (
                <>
                    <Text style={[styles.sectionLabel, { marginTop: 28 }]}>GOAL COLOR</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.colorRow}
                    >
                        {CUSTOM_COLORS.map((c) => {
                            const isSelected = data.color === c.hex;
                            return (
                                <TouchableOpacity
                                    key={c.hex}
                                    style={[styles.colorItem]}
                                    onPress={() => onChange({ color: c.hex })}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.colorSwatch,
                                        { backgroundColor: c.hex },
                                        isSelected && {
                                            transform: [{ scale: 1.1 }],
                                            shadowColor: c.hex,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 6,
                                            elevation: 4,
                                        },
                                    ]}>
                                        {isSelected && <View style={styles.colorCheck} />}
                                    </View>
                                    <Text style={[
                                        styles.colorName,
                                        isSelected && { color: c.hex, fontWeight: '700' },
                                    ]}>
                                        {c.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </>
            )}

            {/* Preview pill */}
            <View style={[styles.previewPill, { backgroundColor: accentColor + '15', borderColor: accentColor + '40' }]}>
                <View style={[styles.previewDot, { backgroundColor: accentColor }]} />
                <Text style={[styles.previewText, { color: accentColor }]}>
                    {data.title || 'Your Goal'} · {data.target} {data.unit} · {data.frequency}
                </Text>
            </View>
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
        marginBottom: 24,
        fontWeight: '500',
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    freqList: {
        gap: 8,
    },
    freqRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    freqText: {
        flex: 1,
        gap: 2,
    },
    freqLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    freqDesc: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
    },
    colorRow: {
        gap: 12,
        paddingRight: 20,
        paddingBottom: 4,
        marginBottom: 4,
    },
    colorItem: {
        alignItems: 'center',
        gap: 6,
    },
    colorSwatch: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorCheck: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.95)',
    },
    colorName: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
    },
    previewPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 50,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginTop: 28,
        gap: 8,
        alignSelf: 'center',
    },
    previewDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    previewText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
