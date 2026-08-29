import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import { AlertTriangle, ChevronLeft, Clock } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { getDoctorProfile, updateDoctorSettings } from '../../../../services/api/user.api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MAX_SURCHARGE_PERCENT = 50;

type DaySchedule = { enabled: boolean; start: string; end: string };
type Schedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: Schedule = DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, start: '09:00', end: '17:00' };
    return acc;
}, {} as Schedule);

// "HH:MM" (24h, matches preferredTime everywhere else) <-> Date, for the time picker.
const timeStringToDate = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return d;
};
const dateToTimeString = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const formatDisplayTime = (time: string) => timeStringToDate(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ManageAvailabilityScreen() {
    const insets = useSafeAreaInsets();
    const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
    const [surchargePercent, setSurchargePercent] = useState('0');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickerFor, setPickerFor] = useState<{ day: string; field: 'start' | 'end' } | null>(null);
    const [status, setStatus] = useState<{ visible: boolean; type: StatusType; title: string; message: string }>({
        visible: false, type: 'idle', title: '', message: '',
    });
    const scrollViewRef = useRef<ScrollView>(null);

    const showStatus = (type: StatusType, title: string, message: string) => setStatus({ visible: true, type, title, message });
    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const loadSettings = useCallback(async () => {
        try {
            const profile = await getDoctorProfile();
            const savedAvailability = profile?.weeklyAvailability;
            if (savedAvailability) {
                const merged: Schedule = { ...DEFAULT_SCHEDULE };
                DAYS.forEach(day => {
                    const saved = savedAvailability[day];
                    if (saved?.enabled && saved.start && saved.end) {
                        merged[day] = { enabled: true, start: saved.start, end: saved.end };
                    }
                });
                setSchedule(merged);
            }
            if (typeof profile?.urgentSurchargePercent === 'number') {
                setSurchargePercent(String(profile.urgentSurchargePercent));
            }
        } catch (error) {
            console.error('Failed to load availability', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const toggleDay = (day: string) => {
        setSchedule(prev => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }));
    };

    const handleTimeChange = (event: any, selected: Date | undefined) => {
        const target = pickerFor;
        if (Platform.OS === 'android') setPickerFor(null);
        if (!selected || !target) return;

        setSchedule(prev => ({
            ...prev,
            [target.day]: { ...prev[target.day], [target.field]: dateToTimeString(selected) },
        }));
    };

    const handleSurchargeChange = (text: string) => {
        const digitsOnly = text.replace(/[^0-9]/g, '');
        if (!digitsOnly) {
            setSurchargePercent('');
            return;
        }
        const clamped = Math.min(parseInt(digitsOnly, 10), MAX_SURCHARGE_PERCENT);
        setSurchargePercent(String(clamped));
    };

    const handleSave = async () => {
        const invalidDay = DAYS.find(day => schedule[day].enabled && schedule[day].start >= schedule[day].end);
        if (invalidDay) {
            showStatus('warning', 'Invalid hours', `${invalidDay}'s end time must be after its start time.`);
            return;
        }

        setSaving(true);
        try {
            await updateDoctorSettings({
                availability: schedule,
                urgentSurchargePercent: Number(surchargePercent) || 0,
            });
            showStatus('success', 'Availability Saved', 'Patients requesting outside these hours will see your urgent care surcharge applied.');
        } catch (error) {
            showStatus('error', 'Save Failed', 'We could not save your availability. Please check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#0FBBA1" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Availability</Text>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator size="small" color="#0FBBA1" /> : <Text style={styles.saveText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
            >
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Set your weekly hours. Patients can still request appointments outside these times if they need care
                    urgently - your urgent care surcharge below applies automatically to those requests instead of blocking them.
                </Text>

                {DAYS.map((day) => (
                    <View key={day} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayName}>{day}</Text>
                            <Switch
                                value={schedule[day].enabled}
                                onValueChange={() => toggleDay(day)}
                                trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                                thumbColor={schedule[day].enabled ? '#0FBBA1' : '#F3F4F6'}
                            />
                        </View>

                        {schedule[day].enabled && (
                            <View style={styles.slotsContainer}>
                                <View style={styles.timeRow}>
                                    <TouchableOpacity
                                        style={styles.timeChip}
                                        onPress={() => setPickerFor({ day, field: 'start' })}
                                    >
                                        <Clock size={16} color="#6B7280" />
                                        <Text style={styles.slotText}>{formatDisplayTime(schedule[day].start)}</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.toText}>to</Text>
                                    <TouchableOpacity
                                        style={styles.timeChip}
                                        onPress={() => setPickerFor({ day, field: 'end' })}
                                    >
                                        <Clock size={16} color="#6B7280" />
                                        <Text style={styles.slotText}>{formatDisplayTime(schedule[day].end)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))}

                <Text style={styles.sectionLabel}>Urgent Care Surcharge</Text>
                <View style={styles.surchargeCard}>
                    <View style={styles.surchargeHeader}>
                        <AlertTriangle size={18} color="#B45309" />
                        <Text style={styles.surchargeTitle}>Extra fee for requests outside your hours</Text>
                    </View>
                    <Text style={styles.surchargeDesc}>
                        Applied automatically on top of your consultation fee. Capped platform-wide at {MAX_SURCHARGE_PERCENT}%
                        so urgent requests never feel like a burden to patients.
                    </Text>
                    <View style={styles.surchargeInputRow}>
                        <TextInput
                            style={styles.surchargeInput}
                            value={surchargePercent}
                            onChangeText={handleSurchargeChange}
                            onFocus={() => {
                                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
                            }}
                            keyboardType="number-pad"
                            maxLength={2}
                            placeholder="0"
                        />
                        <Text style={styles.percentSign}>%</Text>
                    </View>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>

            {pickerFor && (
                <DateTimePicker
                    value={timeStringToDate(schedule[pickerFor.day][pickerFor.field])}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    minuteInterval={5}
                />
            )}

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { justifyContent: 'center', alignItems: 'center' },
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
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    saveButton: { padding: 8, marginRight: -8, minWidth: 40, alignItems: 'flex-end' },
    saveText: { color: '#0FBBA1', fontWeight: '600', fontSize: 16 },
    content: { padding: 20, paddingBottom: 320 },
    description: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
    dayCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2
    },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dayName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    slotsContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    toText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
    slotText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    surchargeCard: {
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    surchargeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    surchargeTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', flex: 1 },
    surchargeDesc: { fontSize: 13, color: '#92400E', lineHeight: 18, marginBottom: 16 },
    surchargeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 16,
        height: 48,
        alignSelf: 'flex-start',
        minWidth: 90,
    },
    surchargeInput: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
    percentSign: { fontSize: 18, fontWeight: '700', color: '#6B7280' },
});
