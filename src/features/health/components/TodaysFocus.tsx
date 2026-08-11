import { Activity, ChevronRight, Pill, Zap, Check, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';
import RecordVitalsModal from '../../../components/modals/RecordVitalsModal';
import BluetoothDeviceModal from './BluetoothDeviceModal';
import { selectTodaySteps } from '../../../redux/slices/deviceSlice';
import { timeToMinutes } from '../../calendar/utils/scheduleSort';

export function TodaysFocus() {
    const navigation = useNavigation<any>();
    const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
    const [deviceModalVisible, setDeviceModalVisible] = useState(false);

    const { records } = useSelector((state: RootState) => state.vitals);
    const { data: calendarData } = useSelector((state: RootState) => state.calendar);
    const { connectedDevice, onDeviceSteps } = useSelector((state: RootState) => state.device);
    // A connected device OR the phone's own step sensor (iOS) both count as
    // "steps are being tracked" - only prompt to pair a wearable when
    // neither source has anything.
    const hasStepsSource = !!connectedDevice || onDeviceSteps !== null;

    // Dynamic BP logic
    const bpLoggedToday = records.some(r => {
        if (r.systolic === undefined || r.diastolic === undefined) return false;
        const recordDate = new Date(r.timestamp);
        const today = new Date();
        return recordDate.getDate() === today.getDate() &&
            recordDate.getMonth() === today.getMonth() &&
            recordDate.getFullYear() === today.getFullYear();
    });

    // Dynamic Medications logic. Note: calendarData.medicines has one entry
    // per scheduled dose time, not one per distinct medication - a single
    // medicine taken 3x/day produces 3 entries here.
    const medicines = calendarData?.medicines ?? [];
    const pendingMeds = medicines.filter((m: any) => m.status === 'pending');
    const pendingCount = pendingMeds.length;

    // Times are 12h "h:mm A" strings ("9:30 AM", "2:00 PM") - a plain
    // string sort/localeCompare orders them lexicographically ("2:00 PM"
    // before "9:30 AM"), not chronologically, which is what was showing the
    // wrong "next" dose time. timeToMinutes normalizes to minutes-since-
    // midnight first, matching how CalendarScreen/CalendarModal already
    // sort this same data.
    const nextMedTime = pendingMeds.length > 0
        ? [...pendingMeds].sort((a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time))[0].time
        : '';

    const medsCompleted = medicines.length > 0 && pendingCount === 0;
    const noMedsScheduled = medicines.length === 0;

    // Dynamic Steps logic
    const stepsVal = useSelector(selectTodaySteps);
    const targetStepsVal = 10000;
    const stepsGoalCompleted = stepsVal >= targetStepsVal;

    const focusItems = [];

    // 1. Medication Reminder Item (Conditional wording & scheduling)
    if (noMedsScheduled) {
        focusItems.push({
            id: 'meds',
            title: 'Schedule medications',
            icon: Pill,
            urgent: true,
            time: 'Set daily reminders',
            completed: false,
            onPress: () => navigation.navigate('Calendar')
        });
    } else {
        focusItems.push({
            id: 'meds',
            title: pendingCount > 0
                ? `${pendingCount} dose${pendingCount > 1 ? 's' : ''} due today`
                : 'All doses taken',
            icon: Pill,
            urgent: pendingCount > 0,
            time: pendingCount > 0 ? `Next: ${nextMedTime}` : 'Completed',
            completed: pendingCount === 0,
            onPress: () => navigation.navigate('Calendar')
        });
    }

    // 2. Blood Pressure Log Item
    focusItems.push({
        id: 'bp',
        title: bpLoggedToday ? 'Blood pressure logged' : 'Log blood pressure',
        icon: bpLoggedToday ? Check : Activity,
        urgent: false,
        time: bpLoggedToday ? 'Completed' : 'Pending',
        completed: bpLoggedToday,
        onPress: () => setVitalsModalVisible(true) // Opens the logging flow modal directly!
    });

    // 3. Smart Wearable Sync Item / Daily Steps Tracker
    if (!hasStepsSource) {
        focusItems.push({
            id: 'wearable',
            title: 'Pair a wearable device',
            icon: Smartphone,
            urgent: false,
            time: 'Track auto steps & pulse',
            completed: false,
            onPress: () => setDeviceModalVisible(true) // Opens pairing flow directly!
        });
    } else {
        // Wearable connected: show Daily Steps goal item
        focusItems.push({
            id: 'steps',
            title: stepsGoalCompleted ? 'Daily steps completed' : 'Complete daily steps',
            icon: stepsGoalCompleted ? Check : Activity,
            urgent: false,
            time: stepsGoalCompleted ? 'Completed' : `${stepsVal.toLocaleString()} / ${targetStepsVal.toLocaleString()} steps`,
            completed: stepsGoalCompleted,
            onPress: () => setDeviceModalVisible(true) // Direct connection view to sync/configure
        });
    }

    return (
        <HealthSection title="Today's Focus" icon={<Zap size={14} color="#F59E0B" fill="#F59E0B" />}>
            <View style={styles.card}>
                {focusItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.row,
                                item.completed && styles.rowCompleted,
                                index !== focusItems.length - 1 && styles.divider
                            ]}
                            disabled={item.completed}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View
                                style={[
                                    styles.iconBox,
                                    item.completed
                                        ? { backgroundColor: '#DCFCE7' }
                                        : (item.urgent ? styles.urgentBg : styles.normalBg)
                                ]}
                            >
                                <Icon size={20} color={item.completed ? '#2FA561' : (item.urgent ? '#EF4444' : '#2FA561')} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowText, item.completed && styles.rowTextCompleted]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.timeText, item.completed && { color: '#10B981' }]}>{item.time}</Text>
                            </View>
                            {item.completed ? (
                                <View style={styles.completedBadge}>
                                    <Check size={13} color="#fff" strokeWidth={3} />
                                </View>
                            ) : (
                                <ChevronRight size={18} color="#D1D5DB" />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Injected Modals to make all actions fully functional */}
            <RecordVitalsModal
                visible={vitalsModalVisible}
                onClose={() => setVitalsModalVisible(false)}
            />

            <BluetoothDeviceModal
                visible={deviceModalVisible}
                onClose={() => setDeviceModalVisible(false)}
            />
        </HealthSection>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14 },
    // Completed rows get a tinted highlight instead of struck-through text -
    // strikethrough reads as "cancelled/removed", not "accomplished".
    rowCompleted: {
        backgroundColor: '#F0FDF4',
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginHorizontal: -10,
    },
    rowText: { fontSize: 15, fontWeight: '700', color: '#111827' },
    rowTextCompleted: { color: '#059669' },
    timeText: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    urgentBg: { backgroundColor: '#FEF2F2' },
    normalBg: { backgroundColor: '#F0FDF4' },
    completedBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#2FA561',
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        paddingBottom: 16,
        marginBottom: 16
    },
});
