import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export interface BookingInfo {
  bookedForSelf: boolean;
  bookedBy?: { id: string; name: string } | null;
  patientName?: string;
  patientRelation?: string;
  patientHasAccount?: boolean;
}

interface Props {
  booking?: BookingInfo | null;
  /** 'booker' = I booked it, 'patient' = it was booked for me */
  myRole?: 'booker' | 'patient' | null;
}

const capitalise = (text?: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

/** "Booked by you for Ram (Grandfather)" / "Booked for you by Amrit". Renders nothing for a booking you made for yourself. */
export const bookingLine = ({ booking, myRole }: Props) => {
  if (!booking || booking.bookedForSelf) return '';
  const relation = booking.patientRelation ? ` (${capitalise(booking.patientRelation)})` : '';
  if (myRole === 'patient') return `Booked for you by ${booking.bookedBy?.name || 'your family'}`;
  return `Booked by you for ${booking.patientName || 'a family member'}${relation}`;
};

export default function BookingBadge({ booking, myRole }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const line = bookingLine({ booking, myRole });
  if (!line) return null;
  return (
    <View style={styles.badge}>
      <Users size={12} color="#10B981" />
      <Text style={styles.text} numberOfLines={1}>{line}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: c.successBg,
    },
    text: { fontSize: 11, fontWeight: '600', color: c.success, flexShrink: 1 },
  });
