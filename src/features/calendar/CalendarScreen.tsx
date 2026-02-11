import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

// Components
import AppointmentCard from './components/AppointmentCard';
import CalendarHeader from './components/CalendarHeader';
import CalendarModal from './components/CalendarModal';
import CalendarSkeleton from './components/CalendarSkeleton';
import DateStrip from './components/DateStrip';
import MedicineCard from './components/MedicineCard';
import ProgressCard from './components/ProgressCard';

import AddActionModal from '../../components/modals/AddActionModal';
import AddMedicationModal from '../../components/modals/AddMedicationModal/AddMedicationModal';

import { loadCalendarCache, loadCalendarData, markMedicineIntake } from '@/src/redux/slices/calendarSlice';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/layout/EmptyState';
import ErrorState from '../../components/layout/ErrorState';
import AddGoalModal from '../../components/modals/AddGoalModal/AddGoalModal';
import { AppDispatch, RootState } from '../../redux/store';

export default function CalendarScreen() {
    const [isFocused, setIsFocused] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => setIsFocused(false);
        }, [])
    );

    const dispatch = useDispatch<AppDispatch>();

    const { data, loading, error } = useSelector(
        (state: RootState) => state.calendar
    );

    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [showAddAction, setShowAddAction] = useState(false);
    const [showAddMedication, setShowAddMedication] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        dispatch(loadCalendarCache(dateStr));
        dispatch(loadCalendarData(dateStr));
    }, [dispatch, selectedDate]);

    const onRefresh = React.useCallback(() => {
        const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        dispatch(loadCalendarData(dateStr));
    }, [dispatch, selectedDate]);

    /* ---------------- DATA & LOGIC ---------------- */
    const { progress, appointments, medicines } = data;

    // Date Comparison for UI Logic
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const isFuture = selected.getTime() > today.getTime();
    const isPast = selected.getTime() < today.getTime();

    // Check if data matches selected date (to prevent stale flash)
    const isDataForSelectedDate = (data as any).date === dateStr;

    // Show skeleton if:
    // 1. Loading AND switching dates (data mismatch)
    // 2. Loading AND initial empty state
    const showSkeleton = loading && (!isDataForSelectedDate || (medicines.length === 0 && appointments.length === 0));

    /* ---------------- ERROR ---------------- */
    if (error) {
        return (
            <View style={styles.screen}>
                <CalendarHeader
                    selectedDate={selectedDate}
                    onOpenCalendar={() => setCalendarVisible(true)}
                />
                <ErrorState
                    message={error}
                    onRetry={() => {
                        dispatch(loadCalendarData(dateStr));
                    }}
                />
            </View>
        );
    }

    /* ---------------- CONTENT ---------------- */
    return (
        <View style={styles.screen}>
            {isFocused && <StatusBar style="dark" translucent backgroundColor="#fff" />}
            {/* Header & Date Strip */}
            <CalendarHeader
                selectedDate={selectedDate}
                onOpenCalendar={() => setCalendarVisible(true)}
            />
            <DateStrip
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} />
                }
            >
                {showSkeleton ? (
                    <CalendarSkeleton />
                ) : (
                    <>
                        {/* Progress Section */}
                        {progress.total > 0 && !isFuture && (
                            <ProgressCard
                                taken={progress.taken}
                                total={progress.total}
                                percentage={
                                    progress.total > 0
                                        ? Math.round((progress.taken / progress.total) * 100)
                                        : 0
                                }
                            />
                        )}

                        {/* Appointments */}
                        {appointments.length > 0 && (
                            <View>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>My appointments</Text>
                                    <Text style={styles.seeAllText}>See all &gt;</Text>
                                </View>

                                {appointments.map((item: any) => (
                                    <AppointmentCard
                                        key={item.id}
                                        doctorName={item.title}
                                        specialty={item.subtitle}
                                        time={`${item.startTime} - ${item.endTime}`}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Reminders Header */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>My reminders</Text>
                            {!isPast && (
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => setShowAddAction(true)}
                                >
                                    <Text style={styles.addButtonText}>+ Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={{ marginHorizontal: 24 }}>
                            {/* Medicines */}
                            {medicines.map((item: any) => (
                                <MedicineCard
                                    key={item.id}
                                    scheduleId={item.id.split('_')[0]}
                                    date={dateStr}
                                    name={item.title}
                                    dosage={item.subtitle}
                                    time={item.time}
                                    status={item.status}
                                    shape={item.shape}
                                    color={item.color}
                                    leftColor={item.leftColor}
                                    rightColor={item.rightColor}
                                    isFuture={isFuture}
                                    onMarkIntake={(status) => {
                                        dispatch(markMedicineIntake({
                                            scheduleId: item.id.split('_')[0],
                                            date: dateStr,
                                            time: item.time,
                                            status,
                                        }));
                                    }}
                                />
                            ))}
                        </View>

                        {/* Empty State */}
                        {medicines.length === 0 && appointments.length === 0 && (
                            <EmptyState
                                title="No entries today"
                                message="Appointments and medicines will appear here."
                            />
                        )}
                    </>
                )}
            </ScrollView>

            {/* Calendar Date Picker Modal */}
            <CalendarModal
                visible={isCalendarVisible}
                onClose={() => setCalendarVisible(false)}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                data={data}
            />

            {/* Add Action Modal */}
            <AddActionModal
                visible={showAddAction}
                onClose={() => setShowAddAction(false)}
                onAddMedication={() => {
                    setShowAddAction(false);
                    setShowAddMedication(true);
                }}
                onAddGoal={() => {
                    setShowAddAction(false);
                    setShowAddGoal(true);
                }}
            />

            {/* Add Medication Modal */}
            <AddMedicationModal
                visible={showAddMedication}
                onClose={() => {
                    setShowAddMedication(false);
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    dispatch(loadCalendarData(dateStr));
                }}
            />

            {/* Add Goal Modal */}
            <AddGoalModal
                visible={showAddGoal}
                onClose={() => setShowAddGoal(false)}
            />
        </View>
    );
}
