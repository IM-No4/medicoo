import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';

import ColorStep from '../../components/modals/AddMedicationModal/steps/ColorStep';
import DurationStep from '../../components/modals/AddMedicationModal/steps/DurationStep';
import MedicationDetailsStep from '../../components/modals/AddMedicationModal/steps/MedicationDetailsStep';
import MedicationTypeStep from '../../components/modals/AddMedicationModal/steps/MedicationTypeStep';
import ReviewStep from '../../components/modals/AddMedicationModal/steps/ReviewStep';
import ScheduleStep from '../../components/modals/AddMedicationModal/steps/ScheduleStep';
import ShapeStep from '../../components/modals/AddMedicationModal/steps/ShapeStep';
import StrengthStep from '../../components/modals/AddMedicationModal/steps/StrengthStep';

import { createStyles } from '../../components/modals/AddMedicationModal/styles';
import { useTheme } from '../../theme/ThemeContext';
import { createMedicineSchedule, updateMedicineSchedule } from '../../services/api/medicine.api';
import { StorageService } from '../../services/storage';
import { loadMedicineSchedules, saveMedicineSchedules } from '../../services/storage/medicineSchedulesStorage';
import { refreshAndScheduleMedicineReminders, scheduleLocalMedicineReminders } from '../../services/notifications/medicineReminderScheduler';
import { useLanguage } from '../../i18n/LanguageContext';

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

