import { StatusBar } from 'expo-status-bar';
import { Calendar, Check, ChevronLeft, Clock, MapPin, MessageSquare, Phone, Video, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';

// Mock Data
const MOCK_REQUESTS = [
    {
        id: 'r1',
        patientName: 'Emma Watson',
        date: '2026-02-06',
        time: '10:00 AM',
        type: 'video',
        status: 'Pending',
        reason: 'Severe headache and nausea for 2 days.',
        image: null
    },
    {
        id: 'r2',
        patientName: 'Liam Neeson',
        date: '2026-02-07',
        time: '03:30 PM',
        type: 'clinic',
        status: 'Pending',
        reason: 'Regular checkup follow-up.',
        image: null
    }
];

export default function DoctorPendingRequestsScreen() {
    const insets = useSafeAreaInsets();
    const [requests, setRequests] = useState(MOCK_REQUESTS);

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

    const handleAction = (request: any, type: 'accept' | 'decline') => {
        showStatus(
            type === 'accept' ? 'info' : 'warning',
            type === 'accept' ? 'Accept Request?' : 'Decline Request?',
            type === 'accept'
                ? `Confirm appointment for ${request.patientName} on ${request.date} at ${request.time}?`
                : `Are you sure you want to decline this request? The patient will be notified.`,
            () => {
                setRequests(prev => prev.filter(r => r.id !== request.id));
                hideStatus();
                setTimeout(() => {
                    showStatus(
                        type === 'accept' ? 'success' : 'info',
                        type === 'accept' ? 'Approved' : 'Declined',
                        type === 'accept' ? 'Appointment request accepted successfully' : 'Appointment request declined'
                    );
                }, 400);
            },
            type === 'accept' ? 'Confirm' : 'Decline'
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

    const renderRequestItem = ({ item }: { item: any }) => (
        <View style={styles.requestCard}>
            <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.patientName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.patientName}>{item.patientName}</Text>
                        <Text style={styles.timeAgo}>Requested today</Text>
                    </View>
                </View>
                <View style={styles.typeBadge}>
                    {getTypeIcon(item.type)}
                </View>
            </View>

            <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Reason:</Text>
                <Text style={styles.reasonText}>{item.reason}</Text>
            </View>

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

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() => handleAction(item, 'decline')}
                >
                    <X size={18} color="#DC2626" />
                    <Text style={[styles.actionText, { color: '#DC2626' }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAction(item, 'accept')}
                >
                    <Check size={18} color="#fff" />
                    <Text style={[styles.actionText, { color: '#fff' }]}>Accept Request</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pending Requests</Text>
                <TouchableOpacity
                    onPress={() => executeAction('OPEN_MANAGE_APPOINTMENTS')}
                    style={styles.calendarButton}
                >
                    <Calendar size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={requests}
                renderItem={renderRequestItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyText}>No pending requests.</Text></View>}
            />

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
    calendarButton: { padding: 8, marginRight: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    listContent: { padding: 16, gap: 16 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#9CA3AF' },

    // Request Card
    requestCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1
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
    timeAgo: { fontSize: 12, color: '#6B7280' },
    typeBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center'
    },
    reasonBox: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        marginBottom: 12
    },
    reasonLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 2 },
    reasonText: { fontSize: 13, color: '#374151', fontStyle: 'italic' },
    detailsRow: { flexDirection: 'row', gap: 24 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailText: { fontSize: 14, color: '#6B7280' },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1
    },
    declineBtn: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
    acceptBtn: { borderColor: '#2FA561', backgroundColor: '#2FA561' },
    actionText: { fontSize: 14, fontWeight: '600' }
});
