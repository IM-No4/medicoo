import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Pencil, Pill, Plus, Trash2 } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { getMedicineSchedules, deleteMedicineSchedule } from '../../services/api/medicine.api';
import AddMedicationModal from '../../components/modals/AddMedicationModal/AddMedicationModal';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';

interface MedSchedule {
    _id: string;
    medicineName: string;
    dosage: string;
    scheduleType: string;
    isActive: boolean;
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

export default function ManageMedicationsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [schedules, setSchedules] = useState<MedSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MedSchedule | null>(null);
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

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleEdit = (schedule: MedSchedule) => {
        setEditingSchedule(schedule);
        setShowAddModal(true);
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

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />

            {/* Header - bare icon buttons (no circle background), matching
                the back/action button convention used across the rest of
                the app (e.g. FamilyMembersScreen, LabTestsHistoryScreen)
                rather than the filled-circle style this screen had before. */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Medications</Text>
                <TouchableOpacity style={styles.addHeaderBtn} onPress={() => { setEditingSchedule(null); setShowAddModal(true); }} activeOpacity={0.7}>
                    <Plus size={22} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#2FA561" size="large" />
                </View>
            ) : schedules.length === 0 ? (
                <View style={styles.center}>
                    <View style={styles.emptyIconBox}>
                        <Pill size={36} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>No Medications Added</Text>
                    <Text style={styles.emptySubtitle}>Add your medications to get daily reminders.</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => { setEditingSchedule(null); setShowAddModal(true); }} activeOpacity={0.8}>
                        <Plus size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.emptyBtnText}>Add First Medication</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={schedules}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={
                        <Text style={styles.sectionLabel}>EDIT OR REMOVE MEDICATION SCHEDULES</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={[styles.medCard, !item.isActive && styles.disabledCard]}>
                            <View style={styles.medIconBox}>
                                <Pill size={20} color={item.isActive ? '#2FA561' : '#94A3B8'} />
                            </View>

                            <View style={styles.medInfo}>
                                <Text style={[styles.medName, !item.isActive && styles.disabledText]}>
                                    {item.medicineName}
                                </Text>
                                <Text style={styles.medDosage}>
                                    {item.dosage} · {item.scheduleType}
                                    {item.times?.length ? ` · ${item.times.join(', ')}` : ''}
                                </Text>
                            </View>

                            <View style={styles.medActions}>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => handleEdit(item)}
                                    activeOpacity={0.7}
                                >
                                    <Pencil size={16} color="#2FA561" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={() => handleDelete(item._id, item.medicineName)}
                                    activeOpacity={0.7}
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            )}

            <AddMedicationModal
                visible={showAddModal}
                editingSchedule={editingSchedule}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingSchedule(null);
                    fetchSchedules();
                }}
            />

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
        paddingHorizontal: 20,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
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
    medCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
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
        backgroundColor: '#2FA561',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 14,
        shadowColor: '#2FA561',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
