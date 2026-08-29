import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { COLORS } from './styles';
import MedicineCard from './components/MedicineCard';

import EmptyState from '@/src/components/layout/EmptyState';
import { loadCalendarData, markMedicineIntake } from '@/src/redux/slices/calendarSlice';
import { AppDispatch, RootState } from '@/src/redux/store';
import { DayEventStatus, fetchCalendarMonthStatus } from '@/src/services/api/calendar.api';
import { executeAction } from '@/src/actions/ActionExecutor';
import { formatDoctorName } from '@/src/utils/formatters';
import { getLocalDateString } from '@/src/utils/dateUtils';
import AppointmentCard from './components/AppointmentCard';
import { timeToMinutes } from './utils/scheduleSort';

// Helper to get days in a month
const getDaysInMonth = (month: any, year: any) => {
  return new Date(year, month + 1, 0).getDate();
};

// Helper to get which day of the week the month starts on (0 = Sun, 1 = Mon...)
// We adjust so 0 = Mon to match your UI
const getFirstDayOfMonth = (month: any, year: any) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
};

// Route params:
//   initialDate?: Date - which date to start on (defaults to today)
//   onSelectDate?: (date: Date) => void - notified whenever a day is
//     tapped, so the calendar screen that pushed this one can stay in sync
//     with whatever date the user last picked here.
export default function CalendarMonthScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const onSelectDateParam = route.params?.onSelectDate as ((date: Date) => void) | undefined;

  const dispatch = useDispatch<AppDispatch>();
  const [selectedDate, setSelectedDate] = useState<Date>(route.params?.initialDate ?? new Date());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [calendarGrid, setCalendarGrid] = useState<any[]>([]);
  const [monthStatus, setMonthStatus] = useState<Record<string, DayEventStatus>>({});

  // Sourced directly from Redux (not passed in as a prop/param) so the
  // "Today's plan" preview below always reflects whichever day is
  // currently selected within this screen, not a stale snapshot from
  // whenever the screen was first opened.
  const data = useSelector((state: RootState) => state.calendar.data);

  useEffect(() => {
    dispatch(loadCalendarData(getLocalDateString(selectedDate)));
  }, [dispatch, selectedDate]);

  // Calculate isFuture for the "Today's plan" section based on the SELECTED date (not the nav month)
  // Logic must match CalendarScreen
  const isFuture = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }, [selectedDate]);

  // Fetch which days this month have an event (medicine reminder,
  // consultation, or lab booking) to drive the dots below - one call per
  // month shown, not per day.
  useEffect(() => {
    let cancelled = false;
    const monthParam = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    fetchCalendarMonthStatus(monthParam)
      .then((data) => { if (!cancelled) setMonthStatus(data); })
      .catch((err) => {
        console.warn('Failed to load calendar month status:', err);
        if (!cancelled) setMonthStatus({});
      });
    return () => { cancelled = true; };
  }, [currentMonth, currentYear]);

  // Generate the grid logic
  useEffect(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const grid = [];

    // Padding for empty slots at start
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: null, id: `prev-${i}` });
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const eventStatus = monthStatus[dateStr];

      grid.push({
        day: i,
        id: `curr-${i}`,
        eventStatus,
      });
    }

    setCalendarGrid(grid);
  }, [currentMonth, currentYear, monthStatus]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    if (!day) return;
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    onSelectDateParam?.(newDate);
    // Optional: navigate back on select? user preference.
    // For now we keep the screen open so they can see "Today's plan" update.
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <View style={styles.container}>
      {/* Header - same recipe as the rest of the app: white bar + shadow,
          plain icon back button, fontSize 20/600/#111827 title. */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Calendar Card */}
          <View style={styles.calendarCard}>
            {/* Month Nav */}
            <View style={styles.monthNav}>
              <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrow}>
                <Text style={styles.navText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
              <TouchableOpacity onPress={handleNextMonth} style={styles.navArrow}>
                <Text style={styles.navText}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekRow}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <Text key={d} style={styles.weekText}>{d}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.daysGrid}>
              {calendarGrid.map((item, index) => {
                // Check if this specific day is selected
                const isSelected = item.day === selectedDate.getDate() &&
                  currentMonth === selectedDate.getMonth() &&
                  currentYear === selectedDate.getFullYear();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                    onPress={() => handleDayPress(item.day)}
                    disabled={!item.day}
                  >
                    {item.day && (
                      <>
                        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                          {item.day}
                        </Text>
                        {/* Dots: Only show if NOT selected (selected has solid bg) -
                            one per event type present that day, so a day with
                            both a reminder and a consultation shows two. */}
                        {!isSelected && (
                          <View style={styles.dotRow}>
                            {item.eventStatus?.medicine && <View style={[styles.eventDot, styles.dotMedicine]} />}
                            {item.eventStatus?.appointment && <View style={[styles.eventDot, styles.dotAppointment]} />}
                            {item.eventStatus?.lab && <View style={[styles.eventDot, styles.dotLab]} />}
                          </View>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Today's Plan Section */}
          <View style={styles.planSection}>
            <Text style={styles.planTitle}>Today's plan</Text>
            {(() => {
              const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

              // Prevent flicker: Wait for data to match selected date
              if (data?.date !== dateStr) return null;

              const sortedAppointments = [...(data.appointments || [])].sort(
                (a: any, b: any) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
              );
              const sortedMedicines = [...(data.medicines || [])].sort(
                (a: any, b: any) => timeToMinutes(a.time) - timeToMinutes(b.time)
              );

              if (sortedAppointments.length === 0 && sortedMedicines.length === 0) {
                return (
                  <EmptyState
                    title="Nothing scheduled"
                    message="No appointments or reminders for this date."
                  />
                );
              }

              return (
                <>
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
                </>
              );
            })()}
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  // Same header recipe as the rest of the app - white bar + shadow, plain
  // icon back button, fontSize 20/600/#111827 title.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    paddingBottom: 30,
    marginBottom: 24,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  navArrow: {
    width: 32,
    height: 32,
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: -2,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekText: {
    width: 40, // Fixed width for alignment
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Keeps alignment clean
  },
  dayCell: {
    width: 40,
    height: 50, // Taller to fit the dot
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 14,
  },
  selectedDayCell: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 4,
    height: 5,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotMedicine: {
    backgroundColor: COLORS.primary, // green - medicine reminder
  },
  dotAppointment: {
    backgroundColor: '#3B82F6', // blue - doctor consultation
  },
  dotLab: {
    backgroundColor: '#7C3AED', // purple - lab booking, matches the app's existing Lab Tests accent color
  },

  // Plan Section
  planSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  }
});