import { useNavigation, useRoute } from '@react-navigation/native';
import {
    AlertTriangle,
    Award,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    FilePlus,
    FileText,
    History,
    MessageCircle,
    MoreVertical,
    Phone,
    Stethoscope,
    Video,
    XCircle
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import ConsultationDetailsCard from '../../../../components/consultation/ConsultationDetailsCard';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { getMyAppointmentRequestDetail } from '../../../../services/api';
import { API_BASE_URL } from '../../../../services/api/client';
import { cancelAppointmentRequest, createAppointmentPayment, getMyConsultationHistoryWithDoctor, PastConsultationSummary, requestNoShowRefund, requestReschedule, verifyAppointmentPayment } from '../../../../services/api/doctor.api';
import { formatDoctorName } from '../../../../utils/formatters';
import RescheduleRequestModal from './components/RescheduleRequestModal';

const STATUS_COLORS: Record<string, string> = {
    completed: '#10B981',
    approved: '#3B82F6',
    pending: '#F59E0B',
    rejected: '#DC2626',
    cancelled: '#9CA3AF',
    expired: '#9CA3AF',
    no_show: '#DC2626',
};

// Status badge text - never render consultation.status raw, since values
// like 'no_show' aren't presentable as-is.
const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    approved: 'Upcoming',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
    expired: 'Expired',
    no_show: 'Missed',
};

const CONSULTATION_TYPE_META: Record<'chat' | 'voice' | 'video', { label: string; color: string; bg: string; Icon: typeof MessageCircle }> = {
    chat: { label: 'Chat', color: '#1C6ED5', bg: '#EAF4FF', Icon: MessageCircle },
    voice: { label: 'Voice', color: '#007C69', bg: '#EAFBF3', Icon: Phone },
    video: { label: 'Video', color: '#C47A16', bg: '#FFF6EA', Icon: Video },
};

const TIMELINE_META: Record<string, { label: string; Icon: typeof FileText; color: string; fallbackSubtitle: string }> = {
    pending: { label: 'Request Created', Icon: FilePlus, color: '#0FBBA1', fallbackSubtitle: 'Your request was sent to the doctor.' },
    approved: { label: 'Request Approved', Icon: CheckCircle2, color: '#0FBBA1', fallbackSubtitle: 'The doctor approved your request.' },
    rejected: { label: 'Request Rejected', Icon: XCircle, color: '#DC2626', fallbackSubtitle: 'The doctor was unable to accept this request.' },
    cancelled: { label: 'Request Cancelled', Icon: XCircle, color: '#9CA3AF', fallbackSubtitle: 'This request was cancelled.' },
    paid: { label: 'Payment Confirmed', Icon: CreditCard, color: '#0FBBA1', fallbackSubtitle: 'Payment was received and the slot was confirmed.' },
    completed: { label: 'Consultation Completed', Icon: Award, color: '#0FBBA1', fallbackSubtitle: 'The consultation was marked as completed.' },
    expired: { label: 'Request Expired', Icon: XCircle, color: '#9CA3AF', fallbackSubtitle: 'This request was automatically terminated after too much time passed.' },
    no_show: { label: 'Consultation Missed', Icon: XCircle, color: '#DC2626', fallbackSubtitle: 'Neither party joined the consultation in time.' },
    reschedule_requested: { label: 'Reschedule Requested', Icon: Clock, color: '#1D4ED8', fallbackSubtitle: 'You proposed a new time for this consultation.' },
    rescheduled: { label: 'Reschedule Accepted', Icon: CheckCircle2, color: '#0FBBA1', fallbackSubtitle: 'The doctor confirmed your new time.' },
};

const formatTimelineDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'Today';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Deadlines are computed server-side (capped at the appointment's own
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

// react-native-razorpay's Android bridge passes the SDK's raw error
// callback straight through - on cancellation (and some other failures)
// `description` is itself a JSON-encoded string like
// {"error":{"code":"...","description":"Payment Processing Cancelled by User","reason":"payment_cancelled",...}}
// rather than a plain message, so it must be parsed before showing to the
// user. code 2 is Razorpay's documented PAYMENT_CANCELED constant.
const RAZORPAY_PAYMENT_CANCELLED_CODE = 2;

const CANCELLED_MESSAGE = 'Payment was cancelled. You can try again whenever you\'re ready.';
const GENERIC_FAILURE_MESSAGE = 'Payment could not be completed. Please try again.';

// Native bridges sometimes hand back "undefined"/"null" as literal text
// (rather than actually omitting the field) - treat those the same as no
// description at all so they never end up rendered verbatim on screen.
const isUsableString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value !== 'undefined' && value !== 'null';

const getPaymentErrorDetails = (error: any): { title: string; message: string } => {
    const cancelled = { title: 'Payment Cancelled', message: CANCELLED_MESSAGE };
    const failed = (message: string) => ({ title: 'Payment Failed', message });

    if (error?.code === RAZORPAY_PAYMENT_CANCELLED_CODE) {
        return cancelled;
    }
    const rawDescription = error?.description;
    if (isUsableString(rawDescription)) {
        try {
            const parsed = JSON.parse(rawDescription);
            if (parsed?.error?.reason === 'payment_cancelled') {
                return cancelled;
            }
            if (isUsableString(parsed?.error?.description)) {
                return failed(parsed.error.description);
            }
        } catch {
            if (rawDescription.toLowerCase().includes('cancel')) {
                return cancelled;
            }
            return failed(rawDescription);
        }
    }
    const responseMessage = error?.response?.data?.message;
    return failed(isUsableString(responseMessage) ? responseMessage : GENERIC_FAILURE_MESSAGE);
};

export default function ConsultationDetailScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { requestId } = route.params;

    const [loading, setLoading] = useState(true);
    const [consultation, setConsultation] = useState<any>(null);
    const [paying, setPaying] = useState(false);
    const [pastConsultations, setPastConsultations] = useState<PastConsultationSummary[]>([]);
    const [paymentStatus, setPaymentStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    const showPaymentStatus = (type: StatusType, title: string, message: string) => {
        setPaymentStatus({ visible: true, type, title, message });
    };
    const hidePaymentStatus = () => setPaymentStatus(prev => ({ ...prev, visible: false }));

    // Separate from paymentStatus above - drives the general confirm/error
    // dialogs on this screen (cancel, no-show refund, reschedule) so it
    // can't collide with the payment flow's own modal state.
    const [alertStatus, setAlertStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    const showAlert = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setAlertStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };
    const hideAlert = () => setAlertStatus(prev => ({ ...prev, visible: false }));

    const [cancelling, setCancelling] = useState(false);
    const [choiceBusy, setChoiceBusy] = useState(false);
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    // Ticks so the "Join Consultation" button re-enables on its own once the
    // grace window opens, without needing the user to background/foreground.
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchDetail = async () => {
        try {
            const res = await getMyAppointmentRequestDetail(requestId);
            setConsultation(res?.data);
        } catch (error) {
            console.error('Error fetching consultation detail:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [requestId]);

    // Only this doctor's own past consultations with the patient - never
    // other doctors' - see getMyConsultationHistoryWithDoctor's scoping.
    useEffect(() => {
        const doctorId = consultation?.doctorId;
        if (!doctorId) return;

        getMyConsultationHistoryWithDoctor(doctorId, requestId)
            .then((res) => setPastConsultations(res?.requests || []))
            .catch(() => setPastConsultations([]));
    }, [consultation?.doctorId, requestId]);

    const isConfirmed = consultation?.status === 'approved' && consultation?.paymentStatus === 'paid';
    const isAwaitingPayment = consultation?.status === 'approved' && consultation?.paymentStatus !== 'paid';

    const handlePayNow = async () => {
        hidePaymentStatus();
        setPaying(true);

        let paymentOrder;
        try {
            paymentOrder = await createAppointmentPayment(requestId);
        } catch (error: any) {
            const { title, message } = getPaymentErrorDetails(error);
            showPaymentStatus('error', title, message);
            setPaying(false);
            return;
        }

        if ('free' in paymentOrder) {
            await fetchDetail();
            setPaying(false);
            return;
        }

        let result;
        try {
            const { orderId, amount, currency, keyId } = paymentOrder;
            result = await RazorpayCheckout.open({
                key: keyId,
                order_id: orderId,
                amount,
                currency,
                name: 'Medicoo',
                description: `Consultation with ${formatDoctorName(consultation?.doctorDetails?.name) || 'your doctor'}`,
                theme: { color: '#0FBBA1' },
            });
        } catch (error: any) {
            const { title, message } = getPaymentErrorDetails(error);
            showPaymentStatus('error', title, message);
            setPaying(false);
            return;
        }

        // Razorpay confirmed the payment on its end - now waiting on our
        // backend to verify the signature. This is a distinct, longer step
        // (network round trip) so it gets its own loading modal rather than
        // just leaving the pay button's inline spinner running.
        setPaying(false);
        showPaymentStatus('loading', '', 'Verifying your payment...');
        try {
            await verifyAppointmentPayment(requestId, {
                razorpayOrderId: result.razorpay_order_id,
                razorpayPaymentId: result.razorpay_payment_id,
                razorpaySignature: result.razorpay_signature,
            });
            await fetchDetail();
            showPaymentStatus('success', 'Payment Confirmed!', 'Your appointment is now confirmed. Chat and call will unlock shortly.');
        } catch (error: any) {
            const backendMessage = error?.response?.data?.message;
            showPaymentStatus(
                'error',
                'Verification Pending',
                isUsableString(backendMessage)
                    ? backendMessage
                    : 'Your payment went through, but we could not verify it yet. Please check back in a moment or contact support if this continues.'
            );
        }
    };

    const performCancel = async () => {
        setCancelling(true);
        try {
            await cancelAppointmentRequest(requestId);
            await fetchDetail();
        } catch (error: any) {
            showAlert('error', 'Could Not Cancel', error?.response?.data?.message || 'Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const handleCancel = () => {
        const isPaid = consultation?.paymentStatus === 'paid';
        const message = isPaid
            ? consultation?.refundEligible
                ? `You will receive a full refund of ₹${consultation.consultationFee}. Cancel this appointment?`
                : 'This is within 2 hours of your appointment, so no refund will be issued. Cancel anyway?'
            : 'Are you sure you want to cancel this appointment?';

        showAlert('warning', 'Cancel Appointment', message, () => { hideAlert(); performCancel(); }, 'Yes, Cancel');
    };

    const handleNoShowRefund = () => {
        showAlert(
            'warning',
            'Get Refund',
            `You'll receive a full refund of ₹${consultation.consultationFee}. Continue?`,
            async () => {
                hideAlert();
                setChoiceBusy(true);
                try {
                    await requestNoShowRefund(requestId);
                    await fetchDetail();
                } catch (error: any) {
                    showAlert('error', 'Could Not Process Refund', error?.response?.data?.message || 'Please try again.');
                } finally {
                    setChoiceBusy(false);
                }
            },
            'Get Refund'
        );
    };

    const handleRescheduleSubmit = async (data: { preferredDate: string; preferredTime: string }) => {
        try {
            await requestReschedule(requestId, data);
            setRescheduleModalVisible(false);
            await fetchDetail();
        } catch (error: any) {
            showAlert('error', 'Could Not Send Request', error?.response?.data?.message || 'Please try again.');
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <ActivityIndicator size="large" color="#0FBBA1" />
            </View>
        );
    }

    if (!consultation) {
        return (
            <View style={styles.center}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <Text style={styles.detailText}>This consultation could not be found.</Text>
            </View>
        );
    }

    const statusColor = STATUS_COLORS[consultation.status] || '#3B82F6';
    const doctorDisplayName = formatDoctorName(consultation.doctorDetails?.name);
    const typeMeta = CONSULTATION_TYPE_META[(consultation.consultationType as 'chat' | 'voice' | 'video') || 'video'];
    const TypeIcon = typeMeta.Icon;
    const dateTimeLabel = consultation.preferredDate
        ? `${new Date(consultation.preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${consultation.preferredTime}`
        : consultation.preferredTime;
    const canJoinCallNow = !consultation.canJoinCallAt || now >= new Date(consultation.canJoinCallAt).getTime();
    const joinOpensAtLabel = consultation.canJoinCallAt
        ? new Date(consultation.canJoinCallAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Consultation Detail</Text>
                <TouchableOpacity style={styles.moreButton} onPress={() => executeAction('OPEN_HELP')}>
                    <MoreVertical size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Doctor + schedule card */}
                <View style={styles.card}>
                    <View style={styles.doctorRow}>
                        {consultation.doctorDetails?.image ? (
                            <Image
                                source={{
                                    uri: consultation.doctorDetails.image.startsWith('http')
                                        ? consultation.doctorDetails.image
                                        : `${API_BASE_URL}/${consultation.doctorDetails.image}`,
                                }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.placeholderAvatar]}>
                                <Stethoscope size={26} color="#0FBBA1" />
                            </View>
                        )}
                        <View style={styles.doctorInfo}>
                            <Text style={styles.doctorName} numberOfLines={1}>{doctorDisplayName}</Text>
                            <Text style={styles.specialtyText} numberOfLines={1}>{consultation.doctorDetails?.specialization}</Text>
                        </View>
                    </View>

                    {isConfirmed && (
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity
                                style={styles.messageButton}
                                onPress={() => executeAction('OPEN_DOCTOR_CHAT', { requestId: consultation.requestId, title: doctorDisplayName, image: consultation.doctorDetails?.image })}
                            >
                                <MessageCircle size={16} color="#0FBBA1" />
                                <Text style={styles.messageButtonText}>Message</Text>
                            </TouchableOpacity>
                            {consultation.consultationType !== 'chat' && (
                                <TouchableOpacity
                                    style={[styles.callButton, !canJoinCallNow && styles.callButtonDisabled]}
                                    disabled={!canJoinCallNow}
                                    onPress={() => executeAction('OPEN_DOCTOR_CALL', {
                                        appointment: consultation,
                                        type: consultation.consultationType === 'voice' ? 'voice' : 'video',
                                        displayName: doctorDisplayName,
                                    })}
                                >
                                    <Phone size={16} color={canJoinCallNow ? '#fff' : '#9CA3AF'} />
                                    <Text style={[styles.callButtonText, !canJoinCallNow && styles.callButtonTextDisabled]}>
                                        {canJoinCallNow ? 'Join Consultation' : `Join at ${joinOpensAtLabel}`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Date and time together */}
                    <View style={styles.metaItem}>
                        <Calendar size={14} color="#9CA3AF" />
                        <Text style={styles.metaText}>{dateTimeLabel}</Text>
                    </View>

                    {/* Consultation mode and status in one line */}
                    <View style={[styles.metaRow, { marginTop: 10 }]}>
                        <View style={[styles.modeBadge, { backgroundColor: typeMeta.bg }]}>
                            <TypeIcon size={12} color={typeMeta.color} />
                            <Text style={[styles.modeBadgeText, { color: typeMeta.color }]}>{typeMeta.label}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isAwaitingPayment ? '#F59E0B' : statusColor }]}>
                            <Text style={styles.statusBadgeText}>{isAwaitingPayment ? 'Awaiting Payment' : (STATUS_LABELS[consultation.status] || consultation.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Reason & Doctor's Response */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <FileText size={16} color="#111827" />
                        <Text style={styles.sectionTitle}>Reason & Doctor's Response</Text>
                    </View>
                    <Text style={styles.diagnosisTitle}>Reason for visit</Text>
                    <Text style={styles.detailText}>{consultation.reason}</Text>
                    {consultation.doctorResponse?.remarks && (
                        <>
                            <View style={styles.innerDivider} />
                            <Text style={styles.diagnosisTitle}>Doctor's Notes</Text>
                            <Text style={styles.detailText}>{consultation.doctorResponse.remarks}</Text>
                        </>
                    )}
                </View>

                <ConsultationDetailsCard details={consultation.consultationDetails} />

                {/* Payment Required */}
                {isAwaitingPayment && (
                    <View style={styles.payCard}>
                        <View style={styles.payCardHeader}>
                            <CreditCard size={20} color="#0FBBA1" />
                            <Text style={styles.payCardTitle}>Payment Required</Text>
                        </View>
                        <Text style={styles.payCardText}>
                            {doctorDisplayName} approved your request. Complete payment to confirm your appointment and unlock chat/call.
                        </Text>
                        {formatCountdown(consultation.paymentDeadline) && (
                            <View style={styles.deadlineNotice}>
                                <Clock size={13} color="#B45309" />
                                <Text style={styles.deadlineNoticeText}>
                                    Pay within {formatCountdown(consultation.paymentDeadline)} or this appointment will expire.
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.payButton, paying && styles.payButtonDisabled]}
                            onPress={handlePayNow}
                            disabled={paying}
                        >
                            {paying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.payButtonText}>Pay ₹{consultation.consultationFee} to Confirm</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Doctor no-show - patient chooses refund or reschedule */}
                {consultation.status === 'no_show' && consultation.noShowReason === 'doctor_no_show' && consultation.paymentStatus === 'paid' && (
                    consultation.rescheduleRequest?.status === 'pending' ? (
                        <View style={styles.noShowCard}>
                            <View style={styles.noShowHeader}>
                                <View style={styles.noShowIconBadge}>
                                    <Clock size={16} color="#B45309" />
                                </View>
                                <Text style={styles.noShowTitle}>Reschedule Requested</Text>
                            </View>
                            <Text style={styles.noShowText}>
                                Waiting for {doctorDisplayName} to confirm your proposed time: {new Date(consultation.rescheduleRequest.proposedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {consultation.rescheduleRequest.proposedTime}.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.noShowCard}>
                            <View style={styles.noShowHeader}>
                                <View style={styles.noShowIconBadge}>
                                    <AlertTriangle size={16} color="#B45309" />
                                </View>
                                <Text style={styles.noShowTitle}>{doctorDisplayName} Missed Your Consultation</Text>
                            </View>
                            <Text style={styles.noShowText}>
                                Choose a full refund, or ask {doctorDisplayName} for a new time.
                            </Text>
                            <View style={styles.noShowButtonRow}>
                                <TouchableOpacity
                                    style={[styles.refundChoiceButton, choiceBusy && styles.noShowButtonDisabled]}
                                    onPress={handleNoShowRefund}
                                    disabled={choiceBusy}
                                >
                                    <Text style={styles.refundChoiceButtonText} numberOfLines={1}>Get Refund</Text>
                                </TouchableOpacity>
                                {consultation.rescheduleCount < 1 && (
                                    <TouchableOpacity
                                        style={[styles.rescheduleChoiceButton, choiceBusy && styles.noShowButtonDisabled]}
                                        onPress={() => setRescheduleModalVisible(true)}
                                        disabled={choiceBusy}
                                    >
                                        <Text style={styles.rescheduleChoiceButtonText} numberOfLines={1}>Request Reschedule</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )
                )}

                {/* Refund */}
                {consultation.paymentStatus === 'refunded' && consultation.refundDetails && (
                    <View style={styles.refundCard}>
                        <View style={styles.payCardHeader}>
                            <CreditCard size={20} color="#0FBBA1" />
                            <Text style={styles.payCardTitle}>Refund Issued</Text>
                        </View>
                        <Text style={styles.payCardText}>
                            ₹{consultation.refundDetails.amount} was refunded to your original payment method
                            {consultation.refundDetails.refundedAt
                                ? ` on ${new Date(consultation.refundDetails.refundedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : ''}. It may take a few business days to reflect in your account.
                        </Text>
                    </View>
                )}
                {consultation.paymentStatus === 'refund_failed' && (
                    <View style={styles.refundFailedCard}>
                        <View style={styles.payCardHeader}>
                            <AlertTriangle size={20} color="#B45309" />
                            <Text style={styles.payCardTitle}>Refund In Progress</Text>
                        </View>
                        <Text style={styles.payCardText}>
                            We ran into an issue automatically processing your refund. Our team has been notified and will follow up shortly.
                        </Text>
                    </View>
                )}

                {/* Feedback Section */}
                {consultation.status === 'completed' && (
                    <View style={styles.feedbackSection}>
                        <View style={styles.feedbackPrompt}>
                            <Text style={styles.promptTitle}>How was your experience?</Text>
                            <Text style={styles.promptText}>Your feedback helps other patients find the best doctors.</Text>
                            <TouchableOpacity
                                style={styles.reviewButton}
                                onPress={() => executeAction('OPEN_DOCTOR_FEEDBACK', {
                                    consultationId: consultation.requestId,
                                    // doctorDetails itself has no _id (see backend's
                                    // getConsultationDetail) - it's a sibling top-level
                                    // field that has to be merged in explicitly, or
                                    // submitDoctorFeedback silently sends doctorId: undefined.
                                    doctor: { ...consultation.doctorDetails, _id: consultation.doctorId },
                                })}
                            >
                                <Text style={styles.reviewButtonText}>Write a Review</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Past consultations with this same doctor only */}
                {pastConsultations.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <History size={16} color="#111827" />
                            <Text style={styles.sectionTitle}>Past Consultations with {doctorDisplayName}</Text>
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
                                    onPress={() => navigation.push('ConsultationDetail', { requestId: past.requestId })}
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

                {/* Timeline - shown last */}
                {consultation.statusHistory?.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <History size={16} color="#111827" />
                            <Text style={styles.sectionTitle}>Timeline</Text>
                        </View>
                        {[...consultation.statusHistory].reverse().map((entry: any, index: number, arr: any[]) => {
                            const meta = TIMELINE_META[entry.status] || TIMELINE_META.pending;
                            const Icon = meta.Icon;
                            const isLast = index === arr.length - 1;
                            return (
                                <View key={`${entry.status}-${entry.timestamp}-${index}`} style={styles.timelineRow}>
                                    <View style={styles.timelineIconCol}>
                                        <View style={[styles.timelineIconCircle, { backgroundColor: meta.color }]}>
                                            <Icon size={13} color="#fff" />
                                        </View>
                                        {!isLast && <View style={styles.timelineLine} />}
                                    </View>
                                    <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                                        <Text style={styles.timelineDate}>{formatTimelineDate(entry.timestamp)}</Text>
                                        <Text style={styles.timelineTitle}>{meta.label}</Text>
                                        <Text style={styles.timelineSubtitle}>{entry.remarks || meta.fallbackSubtitle}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Cancel - shown only while the request is still cancellable */}
                {consultation.canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <ActivityIndicator color="#DC2626" size="small" />
                        ) : (
                            <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>

            <RescheduleRequestModal
                visible={rescheduleModalVisible}
                onClose={() => setRescheduleModalVisible(false)}
                onSubmit={handleRescheduleSubmit}
            />

            <StatusModal
                visible={paymentStatus.visible}
                status={paymentStatus.type}
                title={paymentStatus.title}
                message={paymentStatus.message}
                onClose={hidePaymentStatus}
                autoCloseDelay={paymentStatus.type === 'success' ? 2000 : undefined}
            />

            <StatusModal
                visible={alertStatus.visible}
                status={alertStatus.type}
                title={alertStatus.title}
                message={alertStatus.message}
                onClose={hideAlert}
                primaryAction={alertStatus.primaryAction}
                primaryActionText={alertStatus.primaryActionText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
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
    moreButton: {
        padding: 8,
        marginRight: -12,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    doctorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 18,
    },
    placeholderAvatar: {
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    doctorInfo: {
        flex: 1,
    },
    doctorName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
    },
    specialtyText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 2,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 14,
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    messageButtonText: {
        color: '#0FBBA1',
        fontSize: 14,
        fontWeight: '700',
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#0FBBA1',
    },
    callButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    callButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
    callButtonTextDisabled: {
        color: '#9CA3AF',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 14,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13.5,
        fontWeight: '700',
        color: '#111827',
    },
    modeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    modeBadgeText: {
        fontWeight: '700',
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 11.5,
        textTransform: 'capitalize',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    diagnosisTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    detailText: {
        fontSize: 14.5,
        color: '#4B5563',
        lineHeight: 21,
    },
    innerDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 14,
    },
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
    timelineRow: {
        flexDirection: 'row',
    },
    timelineIconCol: {
        alignItems: 'center',
        width: 28,
        marginRight: 12,
    },
    timelineIconCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        flex: 1,
        width: 2,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        minHeight: 20,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 18,
    },
    timelineDate: {
        fontSize: 11.5,
        color: '#9CA3AF',
        fontWeight: '600',
        marginBottom: 3,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
    },
    timelineSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    payCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    refundCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    refundFailedCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    // Doctor no-show choice card - kept neutral (white, single amber accent
    // confined to the icon badge) rather than a full-color fill, so it
    // doesn't compete with the two action buttons below it.
    noShowCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    noShowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    noShowIconBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noShowTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    noShowText: {
        fontSize: 13.5,
        color: '#6B7280',
        lineHeight: 19,
        marginBottom: 16,
    },
    noShowButtonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    noShowButtonDisabled: {
        opacity: 0.6,
    },
    refundChoiceButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#0FBBA1',
    },
    refundChoiceButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    rescheduleChoiceButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    rescheduleChoiceButtonText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '600',
    },
    payCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    payCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    payCardText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 16,
    },
    deadlineNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
    },
    deadlineNoticeText: {
        fontSize: 12.5,
        color: '#B45309',
        fontWeight: '600',
        flex: 1,
    },
    payButton: {
        backgroundColor: '#0FBBA1',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    feedbackSection: {
        marginTop: 2,
    },
    cancelButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '700',
    },
    feedbackPrompt: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        textAlign: 'center',
    },
    promptTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    promptText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 18,
    },
    reviewButton: {
        backgroundColor: '#0FBBA1',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 16,
    },
    reviewButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
