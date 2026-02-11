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
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.dosage}>{dosage}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionContainer}>
          {(!isTaken && !isSkipped && !isFuture) ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.skipBtn]}
                onPress={() => onMarkIntake('skipped')}
              >
                <Text style={styles.skipBtnText}>Skipped</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.takeBtn]}
                onPress={() => onMarkIntake('taken')}
              >
                <Text style={styles.takeBtnText}>Taken</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (isTaken || isSkipped) && (
              <View style={[styles.statusBadge, isTaken ? styles.badgeTaken : styles.badgeSkipped]}>
                <Text style={[styles.badgeText, isTaken ? styles.textTaken : styles.textSkipped]}>
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
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
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
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  dosage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionContainer: {
    marginLeft: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    backgroundColor: '#FEF2F2',
  },
  takeBtn: {
    backgroundColor: '#ECFDF5',
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  takeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeTaken: {
    backgroundColor: '#ECFDF5',
  },
  badgeSkipped: {
    backgroundColor: '#FEF2F2',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textTaken: {
    color: '#10B981',
  },
  textSkipped: {
    color: '#EF4444',
  },
});