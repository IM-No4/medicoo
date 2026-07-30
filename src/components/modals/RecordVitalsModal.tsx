import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Activity, Heart, Weight, X, Check } from 'lucide-react-native';
import { addVitalRecord } from '../../redux/slices/vitalsSlice';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function RecordVitalsModal({ visible, onClose }: Props) {
  const dispatch = useDispatch();
  
  // Local states for inputs
  const [heartRate, setHeartRate] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [weight, setWeight] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    
    // Parse values
    const hrVal = heartRate ? parseInt(heartRate) : undefined;
    const sysVal = systolic ? parseInt(systolic) : undefined;
    const diaVal = diastolic ? parseInt(diastolic) : undefined;
    const weightVal = weight ? parseFloat(weight) : undefined;

    if (!hrVal && !sysVal && !diaVal && !weightVal) {
      setError('Please fill in at least one vital parameter.');
      return;
    }

    if (hrVal && (hrVal < 30 || hrVal > 250)) {
      setError('Please enter a valid Heart Rate between 30 and 250 bpm.');
      return;
    }

    if ((sysVal && !diaVal) || (!sysVal && diaVal)) {
      setError('Please enter both Systolic and Diastolic blood pressure values.');
      return;
    }

    if (sysVal && diaVal && (sysVal < 50 || sysVal > 250 || diaVal < 30 || diaVal > 150)) {
      setError('Please enter valid Blood Pressure values.');
      return;
    }

    if (weightVal && (weightVal < 2 || weightVal > 500)) {
      setError('Please enter a valid Weight.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      dispatch(addVitalRecord({
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        heartRate: hrVal,
        systolic: sysVal,
        diastolic: diaVal,
        weight: weightVal,
      }));

      // Reset values
      setHeartRate('');
      setSystolic('');
      setDiastolic('');
      setWeight('');
      setLoading(false);
      onClose();
    }, 800);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.backdrop} />
          
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Log Vitals Manually</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Form Content */}
              <View style={styles.form}>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Heart Rate Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Heart size={16} color="#EF4444" style={styles.fieldIcon} />
                    <Text style={styles.labelText}>Heart Rate</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="e.g. 72"
                      value={heartRate}
                      onChangeText={setHeartRate}
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.inputUnit}>BPM</Text>
                  </View>
                </View>

                {/* Blood Pressure Fields */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Activity size={16} color="#3B82F6" style={styles.fieldIcon} />
                    <Text style={styles.labelText}>Blood Pressure</Text>
                  </View>
                  <View style={styles.bpRow}>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="Systolic (e.g. 120)"
                        value={systolic}
                        onChangeText={setSystolic}
                        placeholderTextColor="#94A3B8"
                      />
                      <Text style={styles.inputUnit}>mmHg</Text>
                    </View>
                    <Text style={styles.bpSeparator}>/</Text>
                    <View style={[styles.inputWrapper, { flex: 1 }]}>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="numeric"
                        placeholder="Diastolic (e.g. 80)"
                        value={diastolic}
                        onChangeText={setDiastolic}
                        placeholderTextColor="#94A3B8"
                      />
                      <Text style={styles.inputUnit}>mmHg</Text>
                    </View>
                  </View>
                </View>

                {/* Weight Field */}
                <View style={styles.inputContainer}>
                  <View style={styles.labelRow}>
                    <Weight size={16} color="#8B5CF6" style={styles.fieldIcon} />
                    <Text style={styles.labelText}>Weight</Text>
                  </View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="e.g. 70.5"
                      value={weight}
                      onChangeText={setWeight}
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.inputUnit}>KG</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelBtn]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveBtn]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.saveText}>Save Vitals</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  keyboardView: {
    width: '100%',
    maxWidth: 340,
    zIndex: 1,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  fieldIcon: {
    marginRight: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
    padding: 0,
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 8,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpSeparator: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '300',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2FA561',
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
