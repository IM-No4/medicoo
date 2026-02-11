import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, ChevronLeft, Clock, Edit2, Inbox, MapPin, MessageSquare, Phone, Plus, Trash2, Video } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Platform, ScrollView, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';

// Mock Data
const MOCK_REQUESTS = [
    { id: 'r1', patientName: 'Emma Watson', date: '2026-02-06', time: '10:00 AM', status: 'Pending' },
    { id: 'r2', patientName: 'Liam Neeson', date: '2026-02-07', time: '03:30 PM', status: 'Pending' }
];

const MOCK_UPCOMING = [
    {
        id: '1',
        patientName: 'John Doe',
        date: '2026-02-04',
        time: '10:00 AM',
        type: 'video',
        status: 'Confirmed',
        image: null
    },
    {
        id: '2',
        patientName: 'Alice Smith',
        date: '2026-02-04',
        time: '11:30 AM',
        type: 'clinic',
        status: 'Confirmed',
        image: null
    }
];

const MOCK_SLOTS = [
    { id: 's1', date: '2026-02-04', time: '09:00 AM', duration: '30 min', status: 'Available' },
    { id: 's2', date: '2026-02-04', time: '02:00 PM', duration: '45 min', status: 'Available' },
    { id: 's3', date: '2026-02-05', time: '10:00 AM', duration: '30 min', status: 'Booked' },
];

const SLOT_DURATIONS = ['15 min', '30 min', '45 min', '60 min'];

