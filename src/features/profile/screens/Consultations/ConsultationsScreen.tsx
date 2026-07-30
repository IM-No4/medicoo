import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, ChevronRight, Clock, Search, Stethoscope } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getConsultations } from '../../../../services/api';

interface Consultation {
    _id: string;
    doctorId: {
        _id: string;
        name: string;
        specialty: string;
        image?: string;
    };
    date: string;
    time: string;
    status: 'Upcoming' | 'Completed' | 'Cancelled' | 'In Progress';
    type: 'Video' | 'Clinic' | 'Hospital';
    fee: number;
    hasFeedback?: boolean;
}

export default function ConsultationsScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [consultations, setConsultations] = useState<Consultation[]>([]);

    const fetchConsultations = useCallback(async () => {
        try {
            const responseData = await getConsultations();
            // Handle both direct array and wrapped array structures
            const list = Array.isArray(responseData)
                ? responseData
                : (responseData?.consultations || responseData?.data || []);
            setConsultations(list);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Upcoming': return '#3B82F6';
            case 'Completed': return '#10B981';
            case 'Cancelled': return '#EF4444';
            case 'In Progress': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const renderItem = ({ item }: { item: Consultation }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => executeAction('OPEN_CONSULTATION_DETAIL', { consultationId: item._id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.doctorInfo}>
                    <View style={styles.avatarContainer}>
                        {item.doctorId.image ? (
                            <Image source={{ uri: item.doctorId.image }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Stethoscope size={24} color="#2FA561" />
                            </View>
                        )}
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    </View>
                    <View style={styles.textDetails}>
                        <Text style={styles.doctorName}>{item.doctorId.name}</Text>
                        <Text style={styles.specialtyText}>{item.doctorId.specialty}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.infoLabel}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Clock size={14} color="#6B7280" />
                    <Text style={styles.infoLabel}>{item.time}</Text>
                </View>
                <View style={styles.feeContainer}>
                    <Text style={styles.feeText}>₹{item.fee}</Text>
                </View>
            </View>

            {item.status === 'Completed' && !item.hasFeedback && (
                <TouchableOpacity
                    style={styles.feedbackBanner}
                    onPress={() => executeAction('OPEN_DOCTOR_FEEDBACK', { consultationId: item._id, doctor: item.doctorId })}
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
                <TouchableOpacity style={styles.searchButton}>
                    <Search size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={consultations}
                renderItem={renderItem}
                keyExtractor={item => item._id}
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
                            <Text style={styles.emptyTitle}>No Consultations Yet</Text>
                            <Text style={styles.emptySubtitle}>Your medical appointments will appear here.</Text>
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
    searchButton: {
        padding: 8,
        marginRight: -12,
    },
    listContent: {
        padding: 20,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 3,
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
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
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
