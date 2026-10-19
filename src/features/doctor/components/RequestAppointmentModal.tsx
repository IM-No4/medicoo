import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Modal } from '../../../components/ThemedModal';
import { executeAction } from '../../../actions/ActionExecutor';
import BookingForPicker, { BookingTarget } from './BookingForPicker';
import { takePreferredBookingMember } from '../bookingTarget';

const { width, height } = Dimensions.get('window');

interface RequestAppointmentModalProps {
    visible: boolean;
    onClose: () => void;
    doctorName: string;
    consultationFees: {
        chat: any;
        voice: any;
        video: any;
    };
    weeklyAvailability?: Record<string, { enabled: boolean; start: string; end: string }>;
    urgentSurchargePercent?: number;
    // A pending/approved request with this doctor already exists - blocks a second one.
    activeAppointment?: { requestId: string; status: string } | null;
    onRequest: (data: any) => Promise<void>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CONSULTATION_TYPES = [
    { id: 'chat', label: 'Chat', icon: 'message-circle' },
    { id: 'voice', label: 'Voice Call', icon: 'phone' },
    { id: 'video', label: 'Video Call', icon: 'video' },
];

// Theme Color
const THEME_COLOR = '#10B981'; // Doctor Onboarding Green / Branding Color

export default function RequestAppointmentModal({
    visible,
    onClose,
    doctorName,
    consultationFees,
    weeklyAvailability,
    urgentSurchargePercent,
    activeAppointment,
    onRequest,
}: RequestAppointmentModalProps) {
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedType, setSelectedType] = useState('chat');
    const [dates, setDates] = useState<any[]>([]);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Who the consultation is for: null = myself
    const [target, setTarget] = useState<BookingTarget>({ memberId: null, name: 'Myself', hasAccount: false });

    const insets = useSafeAreaInsets();

    // Drag the header (handle + title row) down to dismiss. Past the threshold the
    // sheet slides the rest of the way off-screen and then closes; a short drag
    // springs back. The sheet is reset each time it opens.
    const dragY = useRef(new Animated.Value(0)).current;
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const sheetHeightRef = useRef(height);
    sheetHeightRef.current = height;

    useEffect(() => {
        if (visible) dragY.setValue(0);
    }, [visible, dragY]);

    // Opened from a family member's page: already booking for them.
    useEffect(() => {
        if (!visible) return;
        const preferred = takePreferredBookingMember();
        if (preferred) setTarget({ memberId: preferred.memberId, name: preferred.name, hasAccount: preferred.hasAccount });
    }, [visible]);

