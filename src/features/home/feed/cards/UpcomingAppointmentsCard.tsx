import { ChevronRight, MessageCircle, Phone, Video } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getMyAppointmentRequests } from '../../../../services/api/doctor.api';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import SectionHeader from './SectionHeader';
import { formatDoctorName } from '../../../../utils/formatters';

type AppointmentItem = {
    requestId: string;
    status?: 'pending' | 'approved' | 'expired';
    expiryReason?: 'doctor_no_response' | 'patient_no_payment' | null;
    preferredDate?: string;
    preferredTime?: string;
    consultationType?: 'chat' | 'voice' | 'video';
    doctorId?: string;
    doctorName?: string;
    updatedOn?: string;
};

// An expired request stays on Home for a while so the patient actually sees
// what happened (and can book again) instead of only finding it in the
// notification list.
const EXPIRED_VISIBLE_MS = 48 * 60 * 60 * 1000;

// An expired request is only on Home so the patient sees it once; after they
// open it (and go book again) it must not come back.
const SEEN_EXPIRED_KEY = 'SEEN_EXPIRED_APPOINTMENT_REQUESTS_V1';

const getSeenExpired = async (): Promise<string[]> => {
    try {
        const raw = await AsyncStorage.getItem(SEEN_EXPIRED_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const markExpiredSeen = async (requestId: string) => {
    try {
        const seen = await getSeenExpired();
        if (seen.includes(requestId)) return;
        // keep the list small - old ids are past the 48h window anyway
        await AsyncStorage.setItem(SEEN_EXPIRED_KEY, JSON.stringify([requestId, ...seen].slice(0, 50)));
    } catch {
        // best effort - worst case the card shows once more
    }
};

const TYPE_META: Record<'chat' | 'voice' | 'video', { color: string; bg: string; Icon: typeof MessageCircle }> = {
    chat: { color: '#1C6ED5', bg: '#EAF4FF', Icon: MessageCircle },
    voice: { color: '#007C69', bg: '#EAFBF3', Icon: Phone },
    video: { color: '#C47A16', bg: '#FFF6EA', Icon: Video },
};

// Both list endpoints sort by createdOn (most recently requested first), not
// by the appointment's own scheduled time - re-sort here so "upcoming" here
// actually means "happening soonest", and drop anything already in the past
// (an 'approved' request whose time slipped by without being resolved yet
// shouldn't show as if it's still coming up).
const getAppointmentStart = (item: AppointmentItem): number => {
    if (!item.preferredDate || !item.preferredTime) return Infinity;
    const [hours, minutes] = item.preferredTime.split(':').map(Number);
    const date = new Date(item.preferredDate);
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date.getTime();
};

const formatWhen = (item: AppointmentItem) => {
    if (!item.preferredDate) return item.preferredTime || '';
    const date = new Date(item.preferredDate);
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return item.preferredTime ? `${dateLabel}, ${item.preferredTime}` : dateLabel;
};

export default function UpcomingAppointmentsCard() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const [upcomingItems, setUpcomingItems] = useState<AppointmentItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const load = async (status: 'pending' | 'approved' | 'expired'): Promise<AppointmentItem[]> => {
                try {
                    // This endpoint answers with data.appointmentRequests
                    const res = await getMyAppointmentRequests({ status, limit: 10 });
                    return res?.data?.appointmentRequests || [];
                } catch (error) {
                    console.warn(`Failed to load ${status} appointments for home screen:`, error);
                    return [];
                }
            };

            const [pendingList, approvedList, expiredList, seenExpired] = await Promise.all([
                load('pending'),
                load('approved'),
                load('expired'),
                getSeenExpired(),
            ]);
            const now = Date.now();

            // Requests still waiting on the doctor come first - that's the
            // thing the patient is anxious about right after booking.
            const pending = pendingList
                .filter((item) => getAppointmentStart(item) >= now)
                .sort((a, b) => getAppointmentStart(a) - getAppointmentStart(b));
            const upcoming = approvedList
                .filter((item) => getAppointmentStart(item) >= now)
                .sort((a, b) => getAppointmentStart(a) - getAppointmentStart(b));
            const expired = expiredList
                .filter((item) => item.expiryReason === 'doctor_no_response'
                    && !seenExpired.includes(item.requestId)
                    && now - new Date(item.updatedOn || 0).getTime() < EXPIRED_VISIBLE_MS)
                .slice(0, 1);

            if (!cancelled) setUpcomingItems([...pending, ...upcoming, ...expired].slice(0, 4));
        })();

        return () => { cancelled = true; };
    }, []);

    if (upcomingItems.length === 0) return null;

    const handleSeeAllUpcoming = () => executeAction('OPEN_CONSULTATIONS');

    // An expired request has nothing left to manage, so tapping goes straight to
    // that doctor to book again; everything else opens its consultation detail.
    const handleOpenItem = (item: AppointmentItem) => {
        if (item.status === 'expired' && item.doctorId) {
            void markExpiredSeen(item.requestId);
            setUpcomingItems((prev) => prev.filter((i) => i.requestId !== item.requestId));
            executeAction('OPEN_DOCTOR_DETAIL', { doctorId: item.doctorId, intent: 'BOOK' });
            return;
        }
        executeAction('OPEN_CONSULTATION_DETAIL', { requestId: item.requestId });
    };

    const renderRow = (item: AppointmentItem, index: number) => {
        const typeMeta = TYPE_META[item.consultationType || 'video'];
        const RowIcon = typeMeta.Icon;
        const name = formatDoctorName(item.doctorName) || 'Your doctor';
        const isPending = item.status === 'pending';
        const isExpired = item.status === 'expired';

        return (
            <TouchableOpacity
                key={item.requestId}
                style={[styles.card, index > 0 && { marginTop: 12 }]}
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.85}
            >
                <View style={[styles.iconBox, { backgroundColor: typeMeta.bg }]}>
                    <RowIcon size={20} color={typeMeta.color} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.primary} numberOfLines={1}>{name}</Text>
                    {isPending ? (
                        <Text style={[styles.secondary, styles.pendingText]} numberOfLines={1}>
                            {t('Awaiting reply')} · {formatWhen(item)}
                        </Text>
                    ) : isExpired ? (
                        <Text style={[styles.secondary, styles.expiredText]} numberOfLines={2}>
                            {t('Did not respond in time - tap to book again')}
                        </Text>
                    ) : (
                        <Text style={styles.secondary}>{formatWhen(item)}</Text>
                    )}
                </View>
                <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SectionHeader
                title={upcomingItems.some((i) => i.status !== 'approved') ? t('Your appointments') : t('upcoming_appointments')}
                onSeeAll={handleSeeAllUpcoming}
            />
            <View style={styles.cardSection}>
                {upcomingItems.map((item, index) => renderRow(item, index))}
            </View>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { marginBottom: 30 },
    cardSection: { paddingHorizontal: 24 },
    card: {
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        // Flat border-only look, same as the other feed cards
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    info: { flex: 1, marginRight: 8 },
    primary: { fontSize: 14, fontWeight: '700', color: c.text },
    secondary: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    pendingText: { color: '#C47A16', fontWeight: '600' },
    expiredText: { color: c.error, fontWeight: '600' },
});
