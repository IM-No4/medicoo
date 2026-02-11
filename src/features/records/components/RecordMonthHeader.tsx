import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
    textSecondary: '#8F9BB3',
};

interface Props {
    month: string; // e.g. "January 2025"
}

export default function RecordMonthHeader({ month }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{month}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    text: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
