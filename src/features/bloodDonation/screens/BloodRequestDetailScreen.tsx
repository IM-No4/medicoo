import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal from '../../../components/modals/StatusModal';
import {
    fetchBloodRequestById,
    respondToBloodRequest,
    resetRespondStatus,
} from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch, RootState } from '../../../redux/store';

const URGENCY_COLORS: Record<string, string> = {
    NORMAL: '#3B82F6',
    HIGH: '#F59E0B',
    CRITICAL: '#EF4444',
};

export default function BloodRequestDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { requestId } = route.params || {};
    const dispatch = useDispatch<AppDispatch>();

    const { currentRequestDetail: request, requestDetailLoading: loading, respondStatus, respondError } =
        useSelector((state: RootState) => state.bloodDonation);

    useEffect(() => {
        if (requestId) {
            dispatch(fetchBloodRequestById(requestId));
        }
        return () => {
            dispatch(resetRespondStatus());
        };
    }, [dispatch, requestId]);

    const handleRespond = (response: 'ACCEPT' | 'DECLINE') => {
        if (!requestId) return;
        dispatch(respondToBloodRequest({ requestId, response }));
    };

    const closeStatusModal = () => {
        dispatch(resetRespondStatus());
        if (respondStatus === 'success') {
            navigation.goBack();
        }
    };

    if (loading || !request) {
        return (
            <View style={[styles.container, styles.centerState]}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#EF4444" />
            </View>
        );
    }

    const canRespond = !request.isRequester && request.status === 'OPEN' && !request.myResponse;
    const iWasTooLate = !request.isRequester && (request.myResponse === 'TOO_LATE' || (request.status === 'FULFILLED' && request.myResponse !== 'ACCEPTED'));
    const iAccepted = request.myResponse === 'ACCEPTED';

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AppIcon name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{request.isRequester ? 'Your Blood Request' : 'Blood Request'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.urgentBadge}>
                    <AppIcon name="droplet" size={16} color="#FFFFFF" />
                    <Text style={styles.urgentBadgeText}>{request.bloodGroup} needed</Text>
                </View>

                <View style={styles.card}>
                    <Row label="Hospital" value={request.hospital} />
                    <Row label="Location" value={request.location} />
                    {request.unitsRequired ? <Row label="Units required" value={String(request.unitsRequired)} /> : null}
                    <Row
                        label="Urgency"
                        value={request.urgencyLevel}
                        valueColor={URGENCY_COLORS[request.urgencyLevel] || '#374151'}
                    />
                    {!request.isRequester && request.distanceKm !== null && (
                        <Row label="Distance" value={`${request.distanceKm} km away`} />
                    )}
                    <Row label="Status" value={request.status} valueColor={request.status === 'OPEN' ? '#2FA561' : '#6B7280'} />
                </View>

                {request.isRequester && request.contactNumber && (
                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`tel:${request.contactNumber}`)}
                    >
                        <AppIcon name="phone" size={16} color="#374151" />
                        <Text style={styles.contactText}>Contact: {request.contactNumber}</Text>
                    </TouchableOpacity>
                )}

                {request.isRequester && (
                    <View style={styles.statusMessage}>
                        <Text style={styles.statusMessageText}>
                            {request.status === 'OPEN' && 'Nearby eligible donors have been notified. We\'ll let you know the moment someone accepts.'}
                            {request.status === 'FULFILLED' && 'A donor has accepted your request and will be in touch shortly.'}
                            {request.status === 'EXPIRED' && 'This request has expired without a donor accepting.'}
                            {request.status === 'CANCELLED' && 'This request was cancelled.'}
                        </Text>
                    </View>
                )}

                {iAccepted && (
                    <View style={[styles.statusMessage, styles.statusMessageSuccess]}>
                        <Text style={styles.statusMessageSuccessText}>You're confirmed for this donation. Thank you for helping!</Text>
                    </View>
                )}

                {iWasTooLate && (
                    <View style={styles.statusMessage}>
                        <Text style={styles.statusMessageText}>Another donor already accepted this request - thanks for being ready to help.</Text>
                    </View>
                )}

                {canRespond && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleRespond('DECLINE')}
                            disabled={respondStatus === 'loading'}
                        >
                            <Text style={styles.declineText}>Not Available</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={() => handleRespond('ACCEPT')}
                            disabled={respondStatus === 'loading'}
                        >
                            {respondStatus === 'loading' ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <>
                                    <Text style={styles.acceptText}>I Can Donate</Text>
                                    <AppIcon name="arrow-right" size={16} color="#FFFFFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <StatusModal
                visible={respondStatus === 'success' || respondStatus === 'already_filled' || respondStatus === 'error'}
                status={respondStatus === 'success' ? 'success' : respondStatus === 'already_filled' ? 'info' : 'error'}
                title={
                    respondStatus === 'success' ? "You're confirmed!" :
                        respondStatus === 'already_filled' ? 'Already filled' : 'Something went wrong'
                }
                message={
                    respondStatus === 'success' ? 'The patient has been notified that you can help.' :
                        respondStatus === 'already_filled' ? "Another donor already accepted this one - thanks for being ready!" :
                            (respondError || 'Please try again.')
                }
                onClose={closeStatusModal}
            />
        </View>
    );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    centerState: { alignItems: 'center', justifyContent: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    content: { padding: 24 },
    urgentBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EF4444',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    urgentBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        padding: 16,
        gap: 12,
        marginBottom: 20,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    rowValue: { fontSize: 14, color: '#111827', fontWeight: '700' },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    contactText: { fontSize: 14, color: '#374151', fontWeight: '600' },
    statusMessage: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    statusMessageText: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
    statusMessageSuccess: { backgroundColor: '#F0FDF4' },
    statusMessageSuccessText: { fontSize: 13, color: '#166534', lineHeight: 19, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    declineText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
    acceptButton: {
        flex: 2,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DC2626',
        borderRadius: 12,
        gap: 8,
    },
    acceptText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
