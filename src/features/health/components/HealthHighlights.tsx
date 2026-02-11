import { CheckCircle2, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HealthSection } from './HealthSection';

const HIGHLIGHTS = [
    { text: 'No missed doses in the last 5 days', color: '#8B5CF6', bgColor: '#F5F3FF' },
    { text: 'Blood pressure improved this week', color: '#10B981', bgColor: '#F0FDF4' },
];

export function HealthHighlights() {
    return (
        <HealthSection title="Recent Highlights" icon={<Sparkles size={14} color="#8B5CF6" fill="#8B5CF6" />}>
            <View style={styles.container}>
                {HIGHLIGHTS.map((item, i) => (
                    <View key={i} style={[styles.highlight, { backgroundColor: item.bgColor }]}>
                        <CheckCircle2 size={18} color={item.color} />
                        <Text style={[styles.highlightText, { color: item.color }]}>{item.text}</Text>
                    </View>
                ))}
            </View>
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    container: { gap: 12 },
    highlight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    highlightText: { fontSize: 14, fontWeight: '600' },
});
