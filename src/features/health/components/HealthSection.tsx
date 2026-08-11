import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SectionProps {
    title: string;
    icon?: ReactNode;
    children: ReactNode;
}

export function HealthSection({ title, icon, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {icon}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginVertical: 16, paddingHorizontal: 20 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1
    },
});