    const handlePan = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
                // Once the drag starts, nothing (the ScrollView below, the modal)
                // may take it over mid-gesture - that was what made it feel broken.
                onPanResponderTerminationRequest: () => false,
                onPanResponderMove: (_, g) => {
                    dragY.setValue(Math.max(0, g.dy));
                },
                onPanResponderRelease: (_, g) => {
                    if (g.dy > 90 || g.vy > 0.8) {
                        Animated.timing(dragY, {
                            toValue: sheetHeightRef.current,
                            duration: 160,
                            useNativeDriver: true,
                        }).start(() => onCloseRef.current());
                    } else {
                        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
                    }
                },
                onPanResponderTerminate: () => {
                    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
                },
            }),
        [dragY]
    );

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    // Initialize dates (Next 7 days including today)
    useEffect(() => {
        const today = new Date();
        const nextDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            nextDates.push({
                id: d.toISOString().split('T')[0],
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                dateNum: d.getDate(),
                fullDate: d,
            });
        }
        setDates(nextDates);

        // Set initial time to current time + 15 mins, rounded up to nearest 5
        const now = new Date();
        const initialTime = new Date(now.getTime() + 15 * 60000);
        const m = initialTime.getMinutes();
        const remainder = m % 5;
        if (remainder !== 0) {
            initialTime.setMinutes(m + (5 - remainder));
        }
        initialTime.setSeconds(0, 0); // Clean seconds
        setSelectedTime(initialTime);
    }, []);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        // Reset time if date changes to today to ensure logic?
        // For now, keep selected time or validation will handle it
    };

    const onTimeChange = (event: any, selected: Date | undefined) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selected) {
            // Round minutes to nearest 5
            const m = selected.getMinutes();
            const remainder = m % 5;
            if (remainder !== 0) {
                selected.setMinutes(m + (5 - remainder));
            }
            selected.setSeconds(0, 0);

            // Validation: If today, ensure time is at least 15 mins from now
            const now = new Date();
            const isToday = selectedDate.toDateString() === now.toDateString();

            if (isToday) {
                const minTime = new Date(now.getTime() + 15 * 60000);
                if (selected.getTime() < minTime.getTime()) {
                    showStatus('warning', t('invalid_time'), t('please_select_a_time_at_least_15_minut'));
                    return;
                }
            }
            setSelectedTime(selected);
        }
    };

    const getFee = () => {
        const typeFee = consultationFees?.[selectedType];
        if (typeof typeFee === 'object' && typeFee !== null) {
            return Number(typeFee.fee) || 0;
        }
        return Number(typeFee) || 0;
    };

    // Estimate only - the backend independently checks the doctor's
    // availability and computes the real fee, so this can never be trusted
    // as the actual charge. It exists purely to avoid surprising the patient.
    const getSurchargeInfo = () => {
        const percent = Math.max(0, Math.min(Number(urgentSurchargePercent) || 0, 50));
        const hasAnyEnabledDay = weeklyAvailability && Object.values(weeklyAvailability).some((d: any) => d?.enabled);

        if (!hasAnyEnabledDay || percent <= 0) {
            return { applies: false, percent: 0, amount: 0 };
        }

        const dayWindow = weeklyAvailability![DAY_NAMES[selectedDate.getDay()]];
        const timeStr = `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}`;
        const isWithinHours = !!(
            dayWindow?.enabled && dayWindow.start && dayWindow.end &&
            timeStr >= dayWindow.start && timeStr <= dayWindow.end
        );

        if (isWithinHours) {
            return { applies: false, percent, amount: 0 };
        }

        return { applies: true, percent, amount: Math.round(getFee() * (percent / 100)) };
    };

    const surcharge = getSurchargeInfo();
    const totalWithSurcharge = getFee() + surcharge.amount;

    const blocked = !!activeAppointment && ['pending', 'approved'].includes(activeAppointment.status);

    const handlePayment = async () => {
        if (blocked) return;
        if (!reason.trim()) {
            showStatus('warning', t('reason_required'), t('please_let_the_doctor_know_why_you_d_l'));
            return;
        }

        const fee = getFee();
        setSubmitting(true);
        try {
            // Parent creates the actual appointment request and only resolves on success -
            // it navigates away itself, so nothing else needs to happen here.
            await onRequest({
                date: selectedDate,
                time: selectedTime,
                type: selectedType,
                fee: fee,
                reason: reason.trim(),
                forMemberId: target.memberId,
                forName: target.memberId ? target.name : null,
            });
        } catch (error: any) {
            showStatus(
                'error',
                t('request_failed_2'),
                error?.response?.data?.message || 'Could not send your appointment request. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    {/* Tapping the dimmed area outside the sheet closes it */}
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
                    <Animated.View style={[styles.container, { height: height * 0.92, paddingBottom: insets.bottom + 10, transform: [{ translateY: dragY }] }]}>
                        {/* Handle + title row: the drag-to-dismiss area */}
                        <View {...handlePan.panHandlers}>
                            <View style={styles.handleBar}>
                                <View style={styles.handle} />
                            </View>

                            <View style={styles.header}>
                                <Text style={styles.title}>{t('request_appointment')}</Text>
                            </View>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                            {/* 0. Who is it for (only shown when you have family members) */}
                            <BookingForPicker value={target.memberId} onChange={setTarget} />

                            {/* 1. Date Selection - Chips */}
                            <Text style={styles.sectionTitle}>{t('preferred_date')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesContainer}>
                                {dates.map((item) => {
                                    const isSelected = item.fullDate.toDateString() === selectedDate.toDateString();
                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[styles.dateChip, isSelected && styles.activeDateChip]}
                                            onPress={() => handleDateSelect(item.fullDate)}
                                        >
                                            <Text style={[styles.dayText, isSelected && styles.activeText]}>{item.day}</Text>
                                            <Text style={[styles.dateText, isSelected && styles.activeText]}>{item.dateNum}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* 2. Time Selection */}
                            {/* 2. Time Selection */}
                            <TouchableOpacity
                                style={styles.timeSelectionRow}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <View style={styles.timeRowLeft}>
                                    <View style={[styles.iconBoxSmall, { backgroundColor: '#F2F2F7' }]}>
                                        <AppIcon name="clock" size={20} color={THEME_COLOR} />
                                    </View>
                                    <Text style={styles.timeLabel}>{t('preferred_time')}</Text>
                                </View>
                                <View style={styles.timeRowRight}>
                                    <Text style={styles.timeValue}>
                                        {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                    <AppIcon name="chevron-down" size={16} color="#C7C7CC" />
                                </View>
                            </TouchableOpacity>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={selectedTime}
                                    mode="time"
                                    is24Hour={false}
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onTimeChange}
                                    minimumDate={new Date(new Date().getTime() + 15 * 60000)}
                                    minuteInterval={5} // iOS Only helper
                                />
                            )}

                            {/* 3. Consultation Mode */}
                            <Text style={styles.sectionTitle}>{t('consultation_mode')}</Text>
                            <View style={styles.typesContainer}>
                                {CONSULTATION_TYPES.map((type) => {
                                    const isSelected = selectedType === type.id;
                                    const feeObj = consultationFees?.[type.id];
                                    const fee = typeof feeObj === 'object' ? feeObj?.fee : feeObj;

                                    // Match colors from DoctorDetailScreen
                                    let iconColor = '#5B4FDB';
                                    let iconBg = '#F2F2F7';

                                    switch (type.id) {
                                        case 'chat':
                                            iconColor = '#1C6ED5';
                                            iconBg = '#EAF4FF';
                                            break;
                                        case 'voice':
                                            iconColor = '#007C69';
                                            iconBg = '#EAFBF3';
                                            break;
                                        case 'video':
                                            iconColor = '#C47A16';
                                            iconBg = '#FFF6EA';
                                            break;
                                    }

                                    if (isDark) iconBg = `${iconColor}26`;

                                    return (
                                        <TouchableOpacity
                                            key={type.id}
                                            style={[
                                                styles.typeCard,
                                                isSelected && styles.activeTypeCard
                                            ]}
                                            onPress={() => setSelectedType(type.id)}
                                        >
                                            <View style={styles.cardHeader}>
                                                <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                                                    <AppIcon
                                                        name={(type.icon === 'message-circle' ? 'message-square' : type.icon) as any}
                                                        size={20}
                                                        color={iconColor}
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.cardContent}>
                                                <Text style={styles.typeLabel}>{t(type.label)}</Text>
                                                <Text style={styles.typeFee}>₹{fee || 0}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* 4. Reason for visit */}
                            <Text style={styles.sectionTitle}>{t('reason_for_visit')}</Text>
                            <TextInput
                                style={styles.reasonInput}
                                placeholder={t('briefly_describe_your_symptoms_or_reas')}
                                placeholderTextColor="#8e8e93"
                                value={reason}
                                onChangeText={setReason}
                                multiline
                                numberOfLines={3}
                            />

                            {/* 5. Payment Info */}
                            {surcharge.applies && (
                                <View style={styles.surchargeNotice}>
                                    <AppIcon name="alert-triangle" size={16} color={theme.warning} />
                                    <Text style={styles.surchargeNoticeText}>
                                        This time is outside {doctorName}'s regular hours - a {surcharge.percent}% urgent
                                        care surcharge (₹{surcharge.amount}) applies.
                                    </Text>
                                </View>
                            )}
                            <View style={styles.paymentInfoContainer}>
                                <View style={styles.paymentRow}>
                                    <Text style={styles.payLabel}>{surcharge.applies ? 'Estimated total' : 'Consultation fee'}</Text>
                                    <Text style={styles.payAmount}>₹{totalWithSurcharge}</Text>
                                </View>
                                <Text style={styles.disclaimer}>
                                    You won't be charged now. {doctorName} needs to accept your request first - you'll then
                                    get a payment prompt to confirm the appointment.
                                </Text>
                            </View>

                        </ScrollView>

                        {/* Footer Action */}
                        <View style={styles.footer}>
                            {blocked && (
                                <TouchableOpacity
                                    style={styles.blockedNotice}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        onClose();
                                        executeAction('OPEN_CONSULTATION_DETAIL', { requestId: activeAppointment!.requestId });
                                    }}
                                >
                                    <AppIcon name="calendar-days" size={16} color={theme.warning} />
                                    <Text style={styles.blockedNoticeText}>
                                        {activeAppointment!.status === 'approved'
                                            ? `You already have an upcoming appointment with ${doctorName}.`
                                            : `Your request to ${doctorName} is still pending.`}
                                        {' '}View it
                                    </Text>
                                    <AppIcon name="chevron-right" size={16} color={theme.warning} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.payButton, (submitting || blocked) && styles.payButtonDisabled]}
                                onPress={handlePayment}
                                disabled={submitting || blocked}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.payButtonText}>{t('send_request')}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>

            {/* Status Modal - Using Fragment anchor to prevent z-index issues with inner modal if needed */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
            />
        </>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // Height handled inline or here default
        // paddingBottom removed here to avoid conflict/duplication if we want dynamic
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: c.cardSecondary,
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: c.text,
        marginBottom: 12,
    },
    datesContainer: {
        paddingBottom: 8,
    },
    dateChip: {
        width: 52,
        height: 60,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: c.card,
    },
    activeDateChip: {
        backgroundColor: THEME_COLOR,
        borderColor: THEME_COLOR,
        elevation: 4,
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    dayText: {
        fontSize: 12,
        color: c.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
    },
    activeText: {
        color: '#fff',
    },
    timeSelectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        marginBottom: 24,
        marginTop: 8,
    },
    timeRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBoxSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    timeLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: c.text,
    },
    timeRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeValue: {
        fontSize: 16,
        fontWeight: '600',
        color: THEME_COLOR,
        marginRight: 8,
    },
    // New/Reverted styles for Horizontal Layout
    typesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    typeCard: {
        flex: 1,
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTypeCard: {
        borderColor: THEME_COLOR,
        backgroundColor: c.primaryBg,
        borderWidth: 1.5,
    },
    cardHeader: {
        marginBottom: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        alignItems: 'center',
    },
    typeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: c.text,
        marginBottom: 2,
        textAlign: 'center',
    },
    typeFee: {
        fontSize: 13,
        fontWeight: '700',
        color: c.text,
    },

    reasonInput: {
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: c.text,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 24,
    },

    surchargeNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: c.warningBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        padding: 12,
        marginTop: 8,
    },
    surchargeNoticeText: {
        flex: 1,
        fontSize: 12,
        color: c.warning,
        lineHeight: 17,
    },
    paymentInfoContainer: {
        backgroundColor: c.cardSecondary,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
        marginTop: 8,
        marginBottom: 0,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    payLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: c.text,
    },
    payAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME_COLOR,
    },
    disclaimer: {
        fontSize: 12,
        color: c.textSecondary,
        lineHeight: 18,
    },
    blockedNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.warningBg,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    blockedNoticeText: {
        flex: 1,
        fontSize: 12.5,
        fontWeight: '600',
        color: c.warning,
        lineHeight: 17,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    payButton: {
        backgroundColor: THEME_COLOR,
        paddingVertical: 16,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonDisabled: {
        opacity: 0.7,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
