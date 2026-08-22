import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, ChevronRight, Clock, Stethoscope } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getMyAppointmentRequests } from '../../../../services/api';
import { API_BASE_URL } from '../../../../services/api/client';
import { formatDoctorName } from '../../../../utils/formatters';

interface Consultation {
    requestId: string;
    doctorId?: string;
    doctorName: string;
    doctorSpecialization: string;
    doctorImage?: string;
    preferredDate: string;
    preferredTime: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'no_show';
}

const STATUS_LABELS: Record<Consultation['status'], string> = {
    pending: 'Pending',
    approved: 'Upcoming',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    expired: 'Expired',
    no_show: 'Missed',
};

const FILTER_OPTIONS: { key: 'all' | Consultation['status']; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'expired', label: 'Expired' },
    { key: 'no_show', label: 'Missed' },
];

export default function ConsultationsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | Consultation['status']>('all');

    const fetchConsultations = useCallback(async () => {
        try {
            const responseData = await getMyAppointmentRequests({ limit: 50 });
            setConsultations(responseData?.data?.appointmentRequests || []);
        } catch (error) {
            console.error('Error fetching consultations:', error);
            // No fallback mocks to display only actual backend data
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchConsultations();
        }, [fetchConsultations])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchConsultations();
    }, [fetchConsultations]);

    const filteredConsultations = useMemo(() => {
        if (statusFilter === 'all') return consultations;
        return consultations.filter(c => c.status === statusFilter);
    }, [consultations, statusFilter]);

    const getStatusColor = (status: Consultation['status']) => {
        switch (status) {
            case 'approved': return '#3B82F6';
            case 'completed': return '#10B981';
            case 'rejected':
            case 'cancelled': return '#EF4444';
            case 'pending': return '#F59E0B';
            case 'expired': return '#9CA3AF';
            case 'no_show': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const renderItem = ({ item }: { item: Consultation }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => executeAction('OPEN_CONSULTATION_DETAIL', { requestId: item.requestId })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                    <View style={styles.avatarContainer}>
                        {item.doctorImage ? (
                            <Image
                                source={{
                                    uri: item.doctorImage.startsWith('http')
                                        ? item.doctorImage
                                        : `${API_BASE_URL}/${item.doctorImage}`,
                                }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Stethoscope size={24} color="#2FA561" />
                            </View>
                        )}
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                    <View style={styles.textDetails}>
                        <Text style={styles.doctorName}>{formatDoctorName(item.doctorName)}</Text>
                        <Text style={styles.specialtyText}>{item.doctorSpecialization}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{STATUS_LABELS[item.status]}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.infoLabel}>{new Date(item.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.infoLabel}>{item.preferredTime}</Text>
                </View>
            </View>

            {item.status === 'completed' && (
                <TouchableOpacity
                    style={styles.feedbackBanner}
                    onPress={() => executeAction('OPEN_DOCTOR_FEEDBACK', {
                        consultationId: item.requestId,
                        doctor: {
                            _id: item.doctorId,
                            name: formatDoctorName(item.doctorName),
                            image: item.doctorImage,
                            specialty: item.doctorSpecialization,
                        },
                    })}
                >
                    <Text style={styles.feedbackText}>Share your experience. Rate the doctor</Text>
                    <ChevronRight size={16} color="#2FA561" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Consultations</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {FILTER_OPTIONS.map(option => (
                        <TouchableOpacity
                            key={option.key}
                            style={[styles.filterChip, statusFilter === option.key && styles.filterChipSelected]}
                            onPress={() => setStatusFilter(option.key)}
                        >
                            <Text style={[styles.filterChipText, statusFilter === option.key && styles.filterChipTextSelected]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredConsultations}
                renderItem={renderItem}
                keyExtractor={item => item.requestId}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2FA561']} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Calendar size={40} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {statusFilter === 'all' ? 'No Consultations Yet' : `No ${STATUS_LABELS[statusFilter]} Consultations`}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {statusFilter === 'all'
                                    ? 'Your medical appointments will appear here.'
                                    : 'Try a different filter to see more consultations.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#2FA561" />
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    filterBar: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    filterChipSelected: {
        backgroundColor: '#2FA561',
        borderColor: '#2FA561',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
    },
    filterChipTextSelected: {
        color: '#fff',
    },
    listContent: {
        padding: 0,
        marginTop: 16,
        paddingTop: 12,
        paddingBottom: 84,
        gap: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        backgroundColor: '#fff',
    },
    card: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    doctorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 16,
    },
    placeholderAvatar: {
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#fff',
    },
    textDetails: {
        gap: 2,
    },
    doctorName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    specialtyText: {
        fontSize: 13,
        color: '#6B7280',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    divider: {
        height: 0,
        backgroundColor: '#F3F4F6',
        marginVertical: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoLabel: {
        fontSize: 13,
        color: '#4B5563',
        fontWeight: '500',
    },
    feeContainer: {
        marginLeft: 'auto',
    },
    feeText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    feedbackBanner: {
        marginTop: 16,
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    feedbackText: {
        fontSize: 13,
        color: '#166534',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
});
