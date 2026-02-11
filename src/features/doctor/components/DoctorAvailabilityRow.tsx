import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DoctorAvailabilityRow({
  label,
}: {
  label: string;
}) {
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },

  label: {
    width: 80,
    fontSize: 12,
    color: '#6B7280',
  },

  slot: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },

  slotText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
});
