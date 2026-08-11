import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from './styles';
import { formatDoctorName } from '../../utils/formatters';
import { getLocalDateString } from '../../utils/dateUtils';

// Components
import AppointmentCard from './components/AppointmentCard';
import CalendarHeader from './components/CalendarHeader';
import CalendarModal from './components/CalendarModal';
import CalendarSkeleton from './components/CalendarSkeleton';
import DateStrip from './components/DateStrip';
import MedicineCard from './components/MedicineCard';

import AddActionModal from '../../components/modals/AddActionModal';
import AddMedicationModal from '../../components/modals/AddMedicationModal/AddMedicationModal';
import ManageRemindersSheet from '../../components/modals/ManageRemindersSheet';

import { executeAction } from '../../actions/ActionExecutor';
import { loadCalendarCache, loadCalendarData, markMedicineIntake } from '@/src/redux/slices/calendarSlice';
import { selectActiveGoals } from '@/src/redux/slices/goalsSlice';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/layout/EmptyState';
import ErrorState from '../../components/layout/ErrorState';
import AddGoalModal from '../../components/modals/AddGoalModal/AddGoalModal';
import { GoalsCard } from '../health/components/GoalsCard';
import { AppDispatch, RootState } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';
import { Settings } from 'lucide-react-native';
import { timeToMinutes } from './utils/scheduleSort';

export default function CalendarScreen() {
    const [isFocused, setIsFocused] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => setIsFocused(false);
        }, [])
    );

    const dispatch = useDispatch<AppDispatch>();
    const navigation = useNavigation<any>();

    const { data, loading, error } = useSelector(
        (state: RootState) => state.calendar
    );

    // Read active goals to conditionally show goals card
    const activeGoals = useSelector(selectActiveGoals);
    const hasActiveGoals = activeGoals.length > 0;

    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [showAddAction, setShowAddAction] = useState(false);
    const [showAddMedication, setShowAddMedication] = useState(false);
    const [showAddGoal, setShowAddGoal] = useState(false);
    const [showManageSheet, setShowManageSheet] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    // Tracks only pull-to-refresh gestures, separate from the redux `loading`
    // flag - initial loads and date-switch loads show the skeleton instead,
    // so the native pull spinner and the skeleton never stack on top of
    // each other.
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    // useFocusEffect (not a plain useEffect) so returning to this screen
    // after adding/editing/deleting a medication or goal elsewhere - e.g.
    // ManageMedicationsScreen, ManageGoalsScreen, or a Home screen quick
    // action - refetches automatically instead of showing stale data until
    // the user pulls to refresh or changes the selected date. Still refires
    // on selectedDate changes while already focused, since useFocusEffect
    // reruns whenever its callback identity changes (the useCallback dep).
    useFocusEffect(
        useCallback(() => {
            const dateStr = getLocalDateString(selectedDate);
            dispatch(loadCalendarCache(dateStr));
            dispatch(loadCalendarData(dateStr));
        }, [dispatch, selectedDate])
    );

    const onRefresh = React.useCallback(() => {
        setIsManualRefreshing(true);
        dispatch(loadCalendarData(getLocalDateString(selectedDate)));
    }, [dispatch, selectedDate]);

    useEffect(() => {
        if (!loading) setIsManualRefreshing(false);
    }, [loading]);

    /* ---------------- DATA & LOGIC ---------------- */
    const { appointments, medicines } = data;

    // Date Comparison for UI Logic
    const dateStr = getLocalDateString(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const isFuture = selected.getTime() > today.getTime();
    const isPast = selected.getTime() < today.getTime();

    // Check if data matches selected date (to prevent stale flash)
    const isDataForSelectedDate = (data as any).date === dateStr;

    // Appointments and medicines each get their own section (sorted by
    // time-of-day within themselves), rather than one interleaved list.
    const sortedAppointments = [...appointments].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    const sortedMedicines = [...medicines].sort(
        (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );

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
                onOpenManage={() => setShowManageSheet(true)}
            />
            <DateStrip
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                refreshControl={
                    <RefreshControl refreshing={isManualRefreshing} onRefresh={onRefresh} />
                }
            >
                {showSkeleton ? (
                    <CalendarSkeleton />
                ) : (
                    <>
                        {/* Appointments */}
                        {sortedAppointments.length > 0 && (
                            <>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>Today's schedule</Text>
                                </View>
                                <View style={{ marginHorizontal: 24 }}>
                                    {sortedAppointments.map((item: any) => (
                                        <AppointmentCard
                                            key={item.id}
                                            doctorName={formatDoctorName(item.title)}
                                            specialty={item.subtitle}
                                            time={
                                                item.endTime && item.endTime !== item.startTime
                                                    ? `${item.startTime} - ${item.endTime}`
                                                    : item.startTime
                                            }
                                            status={item.status}
                                            consultationType={item.consultationType}
                                            onPress={
                                                item.requestId
                                                    ? () => executeAction('OPEN_CONSULTATION_DETAIL', { requestId: item.requestId })
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Medications - own label + manage button, matching
                            the "Active Goals" section's pattern below */}
                        {sortedMedicines.length > 0 && (
                            <>
                                <View style={styles.sectionHeaderRow}>
                                    <Text style={styles.sectionTitle}>Medications</Text>
                                    <TouchableOpacity
                                        style={styles.manageBtn}
                                        onPress={() => navigation.navigate('ManageMedications' as never)}
                                        activeOpacity={0.7}
                                    >
                                        <Settings size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
                                        <Text style={styles.manageBtnText}>Manage</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{ marginHorizontal: 24 }}>
                                    {sortedMedicines.map((item: any) => (
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
                            </>
                        )}

                        {/* Only show Goals Card when there are active goals */}
                        {hasActiveGoals && (
                            <GoalsCard />
                        )}

                        {/* Empty State */}
                        {medicines.length === 0 && appointments.length === 0 && (
                            <EmptyState
                                title={isPast ? 'Nothing on this day' : 'No plans yet'}
                                message={
                                    isPast
                                        ? 'No appointments or reminders were scheduled for this date.'
                                        : 'Your appointments and medicine reminders will show up here.'
                                }
                                actionLabel={isPast ? undefined : 'Add a reminder'}
                                onAction={isPast ? undefined : () => setShowAddAction(true)}
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

            {/* Manage Reminders Bottom Sheet */}
            <ManageRemindersSheet
                visible={showManageSheet}
                onClose={() => setShowManageSheet(false)}
                onGoToMedications={() => navigation.navigate('ManageMedications' as never)}
                onGoToGoals={() => navigation.navigate('ManageGoals' as never)}
            />
        </View>
    );
}
