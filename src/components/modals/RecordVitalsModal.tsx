import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { Activity, Check, Heart, Minus, Plus, Thermometer, Weight, X } from 'lucide-react-native';
import { addVitalRecord } from '../../redux/slices/vitalsSlice';
import { AppDispatch } from '../../redux/store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type FieldErrors = {
  heartRate?: string;
  bp?: string;
  weight?: string;
  temperature?: string;
};

// Weight slider spans the range real users actually fall in - values
// outside this (rare) can still be typed directly into the number, which
// stays editable. The full 2-500kg backend/validation range is for the
// text entry path, not the slider's draggable span.
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 150;
const WEIGHT_STEP = 0.1;
const WEIGHT_DEFAULT = 65;

const HR_DEFAULT = 72;
const SYSTOLIC_DEFAULT = 120;
const DIASTOLIC_DEFAULT = 80;

const TEMP_MIN = 90;
const TEMP_MAX = 110;
const TEMP_DEFAULT = 98.6;

export default function RecordVitalsModal({ visible, onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();

  // "touched" tracks whether the user has actually interacted with a field -
  // sliders/steppers always show *some* number, so an untouched field can't
  // be told apart from a real 0/default value any other way. Untouched
  // fields are excluded from the saved record, same as leaving a text input
  // blank used to mean.
  const [hrTouched, setHrTouched] = useState(false);
  const [hrVal, setHrVal] = useState(HR_DEFAULT);

  const [bpTouched, setBpTouched] = useState(false);
  const [systolicVal, setSystolicVal] = useState(SYSTOLIC_DEFAULT);
  const [diastolicVal, setDiastolicVal] = useState(DIASTOLIC_DEFAULT);

  const [tempTouched, setTempTouched] = useState(false);
  const [tempVal, setTempVal] = useState(TEMP_DEFAULT);

  const [weightTouched, setWeightTouched] = useState(false);
  const [weightVal, setWeightVal] = useState(WEIGHT_DEFAULT);
  // Bumped only when weight is set from OUTSIDE the ruler (typing, Clear,
  // form reset) - tells WeightRuler "please jump to match", as opposed to
  // every weightVal change, which also happens as the ruler reports its own
  // drag position back up. Driving the resync off value-equality instead of
  // this explicit signal was fragile: float round-trips through px<->kg
  // conversion don't always come back bit-identical, so the ruler kept
  // treating its own echoed value as "external" and jumping to it again.
  const [weightSyncToken, setWeightSyncToken] = useState(0);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const resetForm = () => {
    setHrTouched(false);
    setHrVal(HR_DEFAULT);
    setBpTouched(false);
    setSystolicVal(SYSTOLIC_DEFAULT);
    setDiastolicVal(DIASTOLIC_DEFAULT);
    setTempTouched(false);
    setTempVal(TEMP_DEFAULT);
    setWeightTouched(false);
    setWeightVal(WEIGHT_DEFAULT);
    setWeightSyncToken(t => t + 1);
    setFieldErrors({});
    setFormError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    setFormError('');

    const heartRate = hrTouched ? hrVal : undefined;
    const systolic = bpTouched ? systolicVal : undefined;
    const diastolic = bpTouched ? diastolicVal : undefined;
    const weight = weightTouched ? weightVal : undefined;
    const temperature = tempTouched ? tempVal : undefined;

    if (!heartRate && !systolic && !diastolic && !weight && !temperature) {
      setFormError('Log at least one vital before saving.');
      return;
    }

    const errors: FieldErrors = {};
    if (heartRate !== undefined && (heartRate < 30 || heartRate > 250)) {
      errors.heartRate = 'Enter a value between 30-250 bpm';
    }
    if ((systolic !== undefined) && (systolic < 50 || systolic > 250 || (diastolic ?? 0) < 30 || (diastolic ?? 0) > 150)) {
      errors.bp = 'Systolic 50-250, diastolic 30-150';
    }
    if (weight !== undefined && (weight < 2 || weight > 500)) {
      errors.weight = 'Enter a value between 2-500 kg';
    }
    if (temperature !== undefined && (temperature < TEMP_MIN || temperature > TEMP_MAX)) {
      errors.temperature = `Enter a value between ${TEMP_MIN}-${TEMP_MAX}°F`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await dispatch(addVitalRecord({
        timestamp: new Date().toISOString(),
        heartRate,
        systolic,
        diastolic,
        weight,
        temperature,
      })).unwrap();

      resetForm();
      onClose();
    } catch (err: any) {
      setFormError(typeof err === 'string' ? err : 'Failed to save vitals. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const hrStep = (delta: number) => {
    setFieldErrors(prev => ({ ...prev, heartRate: undefined }));
    if (!hrTouched) { setHrTouched(true); return; }
    setHrVal(v => Math.max(30, Math.min(250, v + delta)));
  };

  const bpStep = (which: 'systolic' | 'diastolic', delta: number) => {
    setFieldErrors(prev => ({ ...prev, bp: undefined }));
    if (!bpTouched) { setBpTouched(true); return; }
    if (which === 'systolic') setSystolicVal(v => Math.max(50, Math.min(250, v + delta)));
    else setDiastolicVal(v => Math.max(30, Math.min(150, v + delta)));
  };

  const tempStep = (delta: number) => {
    setFieldErrors(prev => ({ ...prev, temperature: undefined }));
    if (!tempTouched) { setTempTouched(true); return; }
    setTempVal(v => Math.round(Math.max(TEMP_MIN, Math.min(TEMP_MAX, v + delta)) * 10) / 10);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { marginTop: insets.top }]}>
          <View>
            <Text style={styles.headerTitle}>Log Vitals</Text>
            <Text style={styles.headerSubtitle}>Track today's health readings</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} disabled={loading}>
            <X size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {formError ? (
            <View style={styles.formErrorBanner}>
              <Text style={styles.formErrorText}>{formError}</Text>
            </View>
          ) : null}

          {/* Heart Rate Card */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Heart size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Heart Rate</Text>
                <Text style={styles.fieldHint}>
                  {hrTouched ? 'Resting pulse, in beats per minute' : 'Tap + to log a reading'}
                </Text>
              </View>
              {hrTouched && (
                <TouchableOpacity onPress={() => { setHrTouched(false); setHrVal(HR_DEFAULT); }}>
                  <Text style={styles.skipText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.stepperRow, fieldErrors.heartRate && styles.cardError]}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => hrStep(-1)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Minus size={18} color="#EF4444" />
              </TouchableOpacity>

              <View style={styles.stepperCenter}>
                <TextInput
                  style={styles.bigNumber}
                  keyboardType="numeric"
                  placeholder="--"
                  placeholderTextColor="#CBD5E1"
                  value={hrTouched ? String(hrVal) : ''}
                  onChangeText={(v) => {
                    setHrTouched(true);
                    setHrVal(parseInt(v, 10) || 0);
                    setFieldErrors(prev => ({ ...prev, heartRate: undefined }));
                  }}
                  textAlign="center"
                  selectTextOnFocus
                  editable={!loading}
                />
                <Text style={styles.unitLabel}>BPM</Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => hrStep(1)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Plus size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
            {fieldErrors.heartRate && <Text style={styles.fieldErrorText}>{fieldErrors.heartRate}</Text>}
          </View>

          {/* Blood Pressure Card */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Activity size={20} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Blood Pressure</Text>
                <Text style={styles.fieldHint}>
                  {bpTouched ? 'Systolic over diastolic, in mmHg' : 'Tap + to log a reading'}
                </Text>
              </View>
              {bpTouched && (
                <TouchableOpacity onPress={() => { setBpTouched(false); setSystolicVal(SYSTOLIC_DEFAULT); setDiastolicVal(DIASTOLIC_DEFAULT); }}>
                  <Text style={styles.skipText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.bpStepperRow}>
              <View style={[styles.miniStepper, fieldErrors.bp && styles.cardError]}>
                <TouchableOpacity onPress={() => bpStep('systolic', -1)} activeOpacity={0.7} disabled={loading}>
                  <Minus size={15} color="#3B82F6" />
                </TouchableOpacity>
                <View style={styles.miniStepperCenter}>
                  <TextInput
                    style={styles.miniNumberInput}
                    keyboardType="numeric"
                    placeholder={String(SYSTOLIC_DEFAULT)}
                    placeholderTextColor="#CBD5E1"
                    value={bpTouched ? String(systolicVal) : ''}
                    onChangeText={(v) => {
                      setBpTouched(true);
                      setSystolicVal(parseInt(v, 10) || 0);
                      setFieldErrors(prev => ({ ...prev, bp: undefined }));
                    }}
                    selectTextOnFocus
                    editable={!loading}
                  />
                  <Text style={styles.miniLabel}>Systolic</Text>
                </View>
                <TouchableOpacity onPress={() => bpStep('systolic', 1)} activeOpacity={0.7} disabled={loading}>
                  <Plus size={15} color="#3B82F6" />
                </TouchableOpacity>
              </View>

              <Text style={styles.bpSeparator}>/</Text>

              <View style={[styles.miniStepper, fieldErrors.bp && styles.cardError]}>
                <TouchableOpacity onPress={() => bpStep('diastolic', -1)} activeOpacity={0.7} disabled={loading}>
                  <Minus size={15} color="#3B82F6" />
                </TouchableOpacity>
                <View style={styles.miniStepperCenter}>
                  <TextInput
                    style={styles.miniNumberInput}
                    keyboardType="numeric"
                    placeholder={String(DIASTOLIC_DEFAULT)}
                    placeholderTextColor="#CBD5E1"
                    value={bpTouched ? String(diastolicVal) : ''}
                    onChangeText={(v) => {
                      setBpTouched(true);
                      setDiastolicVal(parseInt(v, 10) || 0);
                      setFieldErrors(prev => ({ ...prev, bp: undefined }));
                    }}
                    selectTextOnFocus
                    editable={!loading}
                  />
                  <Text style={styles.miniLabel}>Diastolic</Text>
                </View>
                <TouchableOpacity onPress={() => bpStep('diastolic', 1)} activeOpacity={0.7} disabled={loading}>
                  <Plus size={15} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
            {fieldErrors.bp && <Text style={styles.fieldErrorText}>{fieldErrors.bp}</Text>}
          </View>

          {/* Temperature Card */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#F0F9FF' }]}>
                <Thermometer size={20} color="#0EA5E9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Temperature</Text>
                <Text style={styles.fieldHint}>
                  {tempTouched ? 'Body temperature, in °F' : 'Tap + to log a reading'}
                </Text>
              </View>
              {tempTouched && (
                <TouchableOpacity onPress={() => { setTempTouched(false); setTempVal(TEMP_DEFAULT); }}>
                  <Text style={styles.skipText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={[styles.stepperRow, fieldErrors.temperature && styles.cardError]}>
              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: '#E0F2FE' }]}
                onPress={() => tempStep(-0.1)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Minus size={18} color="#0EA5E9" />
              </TouchableOpacity>

              <View style={styles.stepperCenter}>
                <TextInput
                  style={styles.bigNumber}
                  keyboardType="decimal-pad"
                  placeholder="--"
                  placeholderTextColor="#CBD5E1"
                  value={tempTouched ? tempVal.toFixed(1) : ''}
                  onChangeText={(v) => {
                    setTempTouched(true);
                    setTempVal(parseFloat(v) || 0);
                    setFieldErrors(prev => ({ ...prev, temperature: undefined }));
                  }}
                  textAlign="center"
                  selectTextOnFocus
                  editable={!loading}
                />
                <Text style={styles.unitLabel}>°F</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperBtn, { backgroundColor: '#E0F2FE' }]}
                onPress={() => tempStep(0.1)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Plus size={18} color="#0EA5E9" />
              </TouchableOpacity>
            </View>
            {fieldErrors.temperature && <Text style={styles.fieldErrorText}>{fieldErrors.temperature}</Text>}
          </View>

          {/* Weight Card */}
          <View style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <View style={[styles.fieldIconBox, { backgroundColor: '#F5F3FF' }]}>
                <Weight size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Weight</Text>
                <Text style={styles.fieldHint}>
                  Type an exact value or drag the ruler below
                </Text>
              </View>
              {weightTouched && (
                <TouchableOpacity onPress={() => { setWeightTouched(false); setWeightVal(WEIGHT_DEFAULT); setWeightSyncToken(t => t + 1); }}>
                  <Text style={styles.skipText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.weightReadoutRow}>
              <TextInput
                style={styles.weightNumber}
                keyboardType="numeric"
                placeholder="--"
                placeholderTextColor="#CBD5E1"
                value={weightTouched ? String(weightVal) : ''}
                onChangeText={(v) => {
                  setWeightTouched(true);
                  setWeightVal(parseFloat(v) || 0);
                  setWeightSyncToken(t => t + 1);
                  setFieldErrors(prev => ({ ...prev, weight: undefined }));
                }}
                selectTextOnFocus
                editable={!loading}
              />
              <Text style={styles.unitLabel}>KG</Text>
            </View>

            <WeightRuler
              value={weightTouched ? weightVal : WEIGHT_DEFAULT}
              syncToken={weightSyncToken}
              min={WEIGHT_MIN}
              max={WEIGHT_MAX}
              step={WEIGHT_STEP}
              active={weightTouched}
              disabled={loading}
              onChange={(v) => {
                setWeightTouched(true);
                setWeightVal(v);
                setFieldErrors(prev => ({ ...prev, weight: undefined }));
              }}
            />
            {fieldErrors.weight && <Text style={styles.fieldErrorText}>{fieldErrors.weight}</Text>}
          </View>
        </ScrollView>

        {/* Footer */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveText}>Save Vitals</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

interface WeightRulerProps {
  value: number;
  // Bumped by the parent only when it wants the ruler to jump to `value`
  // (typing, Clear, reset) - NOT a dependency on `value` itself. Driving
  // this off value-equality instead was fragile: the ruler's own onChange
  // output flows back in as the next `value` prop, and float round-trips
  // through the px<->kg conversion don't always come back bit-identical,
  // so it kept mistaking its own echo for an external change and jumping
  // to it again mid-drag - a self-sustaining "won't stop moving" loop.
  syncToken: number;
  min: number;
  max: number;
  step: number;
  active: boolean;
  disabled: boolean;
  onChange: (value: number) => void;
}

// Pixels per 1kg - drives the ruler's visual spacing and the
// offset-to-value conversion. Minor ticks (spaced by the `step` prop, 0.1kg)
// sit at a fraction of this.
const TICK_GAP = 80;
const TICK_LABEL_WIDTH = 34;

// Fully custom drag surface instead of a ScrollView. Every earlier bug here
// (values not matching the pointer, the ruler oscillating mid-drag) traced
// back to ScrollView's native scroll position only being observable in JS
// asynchronously via onScroll, which made a two-way sync with a controlled
// `value` prop inherently racy. Here `offset` (pixels) is the ONE piece of
// state driving both rendering and the reported value - there is no second,
// native copy of the position that can drift out of step with it.
function WeightRuler({ value, syncToken, min, max, step, active, disabled, onChange }: WeightRulerProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  // Horizontal position lives in a plain Animated.Value, not React state.
  // The previous useState(offset) meant every touch-move event ran a full
  // WeightRuler re-render + style diff just to move one strip - that render
  // overhead, not the gesture handling itself, was the source of the drag
  // lag. Animated.setValue() below moves the native view directly, with no
  // React render involved at all.
  const offsetAnim = useRef(new Animated.Value((value - min) * TICK_GAP)).current;
  const offsetRef = useRef((value - min) * TICK_GAP);

  // Refs so the PanResponder (created once via useRef below) always reads
  // the latest values instead of whatever was current when it was built.
  const minRef = useRef(min);
  const maxRef = useRef(max);
  const stepRef = useRef(step);
  const onChangeRef = useRef(onChange);
  const disabledRef = useRef(disabled);
  minRef.current = min;
  maxRef.current = max;
  stepRef.current = step;
  onChangeRef.current = onChange;
  disabledRef.current = disabled;

  const dragStartOffset = useRef(0);
  // Last value actually reported to the parent. onPanResponderMove can fire
  // far more often than the visible number changes (many touch-move events
  // land within the same 0.1kg tick); re-notifying the parent on every one
  // of them forces a full modal re-render per event and was the source of
  // the drag lag - only call onChange when the rounded value truly changes.
  const lastReportedValueRef = useRef(value);

  // Ticks every `step` kg (0.1 by default): whole numbers get a big labeled
  // line, the 9 in-between positions get small unlabeled ones - a real
  // ruler's cm/mm pattern.
  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step);
    const arr: number[] = [];
    for (let i = 0; i <= count; i++) arr.push(Math.round((min + i * step) * 10) / 10);
    return arr;
  }, [min, max, step]);

  // Tick marks are rendered once here and reused across renders (same
  // element references) so that dragging - which only changes `offset`,
  // i.e. the wrapping strip's `left` - doesn't force React to re-diff
  // hundreds of individual tick views on every frame.
  const renderedTicks = useMemo(() => {
    const stepPx = TICK_GAP * step;
    return ticks.map((t, i) => {
      const isWhole = Number.isInteger(t);
      const x = i * stepPx;
      return (
        <View key={t} style={[styles.tickColumn, { left: x - TICK_LABEL_WIDTH / 2 }]}>
          <View style={styles.tickLineZone}>
            <View style={[styles.tickMark, isWhole ? styles.tickMajor : styles.tickMinor, !active && styles.tickInactive]} />
          </View>
          <View style={styles.tickLabelZone}>
            {isWhole && <Text style={styles.tickLabelMajor}>{t}</Text>}
          </View>
        </View>
      );
    });
  }, [ticks, step, active]);

  // Bumped by the parent only when it wants the ruler to jump to `value`
  // (typing, Clear, reset) - see the syncToken prop comment above for why
  // `value` itself must not be a dependency here.
  useEffect(() => {
    const next = (value - min) * TICK_GAP;
    offsetRef.current = next;
    offsetAnim.setValue(next);
    lastReportedValueRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncToken]);

  const commit = (rawOffset: number, snap: boolean) => {
    const maxOffset = (maxRef.current - minRef.current) * TICK_GAP;
    let next = Math.max(0, Math.min(maxOffset, rawOffset));
    if (snap) {
      const stepPx = TICK_GAP * stepRef.current;
      next = Math.max(0, Math.min(maxOffset, Math.round(next / stepPx) * stepPx));
    }
    // The visible tick strip always tracks the finger 1:1, every move - a
    // direct native prop update via Animated, no React render involved.
    // Only the (React-render-triggering) onChange notification is deduped
    // below.
    offsetRef.current = next;
    offsetAnim.setValue(next);
    const rawValue = minRef.current + next / TICK_GAP;
    const rounded = Math.round(rawValue * 10) / 10;
    if (rounded !== lastReportedValueRef.current) {
      lastReportedValueRef.current = rounded;
      onChangeRef.current(rounded);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      // Claim the touch immediately on press-down. Deferring to
      // onMoveShouldSetPanResponder (to let vertical scrolls pass through)
      // sounds nicer but in practice starved the ruler of the gesture
      // entirely - it never became the responder, so no drag ever started.
      // This is a small, dedicated strip, so grabbing every touch that
      // starts on it is the right trade-off.
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      // Once granted, don't let the outer ScrollView steal it back mid-drag.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        dragStartOffset.current = offsetRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        commit(dragStartOffset.current - gestureState.dx, false);
      },
      onPanResponderRelease: (_, gestureState) => {
        commit(dragStartOffset.current - gestureState.dx, true);
      },
      onPanResponderTerminate: (_, gestureState) => {
        commit(dragStartOffset.current - gestureState.dx, true);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.rulerContainer} onLayout={handleLayout} {...panResponder.panHandlers}>
      {containerWidth > 0 && (
        <View style={styles.rulerClip}>
          <Animated.View
            style={[
              styles.tickStrip,
              { left: containerWidth / 2, transform: [{ translateX: Animated.multiply(offsetAnim, -1) }] },
            ]}
          >
            {renderedTicks}
          </Animated.View>
        </View>
      )}
      <View style={styles.rulerPointer} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  formErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  formErrorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    gap: 14,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  cardError: {
    borderColor: '#FCA5A5',
  },

  /* Heart rate big stepper */
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 10,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCenter: {
    flex: 1,
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    minWidth: 90,
    padding: 0,
    textAlign: 'center',
  },
  unitLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: -2,
  },

  /* Blood pressure mini steppers */
  bpStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniStepper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  miniStepperCenter: {
    alignItems: 'center',
  },
  miniNumberInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
    minWidth: 34,
    textAlign: 'center',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  bpSeparator: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '300',
  },

  /* Weight slider */
  weightReadoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
  },
  weightNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#0F172A',
    padding: 0,
    textAlign: 'center',
    minWidth: 60,
  },
  rulerContainer: {
    height: 58,
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  rulerClip: {
    flex: 1,
    overflow: 'hidden',
  },
  tickStrip: {
    position: 'absolute',
    top: 0,
    height: 58,
  },
  rulerPointer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -1.5,
    top: 0,
    width: 3,
    height: 34,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
  },
  tickColumn: {
    position: 'absolute',
    width: TICK_LABEL_WIDTH,
    alignItems: 'center',
  },
  tickLineZone: {
    height: 34,
    justifyContent: 'flex-end',
  },
  tickLabelZone: {
    height: 18,
    marginTop: 4,
  },
  tickMark: {
    width: 2,
    borderRadius: 1,
    backgroundColor: '#E2E8F0',
  },
  tickMinor: {
    height: 9,
  },
  tickMajor: {
    height: 20,
    backgroundColor: '#CBD5E1',
  },
  tickInactive: {
    backgroundColor: '#F1F5F9',
  },
  tickLabelMajor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  saveBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2FA561',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2FA561',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
