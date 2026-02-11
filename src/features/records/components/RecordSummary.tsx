import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

const COLORS = {
    text: '#1D1D21',
    textSecondary: '#8F9BB3',
};

interface Props {
    count: number;
    label: string;
    style?: ViewStyle;
}

export default function RecordSummary({ count, label, style }: Props) {
    return (
        <View style={[styles.container, style]}>
            <Text style={styles.countText}>
                {count} {count === 1 ? 'record' : 'records'}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.labelText}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginHorizontal: 24,
    },
    countText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    dot: {
        marginHorizontal: 8,
        color: '#9CA3AF',
        fontSize: 14,
    },
    labelText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});
