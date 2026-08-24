import { AlertCircle, ChevronRight, MessageCircle, Phone, Video } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getProfileDetails } from '../../../../services/api';
import { getDoctorAppointmentRequests, getMyAppointmentRequests } from '../../../../services/api/doctor.api';

type AppointmentItem = {
    requestId: string;
    preferredDate?: string;
    preferredTime?: string;
    consultationType?: 'chat' | 'voice' | 'video';
    patientDetails?: { name?: string };
    actionMeta?: { patientName?: string };
    doctorDetails?: { name?: string };
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
    const [isDoctor, setIsDoctor] = useState<boolean | null>(null);
    const [pendingItems, setPendingItems] = useState<AppointmentItem[]>([]);
    const [upcomingItems, setUpcomingItems] = useState<AppointmentItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const profile = await getProfileDetails();
                const doctorView = !!profile?.isDoctor;
                if (cancelled) return;
                setIsDoctor(doctorView);

                const upcomingRes = doctorView
                    ? await getDoctorAppointmentRequests({ status: 'upcoming', limit: 10 })
                    : await getMyAppointmentRequests({ status: 'approved', limit: 10 });

                const requests: AppointmentItem[] = upcomingRes?.data?.requests || [];
                const now = Date.now();
                const upcoming = requests
                    .filter((item) => getAppointmentStart(item) >= now)
                    .sort((a, b) => getAppointmentStart(a) - getAppointmentStart(b))
                    .slice(0, 3);

                if (!cancelled) setUpcomingItems(upcoming);

                // New requests waiting on a response only apply to doctors -
                // this was previously only visible on the Profile screen's
                // banner, meaning a doctor had to go look for it rather than
                // seeing it the moment they open the app.
                if (doctorView) {
                    const pendingRes = await getDoctorAppointmentRequests({ status: 'pending', limit: 5 });
                    if (!cancelled) setPendingItems(pendingRes?.data?.requests || []);
                }
            } catch (error) {
                console.warn('Failed to load appointments for home screen:', error);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    if (pendingItems.length === 0 && upcomingItems.length === 0) return null;

    const handleSeeAllUpcoming = () => {
        if (isDoctor) {
            executeAction('OPEN_MANAGE_APPOINTMENTS', { initialTab: 'upcoming' });
        } else {
            executeAction('OPEN_CONSULTATIONS');
        }
    };

    const handleSeeAllPending = () => executeAction('OPEN_DOCTOR_PENDING_REQUESTS');

    const handleOpenItem = (item: AppointmentItem) => {
        if (isDoctor) {
            executeAction('OPEN_PATIENT_CONSULTATION_DETAIL', { appointment: item });
        } else {
            executeAction('OPEN_CONSULTATION_DETAIL', { requestId: item.requestId });
        }
    };

    // Pending rows use a fixed alert icon (matching the section header)
    // instead of the chat/voice/video icon - a recolored consultation-type
    // icon didn't read as "needs your response", it just looked like a
    // mistinted version of the Upcoming section's icon. Upcoming rows keep
    // the type icon since there the type itself is useful, settled info.
    const renderRow = (item: AppointmentItem, index: number, isPending?: boolean) => {
        const typeMeta = TYPE_META[item.consultationType || 'video'];
        const RowIcon = isPending ? AlertCircle : typeMeta.Icon;
        const iconBg = isPending ? '#FEF3C7' : typeMeta.bg;
        const iconColor = isPending ? '#B45309' : typeMeta.color;
        const name = isDoctor
            ? (item.patientDetails?.name || item.actionMeta?.patientName || 'Patient')
            : (item.doctorDetails?.name || 'Doctor');

        return (
            <TouchableOpacity
                key={item.requestId}
                style={[styles.card, index > 0 && { marginTop: 12 }]}
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.85}
            >
                <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <RowIcon size={20} color={iconColor} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.primary} numberOfLines={1}>{name}</Text>
                    <Text style={styles.secondary}>
                        {isPending ? 'Requested for ' : ''}{formatWhen(item)}
                    </Text>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
        );
    };

    return (
        <View>
            {pendingItems.length > 0 && (
                <View style={styles.container}>
                    <View style={styles.headerRow}>
                        <View style={styles.titleRow}>
                            <AlertCircle size={18} color="#B45309" />
                            <Text style={styles.title}>New Requests</Text>
                        </View>
                        <TouchableOpacity style={styles.seeAllRow} onPress={handleSeeAllPending}>
                            <Text style={styles.seeAll}>See all</Text>
                            <ChevronRight size={16} color="#1c1c1e" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardSection}>
                        {pendingItems.slice(0, 3).map((item, index) => renderRow(item, index, true))}
                    </View>
                </View>
            )}

            {upcomingItems.length > 0 && (
                <View style={styles.container}>
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>Upcoming Appointments</Text>
                        <TouchableOpacity style={styles.seeAllRow} onPress={handleSeeAllUpcoming}>
                            <Text style={styles.seeAll}>See all</Text>
                            <ChevronRight size={16} color="#1c1c1e" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.cardSection}>
                        {upcomingItems.map((item, index) => renderRow(item, index))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 28 },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 18, fontWeight: '600', color: '#1c1c1e' },
    seeAllRow: { flexDirection: 'row', alignItems: 'center' },
    seeAll: { fontSize: 14, color: '#1c1c1e', fontWeight: '600' },
    cardSection: { paddingHorizontal: 24 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    info: { flex: 1, marginRight: 8 },
    primary: { fontSize: 16, fontWeight: '700', color: '#1D1D21' },
    secondary: { fontSize: 13, color: '#8F9BB3', marginTop: 2 },
});
