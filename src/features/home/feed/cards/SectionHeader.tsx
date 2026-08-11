import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    title: string;
    subtitle?: string;
    onSeeAll?: () => void;
}

// Shared header for every "title + optional subtitle + horizontal list of
// cards" home feed section (product showcases, doctors, labs, articles,
// hospitals, home care). These were all copy-pasted from the same
// original template and had drifted into slightly different style key
// names with the same values - pulling the header into one component
// means they can't drift out of sync again. Matches the small-caps label
// style already used by HealthSummary/GoalsCard's "ACTIVE GOALS" header.
export default function SectionHeader({ title, subtitle, onSeeAll }: Props) {
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>{title}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {!!onSeeAll && (
                <TouchableOpacity onPress={onSeeAll}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    title: {
        fontSize: 13,
        color: '#494949',
        letterSpacing: 2,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
});
