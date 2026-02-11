import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Pill } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HealthSection } from './HealthSection';

export function MedicationsSummary() {
    const navigation = useNavigation<any>();

    return (
        <HealthSection title="Medications" icon={<Pill size={14} color="#2FA561" />}>
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Calendar')}
            >
                <View style={styles.content}>
                    <View style={styles.medIconBox}>
                        <Pill size={24} color="#2FA561" />
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>4 Active Medications</Text>
                        <Text style={styles.subtext}>Adherence: 85% this week</Text>
                    </View>

                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>On Track</Text>
                    </View>
                </View>

                <View style={styles.progressSection}>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFill, { width: '85%' }]} />
                    </View>
                    <Text style={styles.progressLabel}>12 of 14 doses taken</Text>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.footerLink}>View Schedule</Text>
                    <ChevronRight size={16} color="#2FA561" />
                </View>
            </TouchableOpacity>
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    medIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: { fontSize: 16, fontWeight: '700', color: '#111827' },
    subtext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    badge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    badgeText: { fontSize: 11, color: '#2FA561', fontWeight: '700' },

    progressSection: { marginBottom: 16 },
    progressBg: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2FA561',
        borderRadius: 4
    },
    progressLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 6, fontWeight: '500' },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F9FAFB'
    },
    footerLink: { fontSize: 14, fontWeight: '700', color: '#2FA561' },
});
