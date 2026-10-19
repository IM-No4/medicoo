import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from '../../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal from '../../../components/modals/StatusModal';
import {
    fetchBloodRequestById,
    respondToBloodRequest,
    resetRespondStatus,
} from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch, RootState } from '../../../redux/store';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const URGENCY_COLORS: Record<string, string> = {
    NORMAL: '#3B82F6',
    HIGH: '#F59E0B',
    CRITICAL: '#EF4444',
};

export default function BloodRequestDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
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
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{request.isRequester ? 'Your Blood Request' : 'Blood Request'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.urgentBadge}>
                    <AppIcon name="droplet" size={16} color="#FFFFFF" />
                    <Text style={styles.urgentBadgeText}>{request.bloodGroup} needed</Text>
                </View>

                <View style={styles.card}>
                    <Row label={t('hospital')} value={request.hospital} />
                    <Row label={t('location')} value={request.location} />
                    {request.unitsRequired ? <Row label={t('units_required')} value={String(request.unitsRequired)} /> : null}
                    <Row
                        label={t('urgency')}
                        value={request.urgencyLevel}
                        valueColor={URGENCY_COLORS[request.urgencyLevel] || '#374151'}
                    />
                    {!request.isRequester && request.distanceKm !== null && (
                        <Row label={t('distance')} value={`${request.distanceKm} km away`} />
                    )}
                    <Row label={t('status')} value={request.status} valueColor={request.status === 'OPEN' ? '#10B981' : '#6B7280'} />
                </View>

                {request.isRequester && request.contactNumber && (
                    <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`tel:${request.contactNumber}`)}
                    >
                        <AppIcon name="phone" size={16} color={theme.text} />
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
                        <Text style={styles.statusMessageSuccessText}>{t('you_re_confirmed_for_this_donation_tha')}</Text>
                    </View>
                )}

                {iWasTooLate && (
                    <View style={styles.statusMessage}>
                        <Text style={styles.statusMessageText}>{t('another_donor_already_accepted_this_re')}</Text>
                    </View>
                )}

                {canRespond && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleRespond('DECLINE')}
                            disabled={respondStatus === 'loading'}
                        >
                            <Text style={styles.declineText}>{t('not_available')}</Text>
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
                                    <Text style={styles.acceptText}>{t('can_donate')}</Text>
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
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
    centerState: { alignItems: 'center', justifyContent: 'center' },
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
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
        backgroundColor: c.cardSecondary,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
        padding: 16,
        gap: 12,
        marginBottom: 20,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowLabel: { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
    rowValue: { fontSize: 14, color: c.text, fontWeight: '700' },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    contactText: { fontSize: 14, color: c.text, fontWeight: '600' },
    statusMessage: {
        backgroundColor: c.cardSecondary,
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    statusMessageText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
    statusMessageSuccess: { backgroundColor: c.successBg },
    statusMessageSuccessText: { fontSize: 13, color: c.success, lineHeight: 19, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    declineButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.cardSecondary,
        borderRadius: 12,
    },
    declineText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
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