export default function ManageAppointmentsScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const initialTab = route.params?.initialTab || 'upcoming';

    // State
    const [requests] = useState(MOCK_REQUESTS); // Just for badge count
    const [upcoming, setUpcoming] = useState(MOCK_UPCOMING);
    const [slots, setSlots] = useState(MOCK_SLOTS);
    const [activeTab, setActiveTab] = useState(initialTab === 'upcoming' ? 'upcoming' : 'upcoming');

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    // Create Slot Modal State
    const [createSlotVisible, setCreateSlotVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [selectedDuration, setSelectedDuration] = useState('30 min');
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Generate next 7 days data
    const generateNext7Days = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const [weekDays] = useState(generateNext7Days());
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    // Group slots by date for SectionList
    const groupedSlots = React.useMemo(() => {
        const groups: { [key: string]: any[] } = {};
        slots.forEach(slot => {
            if (!groups[slot.date]) {
                groups[slot.date] = [];
            }
            groups[slot.date].push(slot);
        });

        return Object.keys(groups).sort().map(date => ({
            title: date,
            data: groups[date].sort((a, b) => a.time.localeCompare(b.time))
        }));
    }, [slots]);

    useEffect(() => {
        if (initialTab && initialTab !== 'requests') {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleCreateSlot = () => {
        const dateObj = weekDays[selectedDayIndex];
        const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

        const newSlot = {
            id: Date.now().toString(),
            date: dateStr,
            time: timeStr,
            duration: selectedDuration,
            status: 'Available'
        };

        setSlots(prev => [...prev, newSlot]);
        setCreateSlotVisible(false);
        showStatus('success', 'Slot Created', `Your availability on ${dateObj.toLocaleDateString()} at ${timeStr} has been added.`);
    };

    const deleteSlot = (slotId: string) => {
        showStatus(
            'warning',
            'Delete Slot?',
            'Are you sure you want to remove this availability slot? Patients won\'t be able to book this time.',
            () => {
                setSlots(prev => prev.filter(s => s.id !== slotId));
                hideStatus();
            },
            'Delete'
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} color="#2FA561" />;
            case 'voice': return <Phone size={16} color="#2FA561" />;
            case 'chat': return <MessageSquare size={16} color="#2FA561" />;
            case 'clinic': return <MapPin size={16} color="#2FA561" />;
            default: return <Video size={16} color="#2FA561" />;
        }
    };

    const renderAppointmentItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => executeAction('OPEN_PATIENT_CONSULTATION_DETAIL', { appointment: item })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.patientName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.patientName}>{item.patientName}</Text>
                        <Text style={styles.statusText}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.typeBadge}>
                    {getTypeIcon(item.type)}
                </View>
            </View>
            |
            <View style={styles.divider} />

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.date}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.time}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButtonOutline}
                    onPress={() => showStatus('info', 'Coming Soon', 'Rescheduling feature will be available in the next update.')}
                >
                    <Text style={styles.actionTextOutline}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButtonFilled}
                    onPress={() => {
                        if (item.type === 'chat') {
                            executeAction('OPEN_DOCTOR_CHAT', { appointment: item });
                        } else if (item.type === 'video' || item.type === 'voice') {
                            executeAction('OPEN_DOCTOR_CALL', {
                                appointment: item,
                                type: item.type === 'voice' ? 'voice' : 'video'
                            });
                        } else {
                            executeAction('OPEN_PATIENT_CONSULTATION_DETAIL', { appointment: item });
                        }
                    }}
                >
                    <Text style={styles.actionTextFilled}>
                        {item.type === 'chat' ? 'Join Chat' :
                            (item.type === 'video' || item.type === 'voice') ? 'Join Call' : 'View Details'}
                    </Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderSlotItem = ({ item, index, section }: { item: any; index: number; section: any }) => {
        const isFirst = index === 0;
        const isLast = index === section.data.length - 1;

        return (
            <View style={[
                styles.slotRow,
                isFirst && styles.slotRowFirst,
                isLast && styles.slotRowLast,
                !isLast && styles.slotRowSeparator
            ]}>
                <View style={styles.slotMainInfo}>
                    <View style={styles.timeIconBox}>
                        <Clock size={16} color="#6B7280" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.slotTime}>{item.time}</Text>
                        <Text style={styles.slotDuration}>{item.duration} session</Text>
                    </View>
                </View>

                <View style={styles.slotRightSection}>
                    <View style={[styles.statusBadge, item.status === 'Booked' ? styles.statusBooked : styles.statusAvailable]}>
                        <View style={[styles.statusDot, item.status === 'Booked' ? { backgroundColor: '#3B82F6' } : { backgroundColor: '#2FA561' }]} />
                        <Text style={[styles.statusBadgeText, item.status === 'Booked' ? styles.textBooked : styles.textAvailable]}>
                            {item.status}
                        </Text>
                    </View>

                    <View style={styles.slotActions}>
                        <TouchableOpacity style={styles.iconBtnMinimal} onPress={() => showStatus('info', 'Feature Locked', 'Slot editing will be enabled in the upcoming dashboard update.')}>
                            <Edit2 size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconBtnMinimal, styles.deleteBtnBgMinimal]} onPress={() => deleteSlot(item.id)}>
                            <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Appointments</Text>

                {/* Inbox Button */}
                <TouchableOpacity style={styles.inboxBtn} onPress={() => executeAction('OPEN_DOCTOR_PENDING_REQUESTS')}>
                    <Inbox size={24} color="#111827" />
                    {requests.length > 0 && (
                        <View style={styles.inboxBadge}>
                            <Text style={styles.inboxBadgeText}>{requests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Tab Bar */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'upcoming' && styles.activeTabItem]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabLabel, activeTab === 'upcoming' && styles.activeTabLabel]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'slots' && styles.activeTabItem]}
                    onPress={() => setActiveTab('slots')}
                >
                    <Text style={[styles.tabLabel, activeTab === 'slots' && styles.activeTabLabel]}>Slots</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === 'history' && styles.activeTabItem]}
                    onPress={() => setActiveTab('history')}
                >
                    <Text style={[styles.tabLabel, activeTab === 'history' && styles.activeTabLabel]}>History</Text>
                </TouchableOpacity>
            </View>

            {/* Content Areas */}
            {activeTab === 'upcoming' && (
                <FlatList
                    data={upcoming}
                    renderItem={renderAppointmentItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No upcoming appointments.</Text></View>}
                />
            )}

            {activeTab === 'slots' && (
                <SectionList
                    sections={groupedSlots}
                    keyExtractor={item => item.id}
                    renderItem={renderSlotItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <View style={styles.sectionHeaderContainer}>
                            <Text style={styles.sectionHeaderTitle}>
                                {new Date(title).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                    )}
                    contentContainerStyle={styles.slotsListContent}
                    stickySectionHeadersEnabled={false}
                    ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No slots created yet.</Text></View>}
                />
            )}

            {activeTab === 'history' && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No appointment history.</Text>
                </View>
            )}

            {/* Floating Action Button for Create Slot - Only show on Slots tab */}
            {activeTab === 'slots' && (
                <TouchableOpacity
                    style={[styles.fab, { bottom: insets.bottom + 20 }]}
                    onPress={() => setCreateSlotVisible(true)}
                >
                    <Plus size={28} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Create Slot Bottom Sheet Modal */}
            <Modal transparent visible={createSlotVisible} animationType="slide" onRequestClose={() => setCreateSlotVisible(false)}>
                <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setCreateSlotVisible(false)}>
                    <TouchableOpacity activeOpacity={1} style={[styles.sheetContent, { paddingBottom: insets.bottom + 20 }]} onPress={e => e.stopPropagation()}>
                        <View style={styles.sheetHeaderIndicator} />
                        <Text style={styles.sheetTitle}>Create New Slot</Text>

                        <Text style={styles.sectionLabel}>Select Day</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
                            {weekDays.map((day, index) => {
                                const isSelected = index === selectedDayIndex;
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                                        onPress={() => setSelectedDayIndex(index)}
                                    >
                                        <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text style={[styles.dayNumber, isSelected && styles.dayTextSelected]}>
                                            {day.getDate()}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <Text style={styles.sectionLabel}>Select Start Time</Text>
                        <TouchableOpacity style={styles.timeSelector} onPress={() => setShowTimePicker(true)}>
                            <Clock size={20} color="#6B7280" />
                            <Text style={styles.timeSelectorText}>{selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </TouchableOpacity>
                        {showTimePicker && (
                            <DateTimePicker
                                value={selectedTime}
                                mode="time"
                                is24Hour={false}
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={(event, date) => {
                                    setShowTimePicker(Platform.OS === 'ios');
                                    if (date) setSelectedTime(date);
                                }}
                            />
                        )}

                        <Text style={styles.sectionLabel}>Duration</Text>
                        <View style={styles.durationRow}>
                            {SLOT_DURATIONS.map(dur => (
                                <TouchableOpacity
                                    key={dur}
                                    style={[styles.durationChip, selectedDuration === dur && styles.durationChipSelected]}
                                    onPress={() => setSelectedDuration(dur)}
                                >
                                    <Text style={[styles.durationText, selectedDuration === dur && styles.durationTextSelected]}>{dur}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.createBtn} onPress={handleCreateSlot}>
                            <Text style={styles.createBtnText}>Create Availability</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    inboxBtn: { padding: 8, position: 'relative' },
    inboxBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fff' },
    inboxBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

    // Tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB'
    },
    tabItem: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTabItem: { borderBottomColor: '#2FA561' },
    tabLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
    activeTabLabel: { color: '#2FA561', fontWeight: '700' },

    listContent: { padding: 16, gap: 16, paddingBottom: 100 },

    // Appointment Card Shared
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    patientInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#4F46E5' },
    patientName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
    statusText: { fontSize: 13, color: '#2FA561', fontWeight: '500' },
    typeBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center'
    },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    detailsRow: { flexDirection: 'row', gap: 24 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: '#6B7280' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
    actionButtonOutline: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center'
    },
    actionTextOutline: { color: '#374151', fontWeight: '600', fontSize: 14 },
    actionButtonFilled: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#2FA561',
        alignItems: 'center'
    },
    actionTextFilled: { color: '#fff', fontWeight: '600', fontSize: 14 },

    slotsListContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Slot Grid/Row
    slotRow: {
        backgroundColor: '#fff',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#E5E7EB'
    },
    slotRowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderTopWidth: 1 },
    slotRowLast: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderBottomWidth: 1, marginBottom: 20 },
    slotRowSeparator: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

    slotMainInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    timeIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
    slotTime: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    slotDuration: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
    slotRightSection: { alignItems: 'flex-end', gap: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusAvailable: { backgroundColor: '#F0FDF4' },
    statusBooked: { backgroundColor: '#EFF6FF' },
    statusBadgeText: { fontSize: 11, fontWeight: '600' },
    textAvailable: { color: '#2FA561' },
    textBooked: { color: '#3B82F6' },
    slotActions: { flexDirection: 'row', gap: 4 },
    iconBtnMinimal: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    deleteBtnBgMinimal: { backgroundColor: '#FEF2F2' },

    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF' },

    // FAB
    fab: {
        position: 'absolute',
        right: 20,
        backgroundColor: '#2FA561',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 }
    },
    fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Bottom Sheet
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheetContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 450 },
    sheetHeaderIndicator: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 12 },
    daysScroll: { gap: 12, paddingBottom: 8 },
    dayCard: { width: 60, height: 75, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: 'transparent' },
    dayCardSelected: { backgroundColor: '#F0FDF4', borderColor: '#2FA561' },
    dayName: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    dayNumber: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    dayTextSelected: { color: '#2FA561' },
    timeSelector: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    timeSelectorText: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
    durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    durationChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
    durationChipSelected: { backgroundColor: '#F0FDF4', borderColor: '#2FA561' },
    durationText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    durationTextSelected: { color: '#2FA561', fontWeight: '600' },
    createBtn: { backgroundColor: '#2FA561', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 32 },
    createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Section Header
    sectionHeaderContainer: { marginTop: 8, marginBottom: 8, paddingHorizontal: 4 },
    sectionHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }
});
