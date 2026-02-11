import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Clock, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ManageAvailabilityScreen() {
    const insets = useSafeAreaInsets();
    const [schedule, setSchedule] = useState<any>({
        Monday: { enabled: true, slots: [{ start: '09:00 AM', end: '05:00 PM' }] },
        Tuesday: { enabled: true, slots: [{ start: '09:00 AM', end: '05:00 PM' }] },
        Wednesday: { enabled: true, slots: [{ start: '09:00 AM', end: '05:00 PM' }] },
        Thursday: { enabled: true, slots: [{ start: '09:00 AM', end: '05:00 PM' }] },
        Friday: { enabled: true, slots: [{ start: '09:00 AM', end: '05:00 PM' }] },
        Saturday: { enabled: false, slots: [] },
        Sunday: { enabled: false, slots: [] },
    });

    const toggleDay = (day: string) => {
        setSchedule((prev: any) => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled
            }
        }));
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Availability</Text>
                <TouchableOpacity style={styles.saveButton}>
                    <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.description}>
                    Set your weekly availability. Patients will only be able to book appointments during these times.
                </Text>

                {DAYS.map((day) => (
                    <View key={day} style={styles.dayCard}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayName}>{day}</Text>
                            <Switch
                                value={schedule[day].enabled}
                                onValueChange={() => toggleDay(day)}
                                trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                                thumbColor={schedule[day].enabled ? '#2FA561' : '#F3F4F6'}
                            />
                        </View>

                        {schedule[day].enabled && (
                            <View style={styles.slotsContainer}>
                                {schedule[day].slots.map((slot: any, index: number) => (
                                    <View key={index} style={styles.slotRow}>
                                        <Clock size={16} color="#6B7280" />
                                        <Text style={styles.slotText}>{slot.start} - {slot.end}</Text>
                                        <TouchableOpacity style={styles.removeSlot}>
                                            <Trash2 size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addSlotButton}>
                                    <Plus size={16} color="#2FA561" />
                                    <Text style={styles.addSlotText}>Add Slot</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    saveButton: { padding: 8, marginRight: -8 },
    saveText: { color: '#2FA561', fontWeight: '600', fontSize: 16 },
    content: { padding: 20, paddingBottom: 100 },
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
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 8
    },
    slotText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#374151', fontWeight: '500' },
    removeSlot: { padding: 4 },
    addSlotButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 8,
        marginTop: 4,
        borderStyle: 'dashed'
    },
    addSlotText: { color: '#2FA561', fontWeight: '600', fontSize: 14, marginLeft: 6 }
});
