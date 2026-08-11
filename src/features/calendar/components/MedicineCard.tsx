import { Check, Clock, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RenderMedicationIcon } from '../../../components/modals/AddMedicationModal/config/shapes';
import StatusModal from '../../../components/modals/StatusModal';
import { COLORS } from '../styles';

interface Props {
  scheduleId: string;
  date: string;
  name: string;
  dosage: string;
  time: string;
  status: string; // 'taken' | 'skipped' | 'pending'
  shape?: string;
  color?: string;
  leftColor?: string;
  rightColor?: string;
  isFuture?: boolean;
  onMarkIntake: (status: 'taken' | 'skipped') => void;
}

// Matches AppointmentCard's card language (border instead of shadow, same
// icon box size/radius, same name/subtitle/meta-row type scale) so a
// consultation and a medicine reminder read as the same kind of thing in
// the merged "Today's schedule" list.
export default function MedicineCard({
  // scheduleId,
  // date,
  name,
  dosage,
  time,
  status,
  shape,
  color,
  leftColor,
  rightColor,
  isFuture,
  onMarkIntake
}: Props) {
  const isTaken = status === 'taken';
  const isSkipped = status === 'skipped';

  // Status Modal State
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    // Replaced Alert.alert with specific confirm modal logic if needed,
    // but here we can just show the StatusModal for confirmation
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        disabled={isTaken || isSkipped || isFuture}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={[
          styles.iconBox,
          { backgroundColor: isSkipped ? '#FFEBEB' : (color || '#E0F7F4') }
        ]}>
          <RenderMedicationIcon
            shapeKey={shape || 'tablet'}
            leftColor={leftColor}
            rightColor={rightColor}
            size={0.8}
          />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {!!dosage && <Text style={styles.dosage} numberOfLines={1}>{dosage}</Text>}
          <View style={styles.metaRow}>
            <Clock size={12} color={COLORS.textSecondary} />
            <Text style={styles.timeText}>{time}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.rightCol}>
          {(!isTaken && !isSkipped && !isFuture) ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionCircle, styles.skipBtn]}
                onPress={() => onMarkIntake('skipped')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={18} color="#EF4444" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionCircle, styles.takeBtn]}
                onPress={() => onMarkIntake('taken')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Check size={18} color="#10B981" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            (isTaken || isSkipped) && (
              <View style={[styles.statusBadge, isTaken ? styles.badgeTaken : styles.badgeSkipped]}>
                <Text style={[styles.statusText, isTaken ? styles.textTaken : styles.textSkipped]}>
                  {isTaken ? 'Taken' : 'Skipped'}
                </Text>
              </View>
            )
          )}
        </View>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <StatusModal
        visible={modalVisible}
        status="warning"
        title="Medication Check"
        message={`Have you taken ${name} (${dosage}) scheduled for ${time}?`}
        onClose={() => setModalVisible(false)}
        primaryAction={() => {
          setModalVisible(false);
          onMarkIntake('taken');
        }}
        primaryActionText="Taken"
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  dosage: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    backgroundColor: '#FEF2F2',
  },
  takeBtn: {
    backgroundColor: '#ECFDF5',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeTaken: {
    backgroundColor: '#ECFDF5',
  },
  badgeSkipped: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textTaken: {
    color: '#10B981',
  },
  textSkipped: {
    color: '#EF4444',
  },
});
