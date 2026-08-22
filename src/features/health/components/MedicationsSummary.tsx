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

    // Dynamic calculations from calendar data. calendarData.medicines has
    // one entry per scheduled dose time (e.g. a 3x/day medicine produces 3
    // entries), not one per distinct medication - counting entries directly
    // would show "3 Active Medications" for what's really 1 medication with
    // 3 doses. ids are `${scheduleId}_${time}`, so the part before the
    // first underscore identifies the distinct medication.
    const activeMedsCount = new Set(
        (calendarData?.medicines ?? []).map((m: any) => m.id?.split('_')[0])
    ).size;
    const takenDoses = calendarData?.progress?.taken ?? 0;
    const totalDoses = calendarData?.progress?.total ?? 0;
    const adherencePercent = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    const handleViewSchedule = () => {
        navigation.navigate('Calendar');
    };

    // "Add Medication" should open the actual medication-management screen
    // directly (it already has its own "Add First Medication" flow), not
    // the Calendar screen, which is for viewing/checking off today's
    // schedule rather than adding a new one.
    const handleAddMedication = () => {
        navigation.navigate('ManageMedications');
    };

    return (
        <HealthSection title="Medications" icon={<Pill size={14} color="#2FA561" />}>
            {activeMedsCount === 0 ? (
                <TouchableOpacity
                    style={styles.emptyCard}
                    activeOpacity={0.8}
                    onPress={handleAddMedication}
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
                    onPress={handleViewSchedule}
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
        borderColor: '#e5e7eb76',
    },
    content: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 0 },
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
        borderColor: '#e5e7eb76',
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