// When route.params.editingSchedule is set, this screen edits that existing
// schedule instead of creating a new one - pre-fills every step from its
// data and PUTs on submit.
export default function AddMedicationScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingSchedule = route.params?.editingSchedule ?? null;
  // Adding (or editing) a medicine for a family member, not for me
  const forMemberId: string | null = route.params?.forMemberId ?? null;
  const forMemberName: string | null = route.params?.forMemberName ?? null;
  const isEditing = !!editingSchedule;
  const [stepIndex, setStepIndex] = useState(0);
  const insets = useSafeAreaInsets();
  // Starts already reflecting step 1 of N (see animateProgress's matching
  // formula below), not 0 - a bare 0% fill on the very first, most-seen
  // step of the wizard looked like an empty gray line with nothing
  // "progress bar" about it (same fix as AddGoalScreen's step indicator).
  const progressAnim = useState(new Animated.Value(1 / STEPS.length))[0];

  // Tracks the keyboard's real, OS-reported height so the fixed footer can
  // sit flush above it - same fix already used in
  // AIAssistantChatScreen/LoginScreen/LiveChatScreen/OrderSupportScreen.
  // KeyboardAvoidingView's "height" behavior on Android left a stray gap
  // here (roughly the size of the bottom safe-area inset, which is still
  // being added on top of the keyboard-shrunk space) between the footer
  // and the keyboard.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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

  // A fresh screen instance every time this route is navigated to, so the
  // form initializes directly from route params instead of needing a
  // visible-prop reset effect the old modal version needed.
  const [form, setForm] = useState(() =>
    editingSchedule ? buildFormFromSchedule(editingSchedule) : buildDefaultForm()
  );

  // Cast to any to avoid prop type mismatch issues across varied step components
  const StepComponent = STEPS[stepIndex] as any;

  const updateForm = (data: Partial<typeof form>) => {
    setForm(prev => ({ ...prev, ...data }));
  };

  const animateProgress = (toStep: number) => {
    Animated.spring(progressAnim, {
      // (toStep + 1) / length, not toStep / (length - 1) - the latter is 0%
      // on the first step, which read as an empty gray line rather than a
      // progress bar. This way step 1 of 8 already shows ~12% filled.
      toValue: (toStep + 1) / STEPS.length,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  };

  const goToStep = (next: number) => {
    animateProgress(next);
    setStepIndex(next);
  };

  // Used by the step components' own onBack prop - clamps at step 0 rather
  // than leaving the screen, matching the original modal's behavior there.
  const handleStepBack = () => goToStep(Math.max(0, stepIndex - 1));

  const goBack = () => {
    if (stepIndex > 0) {
      goToStep(stepIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  // Without this, the Android hardware back button/gesture bypasses the
  // step logic entirely and closes the whole screen mid-wizard - only the
  // header's own back chevron (which calls goBack directly) respected it.
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goBack();
        return true; // Prevents the default pop action
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [stepIndex])
  );

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

      // Declared outside the try block (not just above it inside handleNext)
      // so the catch block below - which needs to queue this exact payload
      // when offline - can actually see it.
      const payload = {
        ...form,
        dosage,
        scheduleType,
        medicineType: form.type,
        shape: form.shape,
        frequency,
        ...(forMemberId ? { forMemberId } : {}),
      };

      try {
        setLoading(true);

        if (isEditing) {
          await updateMedicineSchedule(editingSchedule._id, payload);
          setLoading(false);
          showStatus('success', t('medication_updated'), t('your_medication_schedule_has_been_upda'));
        } else {
          await createMedicineSchedule(payload);
          setLoading(false);
          showStatus('success', t('medication_saved'), t('your_prescription_schedule_has_been_up'));
        }

        // Re-fetches the full, authoritative schedule list (rather than
        // guessing at the create/update response's exact shape) and
        // re-derives the local reminder window from it - not awaited, the
        // save itself already succeeded and shouldn't wait on this.
        // (A family member's medicines remind them on their own phone, or the family head from the server - not this phone.)
        if (!forMemberId) refreshAndScheduleMedicineReminders();
      } catch (error: any) {
        setLoading(false);

        // No response at all (vs a real 4xx/5xx) means this never reached
        // the backend - almost always no internet. This used to just fail
        // outright with a generic error, unlike LogVitals (which already
        // queues offline writes for syncOfflineQueue) - same treatment here
        // now: queue it, tell the user it's saved, and let it actually sync
        // once back online instead of losing everything they just filled in.
        if (!error?.response) {
          // Queuing alone isn't enough - ManageMedicationsScreen reads from
          // its own local cache (medicineSchedulesStorage) whenever its own
          // fetch also fails offline, and that cache was only ever written
          // by a successful server fetch, so it had no idea this one
          // existed. Without also patching it here, "medicine got created"
          // (the queued write + this success message) was true, but the
          // list the user immediately checks next would still show nothing
          // for it until the queue actually syncs.
          const cachedSchedules = await loadMedicineSchedules();
          let updatedSchedules: any[];
          if (isEditing) {
            await StorageService.addToSyncQueue('UPDATE_MEDICINE', { id: editingSchedule._id, data: payload });
            updatedSchedules = cachedSchedules.map((s: any) => (s._id === editingSchedule._id ? { ...s, ...payload } : s));
          } else {
            await StorageService.addToSyncQueue('CREATE_MEDICINE', payload);
            const optimisticSchedule = { ...payload, _id: `offline_${Date.now()}` };
            updatedSchedules = [optimisticSchedule, ...cachedSchedules];
          }
          await saveMedicineSchedules(updatedSchedules);
          // No network needed here - reminders schedule straight from the
          // in-memory list we just built, same as the online path does
          // after its own fresh fetch.
          scheduleLocalMedicineReminders(updatedSchedules);
          showStatus(
            'success',
            isEditing ? 'Medication Updated' : 'Medication Saved',
            "You're offline - this will sync automatically once you're back online."
          );
          return;
        }

        showStatus('error', t('update_failed'), error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} medication schedule. Please try again.`);
      }
    } else {
      goToStep(Math.min(stepIndex + 1, STEPS.length - 1));
    }
  };

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        {/* Header - same recipe as the rest of the app: white bar + shadow,
            plain icon back button, fontSize 20/600/#111827 title. */}
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
          <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
            <ChevronLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {stepIndex === 0
                ? (isEditing ? 'Edit Medication' : 'Add Medication')
                : form.medicineName || 'Medication'}
            </Text>
            {forMemberName ? (
              <Text style={styles.headerSubtitle}>For {forMemberName}</Text>
            ) : null}
            {(form.type && stepIndex > 1 && !forMemberName) && (
              <Text style={styles.headerSubtitle}>
                {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
              </Text>
            )}
          </View>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
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
            onBack={handleStepBack}
            onSubmit={() => navigation.goBack()}
          />
        </ScrollView>

        {/* FIXED FOOTER */}
        <LinearGradient
          colors={[theme.background + '00', theme.background]}
          locations={[0, 0.3]}
          style={[
            styles.fixedFooter,
            { paddingBottom: keyboardHeight > 0 ? 12 : insets.bottom + 12 },
          ]}
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
              onPress={() => goToStep(Math.min(stepIndex + 1, STEPS.length - 1))}
            >
              <Text style={styles.skipButtonText}>{t('skip')}</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
      <StatusModal
        visible={status.visible}
        status={status.type}
        title={status.title}
        message={status.message}
        onClose={() => {
          setStatus(prev => ({ ...prev, visible: false }));
          if (status.type === 'success') navigation.goBack();
        }}
        autoCloseDelay={status.type === 'success' ? 2500 : undefined}
      />
    </>
  );
}
