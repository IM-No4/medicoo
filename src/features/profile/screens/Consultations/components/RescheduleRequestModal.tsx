import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import { useTheme } from '../../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../../theme/colors';
import { useLanguage } from '../../../../../i18n/LanguageContext';
import { Modal } from '../../../../../components/ThemedModal';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSubmit: (data: { preferredDate: string; preferredTime: string }) => Promise<void>;
}

export default function RescheduleRequestModal({ visible, onClose, onSubmit }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const insets = useSafeAreaInsets();
    const [dates, setDates] = useState<{ id: string; day: string; dateNum: number; fullDate: Date }[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!visible) return;
        const today = new Date();
        const nextDates = [];
        for (let i = 1; i <= 7; i++) {
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
        setSelectedDate(nextDates[0].fullDate);

        const defaultTime = new Date();
        defaultTime.setHours(10, 0, 0, 0);
        setSelectedTime(defaultTime);
    }, [visible]);

    const onTimeChange = (event: any, selected: Date | undefined) => {
        if (Platform.OS === 'android') setShowTimePicker(false);
        if (selected) setSelectedTime(selected);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const preferredTime = `${String(selectedTime.getHours()).padStart(2, '0')}:${String(selectedTime.getMinutes()).padStart(2, '0')}`;
            await onSubmit({
                preferredDate: selectedDate.toISOString().split('T')[0],
                preferredTime,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                    <Text style={styles.title}>{t('propose_a_new_time')}</Text>
                    <Text style={styles.subtitle}>{t('your_doctor_will_need_to_confirm_this')}</Text>

                    <Text style={styles.sectionLabel}>{t('date_2')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
                        {dates.map(d => {
                            const active = d.fullDate.toDateString() === selectedDate.toDateString();
                            return (
                                <TouchableOpacity
                                    key={d.id}
                                    style={[styles.dateChip, active && styles.dateChipActive]}
                                    onPress={() => setSelectedDate(d.fullDate)}
                                >
                                    <Text style={[styles.dateChipDay, active && styles.dateChipTextActive]}>{d.day}</Text>
                                    <Text style={[styles.dateChipNum, active && styles.dateChipTextActive]}>{d.dateNum}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <Text style={styles.sectionLabel}>{t('time')}</Text>
                    <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                        <Clock size={16} color="#10B981" />
                        <Text style={styles.timeButtonText}>
                            {selectedTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            is24Hour={false}
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onTimeChange}
                        />
                    )}

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('send_request')}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
    content: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    title: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 4 },
    subtitle: { fontSize: 13, color: c.textSecondary, marginBottom: 20, lineHeight: 18 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', marginBottom: 10 },
    dateRow: { gap: 10, paddingBottom: 20 },
    dateChip: {
        width: 52,
        height: 64,
        borderRadius: 14,
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    dateChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    dateChipDay: { fontSize: 11, color: c.textSecondary, fontWeight: '600' },
    dateChipNum: { fontSize: 16, color: c.text, fontWeight: '700' },
    dateChipTextActive: { color: '#fff' },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: c.successBg,
        borderWidth: 1,
        borderColor: '#DCFCE7',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    timeButtonText: { fontSize: 15, fontWeight: '700', color: c.text },
    submitButton: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 10,
    },
    submitButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    cancelButton: { alignItems: 'center', paddingVertical: 10 },
    cancelButtonText: { color: c.textSecondary, fontSize: 14, fontWeight: '600' },
});
