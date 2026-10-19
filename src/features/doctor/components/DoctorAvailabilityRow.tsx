import React, { useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export default function DoctorAvailabilityRow({
  label,
}: {
  label: string;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity style={styles.slot}>
        <Text style={styles.slotText}>10:00 AM</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.slot}>
        <Text style={styles.slotText}>12:30 PM</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },

  label: {
    width: 80,
    fontSize: 12,
    color: c.textSecondary,
  },

  slot: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: c.successBg,
  },

  slotText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
});
