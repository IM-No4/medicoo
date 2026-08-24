import { ChevronRight, Clock, MessageCircle, Phone, Video } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles';

type ConsultationType = 'chat' | 'voice' | 'video';

interface Props {
    doctorName: string;
    specialty: string;
    time: string;
    status?: string;
    consultationType?: ConsultationType;
    onPress?: () => void;
}

// Matches the chat/voice/video icon+color convention already used on the
// home feed's UpcomingAppointmentsCard, so a consultation type reads the
// same way everywhere in the app.
const TYPE_META: Record<ConsultationType, { color: string; bg: string; Icon: typeof MessageCircle }> = {
    chat: { color: '#1C6ED5', bg: '#EAF4FF', Icon: MessageCircle },
    voice: { color: '#007C69', bg: '#EAFBF3', Icon: Phone },
    video: { color: '#C47A16', bg: '#FFF6EA', Icon: Video },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#B45309', bg: '#FEF3C7' },
    approved: { label: 'Upcoming', color: '#1C6ED5', bg: '#EAF4FF' },
    booked: { label: 'Upcoming', color: '#1C6ED5', bg: '#EAF4FF' },
    completed: { label: 'Completed', color: '#007C69', bg: '#EAFBF3' },
    cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
    rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2' },
    expired: { label: 'Expired', color: '#6B7280', bg: '#F3F4F6' },
    no_show: { label: 'No-show', color: '#B45309', bg: '#FFF7ED' },
    missed: { label: 'No-show', color: '#B45309', bg: '#FFF7ED' },
};

export default function AppointmentCard({ doctorName, specialty, time, status, consultationType, onPress }: Props) {
    const typeMeta = TYPE_META[consultationType || 'video'];
    const statusMeta = status ? STATUS_META[status] : undefined;
    const TypeIcon = typeMeta.Icon;

    return (
        <TouchableOpacity style={styles.card} activeOpacity={onPress ? 0.7 : 1} onPress={onPress} disabled={!onPress}>
            <View style={[styles.iconBox, { backgroundColor: typeMeta.bg }]}>
                <TypeIcon size={22} color={typeMeta.color} />
            </View>

            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{doctorName}</Text>
                {!!specialty && <Text style={styles.specialty} numberOfLines={1}>{specialty}</Text>}
                <View style={styles.metaRow}>
                    <Clock size={12} color={COLORS.textSecondary} />
                    <Text style={styles.timeText}>{time}</Text>
                </View>
            </View>

            <View style={styles.rightCol}>
                {statusMeta && (
                    <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
                        <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                )}
                {onPress && <ChevronRight size={18} color="#D1D5DB" style={{ marginTop: 8 }} />}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        paddingVertical: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    info: {
        flex: 1,
        marginRight: 8,
    },
    name: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    specialty: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    rightCol: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
