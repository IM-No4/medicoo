import { Activity, ChevronRight, Pill, Zap, Check, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../../redux/store';
import { HealthSection } from './HealthSection';
import RecordVitalsModal from '../../../components/modals/RecordVitalsModal';
import BluetoothDeviceModal from './BluetoothDeviceModal';

export function TodaysFocus() {
    const navigation = useNavigation<any>();
    const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
    const [deviceModalVisible, setDeviceModalVisible] = useState(false);

    const { records } = useSelector((state: RootState) => state.vitals);
    const { data: calendarData } = useSelector((state: RootState) => state.calendar);
    const { connectedDevice } = useSelector((state: RootState) => state.device);

    // Dynamic BP logic
    const bpLoggedToday = records.some(r => {
        if (r.systolic === undefined || r.diastolic === undefined) return false;
        const recordDate = new Date(r.timestamp);
        const today = new Date();
        return recordDate.getDate() === today.getDate() &&
            recordDate.getMonth() === today.getMonth() &&
            recordDate.getFullYear() === today.getFullYear();
    });

    // Dynamic Medications logic
    const medicines = calendarData?.medicines ?? [];
    const pendingMeds = medicines.filter((m: any) => m.status === 'pending');
    const pendingCount = pendingMeds.length;

    const nextMedTime = pendingMeds.length > 0 
        ? [...pendingMeds].sort((a: any, b: any) => a.time.localeCompare(b.time))[0].time 
        : '';

    const medsCompleted = medicines.length > 0 && pendingCount === 0;
    const noMedsScheduled = medicines.length === 0;

    // Dynamic Steps logic
    const stepsVal = connectedDevice?.data?.steps ?? 0;
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
                ? `${pendingCount} medication${pendingCount > 1 ? 's' : ''} due today` 
                : 'All medications taken',
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
    if (!connectedDevice) {
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
                                        ? { backgroundColor: '#F0FDF4' } 
                                        : (item.urgent ? styles.urgentBg : styles.normalBg)
                                ]}
                            >
                                <Icon size={20} color={item.completed ? '#2FA561' : (item.urgent ? '#EF4444' : '#2FA561')} />
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowText, item.completed && { color: '#6B7280', textDecorationLine: 'line-through' }]}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.timeText, item.completed && { color: '#10B981' }]}>{item.time}</Text>
                            </View>
                            {!item.completed && <ChevronRight size={18} color="#D1D5DB" />}
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowText: { fontSize: 15, fontWeight: '700', color: '#111827' },
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
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
        paddingBottom: 16,
        marginBottom: 16
    },
});
