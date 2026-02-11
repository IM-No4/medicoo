import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';

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
    onRequest: (data: any) => void;
}

const CONSULTATION_TYPES = [
    { id: 'chat', label: 'Chat', icon: 'message-circle' },
    { id: 'voice', label: 'Voice Call', icon: 'phone' },
    { id: 'video', label: 'Video Call', icon: 'video' },
];

// Theme Color
const THEME_COLOR = '#2FA561'; // Doctor Onboarding Green / Branding Color

export default function RequestAppointmentModal({
    visible,
    onClose,
    doctorName,
    consultationFees,
    onRequest,
}: RequestAppointmentModalProps) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedType, setSelectedType] = useState('chat');
    const [dates, setDates] = useState<any[]>([]);

    const insets = useSafeAreaInsets();

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
                    showStatus('warning', 'Invalid Time', 'Please select a time at least 15 minutes from now for immediate consultations.');
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

    const handlePayment = () => {
        const fee = getFee();
        // Pass data back to parent to handle "payment"
        onRequest({
            date: selectedDate,
            time: selectedTime,
            type: selectedType,
            fee: fee
        });
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
                    <View style={[styles.container, { height: height * 0.92, paddingBottom: insets.bottom + 10 }]}>
                        {/* Handle bar */}
                        <View style={styles.handleBar}>
                            <View style={styles.handle} />
                        </View>

                        <View style={styles.header}>
                            <Text style={styles.title}>Request Appointment</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <AppIcon name="x" size={24} color="#1c1c1e" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                            {/* 1. Date Selection - Chips */}
                            <Text style={styles.sectionTitle}>Preferred Date</Text>
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
                                    <Text style={styles.timeLabel}>Preferred Time</Text>
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
                            <Text style={styles.sectionTitle}>Consultation Mode</Text>
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
                                            iconColor = '#0E7439';
                                            iconBg = '#EAFBF3';
                                            break;
                                        case 'video':
                                            iconColor = '#C47A16';
                                            iconBg = '#FFF6EA';
                                            break;
                                    }

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
                                                <Text style={styles.typeLabel}>{type.label}</Text>
                                                <Text style={styles.typeFee}>₹{fee || 0}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* 4. Payment/Pre-auth Info */}
                            <View style={styles.paymentInfoContainer}>
                                <View style={styles.paymentRow}>
                                    <Text style={styles.payLabel}>Total to authorize</Text>
                                    <Text style={styles.payAmount}>₹{getFee()}</Text>
                                </View>
                                <Text style={styles.disclaimer}>
                                    By requesting, you authorize Medicoo to charge ₹{getFee()} if {doctorName} accepts.
                                    Money is held, not charged, until acceptance.
                                </Text>
                            </View>

                        </ScrollView>

                        {/* Footer Action */}
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                                <Text style={styles.payButtonText}>Pre-authorize ₹{getFee()}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        // Height handled inline or here default
        // paddingBottom removed here to avoid conflict/duplication if we want dynamic
    },
    handleBar: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1c1c1e',
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
        color: '#1c1c1e',
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
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        backgroundColor: '#fff',
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
        color: '#8e8e93',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1c1e',
    },
    activeText: {
        color: '#fff',
    },
    timeSelectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E5EA',
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
        color: '#1c1c1e',
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 4,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTypeCard: {
        borderColor: THEME_COLOR,
        backgroundColor: '#ffffffff',
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
        color: '#1c1c1e',
        marginBottom: 2,
        textAlign: 'center',
    },
    typeFee: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1c1c1e',
    },

    paymentInfoContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
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
        color: '#1c1c1e',
    },
    payAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: THEME_COLOR,
    },
    disclaimer: {
        fontSize: 12,
        color: '#8e8e93',
        lineHeight: 18,
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
        shadowColor: THEME_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    payButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
