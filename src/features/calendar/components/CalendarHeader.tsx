import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../styles';

// Add the prop here
type Props = {
  onOpenCalendar: () => void;
  selectedDate: Date | null;
};

export default function CalendarHeader({ onOpenCalendar, selectedDate }: Props) {
  // Format date: "Wednesday, June 25"
  const dateString = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* <Text style={styles.appTitle}>Schedule</Text> */}

      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{dateString}</Text>
        {/* Connect the onPress handler */}
        <TouchableOpacity style={styles.iconButton} onPress={onOpenCalendar}>
          <Text style={{ fontSize: 20 }}>📅</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  }
});