import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { COLORS } from '../styles';
import MedicineCard from './MedicineCard';

import EmptyState from '@/src/components/layout/EmptyState';
import { markMedicineIntake } from '@/src/redux/slices/calendarSlice';
import { AppDispatch } from '@/src/redux/store';

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

export default function CalendarModal({ visible, onClose, selectedDate, onSelectDate, data }: any) {
  const dispatch = useDispatch<AppDispatch>();
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [calendarGrid, setCalendarGrid] = useState<any[]>([]);

  // Calculate isFuture for the "Today's plan" section based on the SELECTED date (not the modal nav month)
  // Logic must match CalendarScreen
  const isFuture = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  }, [selectedDate]);

  useEffect(() => {
    if (visible) {
      // Reset to selected date when opening
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [visible]);

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
      // Removed hardcoded dots. 
      // TODO: specific endpoint needed to fetch monthly status.
      let status = null;

      grid.push({
        day: i,
        id: `curr-${i}`,
        status: status
      });
    }

    setCalendarGrid(grid);
  }, [currentMonth, currentYear]);

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
    onSelectDate(newDate);
    // Optional: Close on select? user preference. 
    // For now we keep it open so they can see "Today's plan" update
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Safe Area spacer for Modal */}
        <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight : 50 }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
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
                        {/* Dots: Only show if NOT selected (selected has solid bg) */}
                        {!isSelected && item.status === 'completed' && <View style={styles.dotTeal} />}
                        {!isSelected && item.status === 'missed' && <View style={styles.dotRed} />}
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

              const hasMedicines = data.medicines && data.medicines.length > 0;

              if (!hasMedicines) {
                return (
                  <EmptyState
                    title="No entries"
                    message="No scheduled plan for this date."
                  />
                );
              }

              return data.medicines.map((item: any) => (
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
              ));
            })()}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backIcon: {
    fontSize: 20,
    color: '#000',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
  dotTeal: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  dotRed: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.danger,
    marginTop: 4,
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