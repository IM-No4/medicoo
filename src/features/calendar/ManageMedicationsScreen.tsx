import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Pencil, Pill, Plus, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import { deleteMedicineSchedule, getMedicineSchedules } from '../../services/api/medicine.api';

interface MedSchedule {
    _id: string;
    medicineName: string;
    dosage: string;
    scheduleType: string;
    isActive: boolean;
    isDeleted?: boolean;
    times?: string[];
    medicineType?: string;
    shape?: string;
    color?: string;
    leftColor?: string;
    rightColor?: string;
    startDate?: string;
    endDate?: string | null;
    frequency?: string;
    notes?: string;
    familyVisible?: boolean;
    selectedDays?: number[];
    intervalValue?: number;
    intervalType?: string;
    cycleDaysOn?: number;
    cycleDaysOff?: number;
}

// A schedule counts as "past" (removed from active management, kept
// visible here for the same reason the calendar keeps showing it on past
// dates - it's real history) once it's been deleted, or once its own
// endDate has passed on its own.
function isPastSchedule(schedule: MedSchedule): boolean {
    if (schedule.isDeleted) return true;
    if (schedule.endDate && new Date(schedule.endDate) < new Date()) return true;
    return false;
}

export default function ManageMedicationsScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [schedules, setSchedules] = useState<MedSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };
    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await getMedicineSchedules();
            const list: MedSchedule[] = res?.data ?? res ?? [];
            setSchedules(list);
        } catch (e) {
            console.error('Failed to load medication schedules', e);
        } finally {
            setLoading(false);
        }
    };

    // useFocusEffect (not a plain useEffect) so returning from AddMedication
    // after adding/editing a schedule refreshes this list automatically,
    // instead of only fetching once on initial mount.
    useFocusEffect(
        useCallback(() => {
            fetchSchedules();
        }, [])
    );

    const handleEdit = (schedule: MedSchedule) => {
        navigation.navigate('AddMedication', { editingSchedule: schedule });
    };

    const handleDelete = (id: string, name: string) => {
        showStatus(
            'warning',
            'Delete Medication',
            `Are you sure you want to delete ${name}? This cannot be undone.`,
            async () => {
                hideStatus();
                try {
                    await deleteMedicineSchedule(id);
                    setSchedules(prev => prev.filter(s => s._id !== id));
                } catch (e) {
                    showStatus('error', 'Error', 'Failed to delete medication.');
                }
            },
            'Delete'
        );
    };

    const activeSchedules = schedules.filter(s => !isPastSchedule(s));
    const pastSchedules = schedules.filter(isPastSchedule);

    const renderMedCard = (item: MedSchedule, isPast: boolean) => (
        <View key={item._id} style={[styles.medCard, (!item.isActive || isPast) && styles.disabledCard]}>
            <View style={styles.medIconBox}>
                <Pill size={20} color={!item.isActive || isPast ? '#94A3B8' : '#0FBBA1'} />
            </View>

            <View style={styles.medInfo}>
                <Text style={[styles.medName, (!item.isActive || isPast) && styles.disabledText]}>
                    {item.medicineName}
                </Text>
                <Text style={styles.medDosage}>
                    {item.dosage} · {item.scheduleType}
                    {item.times?.length ? ` · ${item.times.join(', ')}` : ''}
                </Text>
            </View>

            {isPast ? (
                <View style={styles.pastBadge}>
                    <Text style={styles.pastBadgeText}>{item.isDeleted ? 'Removed' : 'Completed'}</Text>
                </View>
            ) : (
                <View style={styles.medActions}>
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => handleEdit(item)}
                        activeOpacity={0.7}
                    >
                        <Pencil size={16} color="#0FBBA1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDelete(item._id, item.medicineName)}
                        activeOpacity={0.7}
                    >
                        <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header - bare icon buttons (no circle background), matching
                the back/action button convention used across the rest of
                the app (e.g. FamilyMembersScreen, LabTestsHistoryScreen)
                rather than the filled-circle style this screen had before. */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Medications</Text>
                <TouchableOpacity style={styles.addHeaderBtn} onPress={() => navigation.navigate('AddMedication')} activeOpacity={0.7}>
                    <Plus size={22} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#0FBBA1" size="large" />
                </View>
            ) : schedules.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconBox}>
                        <Pill size={36} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>No Medications Added</Text>
                    <Text style={styles.emptySubtitle}>Add your medications to get daily reminders.</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddMedication')} activeOpacity={0.8}>
                        <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.emptyBtnText}>Add First Medication</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {activeSchedules.length > 0 && (
                        <>
                            <Text style={styles.sectionLabel}>EDIT OR REMOVE MEDICATION SCHEDULES</Text>
                            {activeSchedules.map(item => renderMedCard(item, false))}
                        </>
                    )}

                    {/* Kept visible (read-only) rather than disappearing once
                        deleted or naturally ended - the calendar still shows
                        these on the past dates they applied to as real
                        history, so this list shouldn't hide them entirely. */}
                    {pastSchedules.length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, styles.pastSectionLabel]}>PAST & REMOVED MEDICATIONS</Text>
                            {pastSchedules.map(item => renderMedCard(item, true))}
                        </>
                    )}
                </ScrollView>
            )}

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    addHeaderBtn: {
        padding: 8,
        marginRight: -8,
    },
    list: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        gap: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 12,
    },
    pastSectionLabel: {
        marginTop: 20,
    },
    pastBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
    },
    pastBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
    },
    medCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 12,
    },
    disabledCard: {
        backgroundColor: '#F8FAFC',
        opacity: 0.75,
    },
    medIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    medInfo: {
        flex: 1,
        gap: 3,
    },
    medName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    disabledText: {
        color: '#64748B',
        textDecorationLine: 'line-through',
    },
    medDosage: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    medActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    deleteBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyIconBox: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0FBBA1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#e5e7eb76',
    },
    emptyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
