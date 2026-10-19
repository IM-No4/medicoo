import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, ChevronRight, Clock, Stethoscope } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
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
import { getMyDoctorReview } from '../../../../services/api/doctor.api';
import { API_BASE_URL } from '../../../../services/api/client';
import { formatDoctorName } from '../../../../utils/formatters';
import BookingBadge, { BookingInfo } from '../../../doctor/components/BookingBadge';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Consultation {
    requestId: string;
    doctorId?: string;
    doctorName: string;
    doctorSpecialization: string;
    doctorImage?: string;
    preferredDate: string;
    preferredTime: string;
    booking?: BookingInfo | null;
    myRole?: 'booker' | 'patient' | null;
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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | Consultation['status']>('all');
    // Reviews are keyed by (doctorId, customerId), not per-consultation (see
    // saveDoctorReview on the backend) - so "already rated" is checked per
    // doctor, not per completed appointment.
    const [reviewedDoctorIds, setReviewedDoctorIds] = useState<Set<string>>(new Set());

    const fetchConsultations = useCallback(async () => {
        try {
            const responseData = await getMyAppointmentRequests({ limit: 50 });
            const list: Consultation[] = responseData?.data?.appointmentRequests || [];
            setConsultations(list);

            const completedDoctorIds = Array.from(
                new Set(
                    list
                        .filter((c) => c.status === 'completed' && c.doctorId)
                        .map((c) => c.doctorId as string)
                )
            );
            const reviewChecks = await Promise.all(
                completedDoctorIds.map(async (doctorId) => {
                    try {
                        const review = await getMyDoctorReview(doctorId);
                        return review ? doctorId : null;
                    } catch {
                        return null;
                    }
                })
            );
            setReviewedDoctorIds(new Set(reviewChecks.filter((id): id is string => !!id)));
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
                                <Stethoscope size={24} color="#10B981" />
                            </View>
                        )}
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                    <View style={styles.textDetails}>
                        <Text style={styles.doctorName}>{formatDoctorName(item.doctorName)}</Text>
                        <Text style={styles.specialtyText}>{item.doctorSpecialization}</Text>
                        <BookingBadge booking={item.booking} myRole={item.myRole} />
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{STATUS_LABELS[item.status]}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                    <Calendar size={14} color={theme.textSecondary} />
                    <Text style={styles.infoLabel}>{new Date(item.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Clock size={14} color={theme.textSecondary} />
                    <Text style={styles.infoLabel}>{item.preferredTime}</Text>
                </View>
            </View>

            {item.status === 'completed' && item.doctorId && !reviewedDoctorIds.has(item.doctorId) && (
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
                    <Text style={styles.feedbackText}>{t('share_your_experience_rate_the_doctor')}</Text>
                    <ChevronRight size={16} color="#10B981" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('my_consultations')}</Text>
                <View style={{ width: 40 }} />
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
                                {t(option.label)}
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
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Calendar size={40} color={theme.textMuted} />
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
                            <ActivityIndicator size="large" color="#10B981" />
                        </View>
                    )
                }
            />
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    // Same header recipe as the rest of the Profile screens - white bar +
    // shadow, plain icon back button, fontSize 20/600/#111827 title.
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
    },
    filterBar: {
        backgroundColor: c.card,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
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
        borderColor: c.border,
        backgroundColor: c.card,
    },
    filterChipSelected: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: c.textSecondary,
    },
    filterChipTextSelected: {
        color: '#fff',
    },
    listContent: {
        paddingTop: 16,
        paddingBottom: 84,
    },
    card: {
        backgroundColor: c.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
        marginHorizontal: 16,
        marginBottom: 12,
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
        backgroundColor: c.successBg,
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
        color: c.text,
    },
    specialtyText: {
        fontSize: 13,
        color: c.textSecondary,
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
        backgroundColor: c.cardSecondary,
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
        color: c.textSecondary,
        fontWeight: '500',
    },
    feeContainer: {
        marginLeft: 'auto',
    },
    feeText: {
        fontSize: 16,
        fontWeight: '800',
        color: c.text,
    },
    feedbackBanner: {
        marginTop: 16,
        backgroundColor: c.successBg,
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
        color: c.success,
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
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: c.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    loadingContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
});
