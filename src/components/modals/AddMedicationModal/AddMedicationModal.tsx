import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../StatusModal';

import ColorStep from './steps/ColorStep';
import DurationStep from './steps/DurationStep';
import MedicationDetailsStep from './steps/MedicationDetailsStep';
import MedicationTypeStep from './steps/MedicationTypeStep';
import ReviewStep from './steps/ReviewStep';
import ScheduleStep from './steps/ScheduleStep';
import ShapeStep from './steps/ShapeStep';
import StrengthStep from './steps/StrengthStep';

import { createMedicineSchedule, updateMedicineSchedule } from '../../../services/api/medicine.api';
import { styles } from './styles';

const STEPS = [
  MedicationDetailsStep,
  MedicationTypeStep,
  StrengthStep,
  ShapeStep,
  ColorStep,
  ScheduleStep,
  DurationStep,
  ReviewStep,
];

// Strength/unit are entered as separate fields in StrengthStep but stored
// server-side as one combined string (e.g. "500 mg") - split that back
// apart so editing an existing schedule pre-fills both. Falls back to
// leaving strength blank (dosage alone still carries the original value
// into the submit payload, see handleNext) for dosages that don't match
// this shape, e.g. "1 tablet".
const UNIT_SUFFIXES = ['mcg', 'mg', 'ml', 'g', '%'];
function parseDosage(dosage?: string): { strength: string; unit: string } {
  if (!dosage) return { strength: '', unit: 'mg' };
  const match = dosage.trim().match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z%]+)$/);
  if (match && UNIT_SUFFIXES.includes(match[2].toLowerCase())) {
    return { strength: match[1], unit: match[2].toLowerCase() };
  }
  return { strength: '', unit: 'mg' };
}

function buildDefaultForm() {
  return {
    medicineName: '',
    type: '',
    strength: '',
    unit: 'mg',
    dosage: '',
    shape: '',
    color: '',
    leftColor: '',
    rightColor: '',
    times: [] as string[],
    startDate: new Date(),
    endDate: null as Date | null,
    frequency: 'Every Day',
    displayName: '',
    notes: '',
    familyVisible: true,
    scheduleType: 'Every Day',
    selectedDays: [] as number[], // [0, 1, 2]
    intervalValue: 1,
    intervalType: 'Day', // 'Day' | 'Week'
    cycleDaysOn: 21,
    cycleDaysOff: 7,
    isActive: true,
  };
}

function buildFormFromSchedule(schedule: any) {
  const { strength, unit } = parseDosage(schedule.dosage);
  return {
    ...buildDefaultForm(),
    medicineName: schedule.medicineName || '',
    type: schedule.medicineType || '',
    strength,
    unit,
    dosage: schedule.dosage || '',
    shape: schedule.shape || '',
    color: schedule.color || '',
    leftColor: schedule.leftColor || '',
    rightColor: schedule.rightColor || '',
    times: schedule.times || [],
    startDate: schedule.startDate ? new Date(schedule.startDate) : new Date(),
    endDate: schedule.endDate ? new Date(schedule.endDate) : null,
    frequency: schedule.frequency || 'Every Day',
    notes: schedule.notes || '',
    familyVisible: schedule.familyVisible ?? true,
    scheduleType: schedule.scheduleType || 'Every Day',
    selectedDays: schedule.selectedDays || [],
    intervalValue: schedule.intervalValue || 1,
    intervalType: schedule.intervalType || 'Day',
    cycleDaysOn: schedule.cycleDaysOn || 21,
    cycleDaysOff: schedule.cycleDaysOff || 7,
    isActive: schedule.isActive ?? true,
  };
}

interface AddMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  // When set, the modal edits this existing schedule instead of creating a
  // new one - pre-fills every step from its data and PUTs on submit.
  editingSchedule?: any | null;
}

