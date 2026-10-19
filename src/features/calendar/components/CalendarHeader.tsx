import { Settings } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

// Add the prop here
type Props = {
  onOpenCalendar: () => void;
  onOpenManage?: () => void;
  selectedDate: Date | null;
};

export default function CalendarHeader({ onOpenCalendar, onOpenManage, selectedDate }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  // Format date: "Wednesday, June 25"
  const dateString = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{dateString}</Text>
        <View style={styles.actionsRow}>
          {onOpenManage && (
            <TouchableOpacity style={[styles.iconButton, { marginRight: 8 }]} onPress={onOpenManage}>
              <Settings size={20} color={theme.text} />
            </TouchableOpacity>
          )}
          {/* Connect the onPress handler */}
          <TouchableOpacity style={styles.iconButton} onPress={onOpenCalendar}>
            <Text style={{ fontSize: 20 }}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  // Same white bar + shadow recipe as the Records and Health screen
  // headers, so all three read as one consistent header style.
  container: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    marginBottom: 16,
    backgroundColor: c.background,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Matches the title treatment used on the Records and Health screen
  // headers (fontSize 20 / weight 600 / #111827) so the three read as one
  // consistent header style instead of each picking its own.
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: c.card,
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