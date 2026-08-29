import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    History,
    MessageCircle,
    MessageSquare,
    Phone,
    Video,
    X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import ConsultationDetailsCard from '../../../../components/consultation/ConsultationDetailsCard';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { API_BASE_URL } from '../../../../services/api/client';
import { completeAppointmentRequest, getDoctorAppointmentRequestDetail, getPatientConsultationHistory, respondToAppointmentRequest, respondToReschedule } from '../../../../services/api/doctor.api';

type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'expired' | 'no_show';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Pending',
    approved: 'Upcoming',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    expired: 'Expired',
    no_show: 'Missed',
};

const STATUS_TONES: Record<AppointmentStatus, { bg: string; fg: string; dot: string }> = {
    pending: { bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
    approved: { bg: '#DCFCE7', fg: '#166534', dot: '#0FBBA1' },
    rejected: { bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
    cancelled: { bg: '#E5E7EB', fg: '#374151', dot: '#9CA3AF' },
    completed: { bg: '#E0E7FF', fg: '#3730A3', dot: '#6366F1' },
    expired: { bg: '#F3F4F6', fg: '#6B7280', dot: '#9CA3AF' },
    no_show: { bg: '#FEE2E2', fg: '#B91C1C', dot: '#DC2626' },
};

const CONSULTATION_TYPE_META: Record<'chat' | 'voice' | 'video', { label: string; color: string; bg: string; Icon: typeof MessageCircle }> = {
    chat: { label: 'Chat', color: '#1C6ED5', bg: '#EAF4FF', Icon: MessageCircle },
    voice: { label: 'Voice', color: '#007C69', bg: '#EAFBF3', Icon: Phone },
    video: { label: 'Video', color: '#C47A16', bg: '#FFF6EA', Icon: Video },
};

// Deadline is computed server-side (capped at the appointment's own
// scheduled time) - this just renders whatever the API already sent.
const formatCountdown = (deadline?: string | null) => {
    if (!deadline) return null;
    const diffMs = new Date(deadline).getTime() - Date.now();
    if (diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function PatientConsultationDetailScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { appointment: initialAppointment } = route.params || {};

    const [appointment, setAppointment] = useState(initialAppointment);
    const [busy, setBusy] = useState(false);
    const [pastConsultations, setPastConsultations] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    // Ticks so the "Start Consultation" button re-enables on its own once
    // the grace window opens, without needing the doctor to background/foreground.
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    // Nav params only carry the patientDetails snapshot captured at booking
    // time (no photo, and can be stale if the patient updated their info
    // since) - refetch the full detail so the photo and any updates show up.
    useEffect(() => {
        const requestId = initialAppointment?.requestId;
        if (!requestId) return;

        getDoctorAppointmentRequestDetail(requestId)
            .then((res) => {
                if (res?.data) setAppointment((prev: any) => ({ ...prev, ...res.data }));
            })
            .catch((e) => console.error('Failed to refresh appointment detail', e));
    }, [initialAppointment?.requestId]);

    useEffect(() => {
        const patientCustomerId = initialAppointment?.customerId;
        if (!patientCustomerId) return;

        setLoadingHistory(true);
        getPatientConsultationHistory(patientCustomerId, initialAppointment?.requestId)
            .then((res) => setPastConsultations(res?.data?.requests || []))
            .catch(() => setPastConsultations([]))
            .finally(() => setLoadingHistory(false));
    }, [initialAppointment?.customerId, initialAppointment?.requestId]);
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };
    const hideStatus = () => setStatus((prev) => ({ ...prev, visible: false }));

    const genderLabel = appointment?.patientDetails?.gender
        ? appointment.patientDetails.gender.charAt(0).toUpperCase() + appointment.patientDetails.gender.slice(1)
        : null;
    const ageLabel = appointment?.patientDetails?.age ? `${appointment.patientDetails.age} yrs` : null;

    const patientData = {
        name: appointment?.patientDetails?.name || appointment?.actionMeta?.patientName || 'Patient',
        reason: appointment?.reason || '',
        metaLine: [genderLabel, ageLabel].filter(Boolean).join(' • '),
        image: appointment?.patientDetails?.image || '',
        phone: appointment?.patientDetails?.phone || '',
    };

    const requestStatus: AppointmentStatus = appointment?.status || 'pending';
    const isPending = requestStatus === 'pending';
    const isPaid = appointment?.paymentStatus === 'paid';
    const isAwaitingPayment = requestStatus === 'approved' && !isPaid;
    const tone = STATUS_TONES[requestStatus];
    const typeMeta = CONSULTATION_TYPE_META[(appointment?.consultationType as 'chat' | 'voice' | 'video') || 'video'];
    const TypeIcon = typeMeta.Icon;
    const surchargeAmount = typeof appointment?.consultationFee === 'number' && typeof appointment?.baseConsultationFee === 'number'
        ? appointment.consultationFee - appointment.baseConsultationFee
        : 0;
    const canJoinCallNow = !appointment?.canJoinCallAt || now >= new Date(appointment.canJoinCallAt).getTime();
    const joinOpensAtLabel = appointment?.canJoinCallAt
        ? new Date(appointment.canJoinCallAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : null;

    const dateLabel = appointment?.preferredDate
        ? new Date(appointment.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'Date not set';
    const timeLabel = appointment?.preferredTime || 'Time not set';

    const handleRespond = (nextStatus: 'approved' | 'rejected') => {
        showStatus(
            nextStatus === 'approved' ? 'info' : 'warning',
            nextStatus === 'approved' ? 'Approve this request?' : 'Reject this request?',
            nextStatus === 'approved'
                ? `Approve ${patientData.name} for ${dateLabel} at ${timeLabel}?`
                : `Reject ${patientData.name}'s request?`,
            async () => {
                try {
                    setBusy(true);
                    await respondToAppointmentRequest({ requestId: appointment.requestId, status: nextStatus });
                    setAppointment((prev: any) => ({ ...prev, status: nextStatus }));
                    hideStatus();
                    showStatus(
                        'success',
                        nextStatus === 'approved' ? 'Request approved' : 'Request rejected',
                        nextStatus === 'approved'
                            ? 'The patient has been notified and can now proceed to payment.'
                            : 'The patient has been notified.',
                    );
                } catch {
                    showStatus('error', 'Action failed', 'We could not update this request. Please try again.');
                } finally {
                    setBusy(false);
                }
            },
            nextStatus === 'approved' ? 'Approve' : 'Reject',
        );
    };

    const handleComplete = () => {
        showStatus(
            'info',
            'Mark as completed?',
            `Mark this consultation with ${patientData.name} as completed? This lets them leave a review.`,
            async () => {
                try {
                    setBusy(true);
                    await completeAppointmentRequest(appointment.requestId);
                    setAppointment((prev: any) => ({ ...prev, status: 'completed' }));
                    hideStatus();
                    showStatus('success', 'Consultation completed', 'The patient has been notified and can now leave a review.');
                } catch {
                    showStatus('error', 'Action failed', 'We could not mark this consultation as completed. Please try again.');
                } finally {
                    setBusy(false);
                }
            },
            'Mark Completed',
        );
    };

    const handleRescheduleResponse = (accept: boolean) => {
        const proposedDate = appointment?.rescheduleRequest?.proposedDate;
        const proposedTime = appointment?.rescheduleRequest?.proposedTime;
        const proposedLabel = proposedDate
            ? `${new Date(proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${proposedTime}`
            : 'the proposed time';

        showStatus(
            accept ? 'info' : 'warning',
            accept ? 'Accept new time?' : 'Decline reschedule?',
            accept
                ? `Confirm the consultation with ${patientData.name} for ${proposedLabel}?`
                : `Decline this request? ${patientData.name} will be refunded automatically.`,
            async () => {
                try {
                    setBusy(true);
                    const res = await respondToReschedule(appointment.requestId, { accept });
                    hideStatus();
                    if (accept) {
                        setAppointment((prev: any) => ({ ...prev, status: 'approved', preferredDate: proposedDate, preferredTime: proposedTime, rescheduleRequest: { ...prev.rescheduleRequest, status: 'accepted' } }));
                        showStatus('success', 'Reschedule accepted', 'The patient has been notified and your consultation is confirmed for the new time.');
                    } else {
                        setAppointment((prev: any) => ({ ...prev, paymentStatus: res?.data?.refunded ? 'refunded' : prev.paymentStatus, rescheduleRequest: { ...prev.rescheduleRequest, status: 'rejected' } }));
                        showStatus('success', 'Reschedule declined', 'The patient has been notified and refunded.');
                    }
                } catch {
                    showStatus('error', 'Action failed', 'We could not process this response. Please try again.');
                } finally {
                    setBusy(false);
                }
            },
            accept ? 'Accept' : 'Decline',
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Consultation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Patient Header */}
                <View style={styles.patientHeaderCard}>
                    <View style={styles.patientHeaderRow}>
                        {patientData.image ? (
                            <Image
                                source={{
                                    uri: patientData.image.startsWith('http')
                                        ? patientData.image
                                        : `${API_BASE_URL}/${patientData.image}`,
                                }}
                                style={styles.avatarLarge}
                            />
                        ) : (
                            <View style={styles.avatarLarge}>
                                <Text style={styles.avatarTextLarge}>{patientData.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.patientNameLarge} numberOfLines={1}>{patientData.name}</Text>
                            {patientData.metaLine ? (
                                <Text style={styles.patientMetaLine}>{patientData.metaLine}</Text>
                            ) : null}
                            {patientData.phone ? (
                                <View style={styles.phoneRow}>
                                    <Phone size={12} color="#6B7280" />
                                    <Text style={styles.phoneText}>{patientData.phone}</Text>
                                </View>
                            ) : null}
                            <Text style={styles.requestId}>#{appointment?.requestId}</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: isAwaitingPayment ? '#FEF3C7' : tone.bg, alignSelf: 'flex-start', marginTop: 14 }]}>
                        <View style={[styles.statusDot, { backgroundColor: isAwaitingPayment ? '#F59E0B' : tone.dot }]} />
                        <Text style={[styles.statusBadgeText, { color: isAwaitingPayment ? '#92400E' : tone.fg }]}>
                            {isAwaitingPayment ? 'Awaiting Payment' : STATUS_LABELS[requestStatus]}
                        </Text>
                    </View>
                </View>

                {/* Consultation Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Consultation Details</Text>
                    <View style={styles.contextRow}>
                        <View style={[styles.iconLabel, styles.modeLabel, { backgroundColor: typeMeta.bg }]}>
                            <TypeIcon size={14} color={typeMeta.color} />
                            <Text style={[styles.contextText, { color: typeMeta.color, fontWeight: '700' }]}>
                                {typeMeta.label}
                                {typeof appointment?.consultationFee === 'number' ? ` · ₹${appointment.consultationFee}` : ''}
                            </Text>
                        </View>
                        {appointment?.isUrgentSurcharge && surchargeAmount > 0 && (
                            <View style={[styles.iconLabel, styles.modeLabel, { backgroundColor: '#FFFBEB' }]}>
                                <AlertTriangle size={13} color="#B45309" />
                                <Text style={[styles.contextText, { color: '#B45309', fontWeight: '700' }]}>+₹{surchargeAmount} urgent</Text>
                            </View>
                        )}
                        <View style={styles.iconLabel}>
                            <Calendar size={16} color="#6B7280" />
                            <Text style={styles.contextText}>{dateLabel}</Text>
                        </View>
                        <View style={styles.iconLabel}>
                            <Clock size={16} color="#6B7280" />
                            <Text style={styles.contextText}>{timeLabel}</Text>
                        </View>
                        {appointment?.urgencyLevel ? (
                            <View style={styles.iconLabel}>
                                <Text style={[styles.contextText, { textTransform: 'capitalize' }]}>{appointment.urgencyLevel} urgency</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionLabel}>Reason for Visit</Text>
                    <Text style={styles.sectionValue}>{patientData.reason || 'Not specified'}</Text>
                </View>

                <ConsultationDetailsCard details={appointment?.consultationDetails} />

                {/* Reschedule request - patient's choice after a missed consultation */}
                {appointment?.rescheduleRequest?.status === 'pending' && (
                    <View style={[styles.card, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}>
                        <View style={styles.pastHeaderRow}>
                            <Clock size={16} color="#1D4ED8" />
                            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Reschedule Requested</Text>
                        </View>
                        <Text style={[styles.sectionValue, { marginTop: 8, marginBottom: 14 }]}>
                            {patientData.name} proposed a new time: {new Date(appointment.rescheduleRequest.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {appointment.rescheduleRequest.proposedTime}.
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleRescheduleResponse(false)}
                                disabled={busy}
                            >
                                <X size={18} color="#DC2626" />
                                <Text style={styles.rejectButtonText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => handleRescheduleResponse(true)}
                                disabled={busy}
                            >
                                <CheckCircle2 size={18} color="#fff" />
                                <Text style={styles.approveButtonText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {appointment?.status === 'no_show' && appointment?.noShowReason === 'doctor_no_show' && appointment?.paymentStatus === 'paid' && appointment?.rescheduleRequest?.status !== 'pending' && (
                    <View style={[styles.card, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                        <View style={styles.pastHeaderRow}>
                            <AlertTriangle size={16} color="#B45309" />
                            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Missed Consultation</Text>
                        </View>
                        <Text style={[styles.sectionValue, { marginTop: 8 }]}>
                            {patientData.name} is deciding between a refund or requesting a new time.
                        </Text>
                    </View>
                )}

                {/* Refund */}
                {appointment?.paymentStatus === 'refunded' && appointment?.refundDetails && (
                    <View style={[styles.card, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                        <View style={styles.pastHeaderRow}>
                            <CheckCircle2 size={16} color="#166534" />
                            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Refunded</Text>
                        </View>
                        <Text style={[styles.sectionValue, { marginTop: 8 }]}>
                            ₹{appointment.refundDetails.amount} was refunded to the patient.
                        </Text>
                    </View>
                )}
                {appointment?.paymentStatus === 'refund_failed' && (
                    <View style={[styles.card, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                        <View style={styles.pastHeaderRow}>
                            <AlertTriangle size={16} color="#B45309" />
                            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Refund In Progress</Text>
                        </View>
                        <Text style={[styles.sectionValue, { marginTop: 8 }]}>
                            The patient's refund could not be processed automatically. Our team has been notified.
                        </Text>
                    </View>
                )}

                {/* Doctor's response, for context after acting on a request */}
                {appointment?.doctorResponse?.remarks ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Your Response</Text>
                        <Text style={styles.sectionValue}>{appointment.doctorResponse.remarks}</Text>
                    </View>
                ) : null}

                {/* This doctor's own past consultations with this same patient */}
                {pastConsultations.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.pastHeaderRow}>
                            <History size={16} color="#6B7280" />
                            <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Past Consultations</Text>
                        </View>
                        {pastConsultations.map((past, index) => {
                            const pastTypeMeta = CONSULTATION_TYPE_META[(past.consultationType as 'chat' | 'voice' | 'video') || 'video'];
                            const PastTypeIcon = pastTypeMeta.Icon;
                            const pastDate = past.preferredDate
                                ? new Date(past.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Date not set';
                            return (
                                <TouchableOpacity
                                    key={past.requestId}
                                    style={[styles.pastRow, index === pastConsultations.length - 1 && styles.pastRowLast]}
                                    // navigation.push (not executeAction, which always uses
                                    // .navigate) - this screen's own route name is the target,
                                    // so .navigate would just swap this instance's params
                                    // instead of stacking a new one, making "back" skip past
                                    // it straight to the list.
                                    onPress={() => navigation.push('PatientConsultationDetail', { appointment: past })}
                                >
                                    <View style={[styles.pastTypeIconBox, { backgroundColor: pastTypeMeta.bg }]}>
                                        <PastTypeIcon size={14} color={pastTypeMeta.color} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.pastDate}>{pastDate}</Text>
                                        <Text style={styles.pastReason} numberOfLines={1}>{past.reason || 'No reason provided'}</Text>
                                    </View>
                                    <ChevronRight size={16} color="#D1D5DB" />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 20 }} />
            </ScrollView>

            {isPending && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    {formatCountdown(appointment?.responseDeadline) && (
                        <View style={styles.deadlineNotice}>
                            <Clock size={13} color="#B45309" />
                            <Text style={styles.deadlineNoticeText}>
                                Respond within {formatCountdown(appointment?.responseDeadline)} or this request will expire.
                            </Text>
                        </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleRespond('rejected')}
                            disabled={busy}
                        >
                            <X size={18} color="#DC2626" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleRespond('approved')}
                            disabled={busy}
                        >
                            <CheckCircle2 size={18} color="#fff" />
                            <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {requestStatus === 'approved' && (
                isAwaitingPayment ? (
                    <View style={[styles.footer, { paddingBottom: insets.bottom + 16}]}>
                        <View style={styles.awaitingPaymentNotice}>
                            <Text style={styles.awaitingPaymentText}>
                                Waiting for the patient to complete payment - chat and consultation unlock automatically once paid.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.footer, { paddingBottom: insets.bottom + 16}]}>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.secondaryButton]}
                                onPress={() => executeAction('OPEN_DOCTOR_CHAT', { requestId: appointment.requestId, title: patientData.name, image: patientData.image })}
                            >
                                <MessageSquare size={18} color="#0FBBA1" />
                                <Text style={[styles.buttonText, { color: '#0FBBA1' }]}>Message</Text>
                            </TouchableOpacity>
                            {appointment?.consultationType !== 'chat' && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.primaryButton, { flex: 1 }, !canJoinCallNow && styles.primaryButtonDisabled]}
                                    disabled={!canJoinCallNow}
                                    onPress={() => executeAction('OPEN_DOCTOR_CALL', {
                                        appointment,
                                        type: appointment?.consultationType === 'voice' ? 'voice' : 'video',
                                        displayName: patientData.name,
                                    })}
                                >
                                    <Text style={[styles.buttonText, !canJoinCallNow && styles.buttonTextDisabled]}>
                                        {canJoinCallNow ? 'Start Consultation' : `Available at ${joinOpensAtLabel}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.completeButton}
                            onPress={handleComplete}
                            disabled={busy}
                        >
                            <CheckCircle2 size={16} color="#6366F1" />
                            <Text style={styles.completeButtonText}>Mark as Completed</Text>
                        </TouchableOpacity>
                    </View>
                )
            )}

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
                autoCloseDelay={status.type === 'success' ? 2000 : undefined}
            />

            {busy && (
                <View style={styles.busyOverlay} pointerEvents="none">
                    <ActivityIndicator color="#0FBBA1" size="large" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    content: { padding: 20, paddingBottom: 40 },

    patientHeaderCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // shadowColor: '#0F172A',
        // shadowOpacity: 0.05,
        // shadowRadius: 10,
        // shadowOffset: { width: 0, height: 3 },
        // elevation: 2,
    },
    patientHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#DCFCE7',
    },
    avatarTextLarge: { fontSize: 24, fontWeight: '800', color: '#047857' },
    patientNameLarge: { fontSize: 18, fontWeight: '800', color: '#111827' },
    patientMetaLine: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 3 },
    requestId: { fontSize: 12.5, color: '#9CA3AF', marginTop: 3, fontWeight: '500' },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
    phoneText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusBadgeText: { fontSize: 12, fontWeight: '800' },

    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // shadowColor: '#0F172A',
        // shadowOpacity: 0.05,
        // shadowRadius: 10,
        // shadowOffset: { width: 0, height: 3 },
        // elevation: 2,
    },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 14 },

    contextRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 4 },
    iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    modeLabel: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
    contextText: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
    sectionLabel: { fontSize: 11.5, color: '#9CA3AF', fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
    sectionValue: { fontSize: 14, color: '#374151', lineHeight: 20 },

    pastHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    pastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    pastRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    pastTypeIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pastDate: { fontSize: 13.5, fontWeight: '700', color: '#111827' },
    pastReason: { fontSize: 12.5, color: '#9CA3AF', marginTop: 2 },

    deadlineNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    deadlineNoticeText: {
        fontSize: 12.5,
        color: '#B45309',
        fontWeight: '600',
        flex: 1,
    },
    awaitingPaymentNotice: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    awaitingPaymentText: {
        fontSize: 13,
        color: '#92400E',
        textAlign: 'center',
        lineHeight: 18,
    },

    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButton: {
        backgroundColor: '#0FBBA1',
        shadowColor: '#0FBBA1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonDisabled: {
        backgroundColor: '#F3F4F6',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonTextDisabled: {
        color: '#9CA3AF',
    },
    secondaryButton: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    rejectButton: {
        backgroundColor: '#FFF1F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    rejectButtonText: { fontSize: 15, fontWeight: '800', color: '#DC2626' },
    approveButton: {
        backgroundColor: '#0FBBA1',
        shadowColor: '#0FBBA1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButtonText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 13,
        marginTop: 12,
        borderRadius: 16,
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    completeButtonText: { color: '#6366F1', fontSize: 14, fontWeight: '700' },

    busyOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