export default function AddMedicationModal({ visible, onClose, editingSchedule }: AddMedicationModalProps) {
  const isEditing = !!editingSchedule;
  const [stepIndex, setStepIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const translateY = useState(new Animated.Value(0))[0];
  const [status, setStatus] = useState<{
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'idle',
    title: '',
    message: ''
  });

  const showStatus = (type: StatusType, title: string, message: string) => {
    setStatus({ visible: true, type, title, message });
  };

  const [form, setForm] = useState(buildDefaultForm());

  // The modal stays mounted across opens (parent toggles `visible`, not
  // conditional rendering), so state has to be reset explicitly each time
  // it opens rather than relying on useState's initializer - otherwise a
  // second edit (or an edit right after an add) would reuse stale form data.
  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      setForm(editingSchedule ? buildFormFromSchedule(editingSchedule) : buildDefaultForm());
    }
  }, [visible, editingSchedule]);

  // Cast to any to avoid prop type mismatch issues across varied step components
  const StepComponent = STEPS[stepIndex] as any;

  const updateForm = (data: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...data }));
  };

  /* ---------- Swipe Down with Animation ---------- */
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to downward gestures
      return gestureState.dy > 5;
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        // If dragged down more than 100px, close the modal
        Animated.timing(translateY, {
          toValue: 1000,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose();
          // Reset after a short delay to prevent flash
          setTimeout(() => {
            translateY.setValue(0);
          }, 100);
        });
      } else {
        // Otherwise, snap back
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Helper: Check validity of current step
  const isNextDisabled = () => {
    switch (stepIndex) {
      case 0: // Details
        return !form.medicineName;
      case 1: // Type
        return !form.type;
      case 2: // Strength
        // Next is disabled if no strength entered? 
        // If user wants to skip, they use Skip button.
        // So yes, disable Next if strength is empty.
        return !form.strength;
      case 3: // Shape
        return !form.shape;
      case 4: // Color
        if (form.shape === 'capsule') {
          return !form.leftColor || !form.rightColor;
        }
        return !form.leftColor; // Single color shapes use leftColor as primary
      case 5: // Schedule
        return form.times.length === 0;
      case 6: // Duration
        return false;
      default:
        return false;
    }
  };

  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (stepIndex === STEPS.length - 1) {
      // Submit
      try {
        setLoading(true);
        const dosage = form.strength ? `${form.strength} ${form.unit}` : form.dosage;
        const scheduleType = form.scheduleType || 'Every Day';

        // Compute frequency text
        let frequency = scheduleType;
        if (scheduleType === 'Every Few Days') {
          frequency = `Every ${form.intervalValue} ${form.intervalType}${form.intervalValue > 1 ? 's' : ''}`;
        } else if (scheduleType === 'On Specific Days of the Week') {
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const days = (form.selectedDays || []).sort().map((d: number) => dayNames[d]).join(', ');
          if (days) frequency = days;
        }

        const payload = {
          ...form,
          dosage,
          scheduleType,
          medicineType: form.type,
          shape: form.shape,
          frequency,
        };

        if (isEditing) {
          await updateMedicineSchedule(editingSchedule._id, payload);
          setLoading(false);
          showStatus('success', 'Medication Updated', 'Your medication schedule has been updated.');
        } else {
          await createMedicineSchedule(payload);
          setLoading(false);
          showStatus('success', 'Medication Saved', 'Your prescription schedule has been updated.');
        }
      } catch (error: any) {
        setLoading(false);
        showStatus('error', 'Update Failed', error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} medication schedule. Please try again.`);
      }
    } else {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          />

          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [{ translateY }],
                paddingBottom: Math.max(insets.bottom, 0),
              },
            ]}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              <View style={styles.modalHeader} {...panResponder.panHandlers}>
                <View style={styles.dragIndicator} />

                <View style={styles.headerBar}>
                  <View style={styles.headerLeft}>
                    {stepIndex > 0 ? (
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => setStepIndex(i => i - 1)}
                      >
                        <ChevronLeft size={24} color="#111827" strokeWidth={2.5} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.iconButtonPlaceholder} />
                    )}
                  </View>

                  <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>
                      {stepIndex === 0
                        ? (isEditing ? 'Edit Medication' : 'Add Medication')
                        : form.medicineName || 'Medication'}
                    </Text>
                    {(form.type && stepIndex > 1) && (
                      <Text style={styles.headerSubtitle}>
                        {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.headerRight}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={onClose}
                    >
                      <X size={24} color="#111827" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* CONTENT */}
              <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 150 }} // Increased space for footer with Skip
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <StepComponent
                  data={form}
                  onChange={updateForm}
                  onNext={handleNext}
                  onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
                  onSubmit={onClose}
                />
              </ScrollView>

              {/* FIXED FOOTER */}
              <LinearGradient
                colors={['rgba(255,255,255,0)', '#ffffff']}
                locations={[0, 0.3]}
                style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom / 1.5, 20) }]}
              >
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    !isNextDisabled() && styles.primaryButtonActive,
                    isNextDisabled() && styles.primaryButtonDisabled
                  ]}
                  disabled={isNextDisabled() || loading}
                  onPress={handleNext}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryText}>
                      {stepIndex === STEPS.length - 1 ? 'Done' : 'Next'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Skip Button for Strength (2) and Shape (3) */}
                {(stepIndex === 2 || stepIndex === 3) && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => setStepIndex(i => Math.min(i + 1, STEPS.length - 1))}
                  >
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={() => {
          setStatus(prev => ({ ...prev, visible: false }));
          if (status.type === 'success') onClose();
        }}
        autoCloseDelay={status.type === 'success' ? 2500 : undefined}
      />
    </>
  );
}
