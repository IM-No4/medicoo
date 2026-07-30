import { useNavigation } from '@react-navigation/native';
import { ChevronRight, Pill, Plus } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';

export function MedicationsSummary() {
    const navigation = useNavigation<any>();
    const { data: calendarData } = useSelector((state: RootState) => state.calendar);

    // Dynamic calculations from calendar data
    const activeMedsCount = calendarData?.medicines?.length ?? 0;
    const takenDoses = calendarData?.progress?.taken ?? 0;
    const totalDoses = calendarData?.progress?.total ?? 0;
    const adherencePercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    const handleNavigate = () => {
        navigation.navigate('Calendar');
    };

    return (
        <HealthSection title="Medications" icon={<Pill size={14} color="#2FA561" />}>
            {activeMedsCount === 0 ? (
                <TouchableOpacity
                    style={styles.emptyCard}
                    activeOpacity={0.8}
                    onPress={handleNavigate}
                >
                    <View style={styles.emptyIconBox}>
                        <Pill size={24} color="#2FA561" />
                    </View>
                    <Text style={styles.emptyTitle}>No Medications Configured</Text>
                    <Text style={styles.emptySubtitle}>
                        Track your daily schedules and get reminded on time.
                    </Text>
                    <View style={styles.emptyBtn}>
                        <Plus size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.emptyBtnText}>Add Medication</Text>
                    </View>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.8}
                    onPress={handleNavigate}
                >
                    <View style={styles.content}>
                        <View style={styles.medIconBox}>
                            <Pill size={24} color="#2FA561" />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{activeMedsCount} Active Medications</Text>
                            <Text style={styles.subtext}>Adherence: {adherencePercent}% today</Text>
                        </View>

                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{adherencePercent >= 80 ? 'On Track' : 'Warning'}</Text>
                        </View>
                    </View>

                    <View style={styles.progressSection}>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressFill, { width: `${adherencePercent}%` }]} />
                        </View>
                        <Text style={styles.progressLabel}>{takenDoses} of {totalDoses} doses taken</Text>
                    </View>

                    <View style={styles.cardFooter}>
                        <Text style={styles.footerLink}>View Schedule</Text>
                        <ChevronRight size={16} color="#2FA561" />
                    </View>
                </TouchableOpacity>
            )}
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
    
    /* Empty State styles */
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 28,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2FA561',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    emptyBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
