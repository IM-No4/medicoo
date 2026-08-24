import DateTimePicker from '@react-native-community/datetimepicker';
import { Minus, Plus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RenderMedicationIcon } from '../config/shapes';
import { styles } from '../styles';

interface ScheduleStepProps {
  data: any;
  onChange: (data: any) => void;
}

type ScheduleType = 'Every Day' | 'On a Cyclical Schedule' | 'On Specific Days of the Week' | 'Every Few Days' | 'As Needed';
type IntervalType = 'Day' | 'Week';

export default function ScheduleStep({ data, onChange }: ScheduleStepProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'time' | 'date'>('time');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dateField, setDateField] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);
  const [showCycleDaysPicker, setShowCycleDaysPicker] = useState(false);
  const [cycleEditType, setCycleEditType] = useState<'on' | 'off'>('on');

  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;

  // Initialize default values
  const scheduleType: ScheduleType = data.scheduleType || 'Every Day';
  const selectedDays = data.selectedDays || [];
  const intervalValue = data.intervalValue || 1;
  const intervalType: IntervalType = data.intervalType || 'Day';
  const cycleDaysOn = data.cycleDaysOn || 21;
  const cycleDaysOff = data.cycleDaysOff || 7;

  const closeWithAnimation = (callback: () => void) => {
    Animated.timing(translateY, {
      toValue: 1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      callback();
      translateY.setValue(0);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeWithAnimation(() => {
            setShowScheduleModal(false);
            setShowPicker(false);
            setShowIntervalPicker(false);
            setShowCycleDaysPicker(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const scheduleOptions = [
    {
      type: 'Every Day' as ScheduleType,
      description: 'Take dose at the same time'
    },
    {
      type: 'On a Cyclical Schedule' as ScheduleType,
      description: 'Take every day for 21 days and pause for 7 days'
    },
    {
      type: 'On Specific Days of the Week' as ScheduleType,
      description: 'On Mondays, On Weekdays'
    },
    {
      type: 'Every Few Days' as ScheduleType,
      description: 'Every other day, Every 3 days'
    },
    {
      type: 'As Needed' as ScheduleType,
      description: ''
    },
  ];

  const dayAbbreviations = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addTime = () => {
    const newTimes = [...(data.times || []), new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })];
    onChange({ ...data, times: newTimes });
  };

  const removeTime = (index: number) => {
    const updated = data.times.filter((_: string, i: number) => i !== index);
    onChange({ ...data, times: updated });
  };

  const toggleDay = (dayIndex: number) => {
    const newSelectedDays = [...selectedDays];
    const index = newSelectedDays.indexOf(dayIndex);
    if (index > -1) {
      newSelectedDays.splice(index, 1);
    } else {
      newSelectedDays.push(dayIndex);
    }
    onChange({ ...data, selectedDays: newSelectedDays.sort() });
  };

  const openTimePicker = (index: number) => {
    setEditingIndex(index);
    setPickerMode('time');
    setDateField(null);
    setTempDate(getPickerValue());
    setShowPicker(true);
  };

  const openDatePicker = (field: 'start' | 'end') => {
    setDateField(field);
    setPickerMode('date');
    setEditingIndex(null);
    setTempDate(getPickerValue());
    setShowPicker(true);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !selectedDate) return;
      applyPickerChange(selectedDate);
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const applyPickerChange = (selectedDate: Date) => {
    if (pickerMode === 'time' && editingIndex !== null) {
      const formattedTime = selectedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const updatedTimes = [...data.times];
      updatedTimes[editingIndex] = formattedTime;
      onChange({ ...data, times: updatedTimes });
    } else if (pickerMode === 'date' && dateField) {
      if (dateField === 'start') {
        onChange({ ...data, startDate: selectedDate });
      } else {
        onChange({ ...data, endDate: selectedDate });
      }
    }
  };

  const onIosDone = () => {
    applyPickerChange(tempDate);
    setShowPicker(false);
  };

  const onIosCancel = () => {
    setShowPicker(false);
  };

  const getPickerValue = () => {
    if (pickerMode === 'time' && editingIndex !== null && data.times[editingIndex]) {
      const d = new Date();
      const [time, period] = data.times[editingIndex].split(' ');
      if (!time || !period) return new Date();
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes);
      return d;
    }
    if (pickerMode === 'date') {
      if (dateField === 'start') return data.startDate ? new Date(data.startDate) : new Date();
      if (dateField === 'end') return data.endDate ? new Date(data.endDate) : new Date();
    }
    return new Date();
  };

  const formatDate = (date: any) => {
    if (!date) return 'None';
    return new Date(date).toLocaleDateString();
  };

  const getScheduleDisplayText = () => {
    switch (scheduleType) {
      case 'Every Day':
        return 'Every Day';
      case 'On a Cyclical Schedule':
        return 'On a Cyclical Schedule';
      case 'On Specific Days of the Week':
        return 'On Specific Days of the Week';
      case 'Every Few Days':
        return 'Every Few Days';
      case 'As Needed':
        return 'As Needed';
      default:
        return 'Every Day';
    }
  };

  const getIntervalDisplayText = () => {
    if (scheduleType === 'Every Few Days') {
      if (intervalValue === 1) {
        return intervalType === 'Day' ? 'Every Day' : 'Every Week';
      }
      return `Every ${intervalValue} ${intervalType}${intervalValue > 1 ? 's' : ''}`;
    }
    return intervalType;
  };

  const renderScheduleModal = () => {
    if (!showScheduleModal) return null;

    return (
      <Modal
        transparent
        animationType="slide"
        visible={showScheduleModal}
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: '80%',
              transform: [{ translateY }]
            }}
          >
            <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
              <View style={{ width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 }}>
              <Text style={{ color: '#111827', fontSize: 20, fontWeight: '700' }}>When will you take this?</Text>
              <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                <Text style={{ color: '#0FBBA1', fontSize: 17, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Schedule Options
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              {scheduleOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: index < scheduleOptions.length - 1 ? 1 : 0,
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: scheduleType === option.type ? '#ECFDF5' : '#FFFFFF',
                  }}
                  onPress={() => {
                    onChange({ ...data, scheduleType: option.type });
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, color: '#1F2937', fontWeight: scheduleType === option.type ? '600' : '400' }}>
                        {option.type}
                      </Text>
                      {option.description && (
                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                          {option.description}
                        </Text>
                      )}
                    </View>
                    {scheduleType === option.type && (
                      <Text style={{ fontSize: 20, color: '#0FBBA1', fontWeight: '600', marginLeft: 12 }}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderIntervalPicker = () => {
    if (!showIntervalPicker) return null;

    const intervals = Array.from({ length: 30 }, (_, i) => i + 1);

    return (
      <Modal
        transparent
        animationType="slide"
        visible={showIntervalPicker}
        onRequestClose={() => setShowIntervalPicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: '50%',
              transform: [{ translateY }]
            }}
          >
            <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
              <View style={{ width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View style={{ width: 60 }} />
              <Text style={{ color: '#111827', fontSize: 17, fontWeight: '600' }}>Interval</Text>
              <TouchableOpacity onPress={() => setShowIntervalPicker(false)}>
                <Text style={{ color: '#0FBBA1', fontSize: 17, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 }}>
              <View style={{
                flexDirection: 'row',
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                padding: 2,
              }}>
                {(['Day', 'Week'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => onChange({ ...data, intervalType: type })}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 24,
                      borderRadius: 6,
                      backgroundColor: intervalType === type ? '#FFFFFF' : 'transparent',
                      shadowColor: intervalType === type ? '#000' : 'transparent',
                      shadowOpacity: intervalType === type ? 0.1 : 0,
                      shadowRadius: 2,
                      elevation: intervalType === type ? 2 : 0,
                    }}
                  >
                    <Text style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: intervalType === type ? '#111827' : '#6B7280'
                    }}>
                      {type}s
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {intervals.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: intervalValue === num ? '#ECFDF5' : '#FFFFFF',
                  }}
                  onPress={() => {
                    onChange({ ...data, intervalValue: num });
                    setShowIntervalPicker(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 17, color: '#1F2937', fontWeight: intervalValue === num ? '600' : '400' }}>
                      {num} {intervalType}{num > 1 ? 's' : ''}
                    </Text>
                    {intervalValue === num && (
                      <Text style={{ fontSize: 20, color: '#0FBBA1', fontWeight: '600' }}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderCycleDaysPicker = () => {
    if (!showCycleDaysPicker) return null;

    const days = Array.from({ length: 60 }, (_, i) => i + 1);
    const currentValue = cycleEditType === 'on' ? cycleDaysOn : cycleDaysOff;

    return (
      <Modal
        transparent
        animationType="slide"
        visible={showCycleDaysPicker}
        onRequestClose={() => setShowCycleDaysPicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <Animated.View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Math.max(insets.bottom, 20),
              maxHeight: '50%',
              transform: [{ translateY }]
            }}
          >
            <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
              <View style={{ width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View style={{ width: 60 }} />
              <Text style={{ color: '#111827', fontSize: 17, fontWeight: '600' }}>
                {cycleEditType === 'on' ? 'Days On' : 'Days Off'}
              </Text>
              <TouchableOpacity onPress={() => setShowCycleDaysPicker(false)}>
                <Text style={{ color: '#0FBBA1', fontSize: 17, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 300 }}>
              {days.map((num) => (
                <TouchableOpacity
                  key={num}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                    backgroundColor: currentValue === num ? '#ECFDF5' : '#FFFFFF',
                  }}
                  onPress={() => {
                    if (cycleEditType === 'on') {
                      onChange({ ...data, cycleDaysOn: num });
                    } else {
                      onChange({ ...data, cycleDaysOff: num });
                    }
                    setShowCycleDaysPicker(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 17, color: '#1F2937', fontWeight: currentValue === num ? '600' : '400' }}>
                      {num} {num === 1 ? 'Day' : 'Days'}
                    </Text>
                    {currentValue === num && (
                      <Text style={{ fontSize: 20, color: '#0FBBA1', fontWeight: '600' }}>✓</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  const renderPicker = () => {
    if (!showPicker) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent
          animationType="slide"
          visible={showPicker}
          onRequestClose={onIosCancel}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <Animated.View
              style={{
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                paddingBottom: Math.max(insets.bottom, 20),
                transform: [{ translateY }]
              }}
            >
              <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 16 }}>
                <View style={{ width: 40, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3 }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <TouchableOpacity onPress={onIosCancel}>
                  <Text style={{ color: '#6B7280', fontSize: 17, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#111827', fontSize: 17, fontWeight: '600' }}>
                  {pickerMode === 'time' ? 'Select Time' : dateField === 'start' ? 'Start Date' : 'End Date'}
                </Text>
                <TouchableOpacity onPress={onIosDone}>
                  <Text style={{ color: '#0FBBA1', fontSize: 17, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={pickerMode}
                display="spinner"
                onChange={onPickerChange}
                textColor="#111827"
                style={{ backgroundColor: '#FFFFFF' }}
              />
            </Animated.View>
          </View>
        </Modal>
      );
    }

    return (
      <DateTimePicker
        value={getPickerValue()}
        mode={pickerMode}
        display="default"
        onChange={onPickerChange}
      />
    );
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconHeader}>
        <View style={[styles.iconCircle, { backgroundColor: data.color || '#00C3FF' }]}>
          <RenderMedicationIcon
            shapeKey={data.shape}
            leftColor={data.leftColor}
            rightColor={data.rightColor}
            size={1.5}
          />
        </View>
      </View>

      <Text style={styles.stepTitle}>Set a Schedule</Text>

      <Text style={styles.sectionLabel}>When will you take this?</Text>
      <View style={styles.listGroup}>
        <View style={styles.simpleRow}>
          <Text style={styles.simpleRowText}>{getScheduleDisplayText()}</Text>
          <TouchableOpacity onPress={() => setShowScheduleModal(true)}>
            <Text style={styles.linkText}>Change</Text>
          </TouchableOpacity>
        </View>

        {scheduleType === 'Every Few Days' && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity
              style={styles.simpleRow}
              onPress={() => setShowIntervalPicker(true)}
            >
              <Text style={styles.simpleRowText}>Interval</Text>
              <Text style={[styles.linkText, { fontWeight: '400' }]}>
                {getIntervalDisplayText()} ⌃
              </Text>
            </TouchableOpacity>
          </>
        )}

        {scheduleType === 'On a Cyclical Schedule' && (
          <>
            <View style={styles.separator} />
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>What is the cycle?</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 15, color: '#1F2937' }}>Take every day for</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCycleEditType('on');
                    setShowCycleDaysPicker(true);
                  }}
                  style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB'
                  }}
                >
                  <Text style={{ fontSize: 15, color: '#0FBBA1', fontWeight: '600' }}>
                    {cycleDaysOn} days
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ fontSize: 15, color: '#1F2937' }}>and pause for</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCycleEditType('off');
                    setShowCycleDaysPicker(true);
                  }}
                  style={{
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#E5E7EB'
                  }}
                >
                  <Text style={{ fontSize: 15, color: '#0FBBA1', fontWeight: '600' }}>
                    {cycleDaysOff} days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </View>

      {scheduleType === 'On Specific Days of the Week' && (
        <>
          <Text style={styles.sectionLabel}>On these days:</Text>
          <View style={styles.listGroup}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 8 }}>
              {dayAbbreviations.map((day, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleDay(index)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: selectedDays.includes(index) ? '#0FBBA1' : '#F3F4F6',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: selectedDays.includes(index) ? '#FFFFFF' : '#6B7280',
                  }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {scheduleType !== 'As Needed' && (
        <>
          <Text style={styles.sectionLabel}>At what time?</Text>
          <View style={styles.listGroup}>
            {(data.times || []).map((time: string, index: number) => (
              <View key={index}>
                <View style={styles.timeInputRow}>
                  <TouchableOpacity onPress={() => removeTime(index)} style={styles.iconCircleSmall}>
                    <View style={{ backgroundColor: '#FF453A', borderRadius: 12, padding: 4 }}>
                      <Minus size={16} color="#FFF" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => openTimePicker(index)} style={styles.timePill}>
                    <Text style={styles.timePillText}>{time}</Text>
                  </TouchableOpacity>

                  <Text style={styles.dosageText}>1 {data.shape === 'capsule' ? 'capsule' : 'tablet'}</Text>
                </View>
                {index < data.times.length - 1 && <View style={styles.separator} />}
              </View>
            ))}

            <View style={styles.separator} />
            <TouchableOpacity style={styles.simpleRow} onPress={addTime}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: '#30D158', borderRadius: 12, padding: 4 }}>
                  <Plus size={16} color="#FFF" strokeWidth={3} />
                </View>
                <Text style={styles.simpleRowText}>Add a Time</Text>
              </View>
            </TouchableOpacity>
          </View>

        </>
      )}

      <Text style={styles.helperText}>
        {scheduleType === 'As Needed'
          ? 'Log each dose when you take it.'
          : 'If you schedule a time, Health will send you a notification to take your medications.'}
      </Text>

      <Text style={styles.sectionLabel}>Duration</Text>
      <View style={styles.listGroup}>
        <View style={styles.durationRow}>
          <TouchableOpacity style={styles.durationCol} onPress={() => openDatePicker('start')}>
            <Text style={styles.durationLabel}>Start Date</Text>
            <Text style={styles.durationValue}>{formatDate(data.startDate)}</Text>
          </TouchableOpacity>

          <View style={{ width: 1, backgroundColor: '#E5E7EB', marginHorizontal: 16 }} />

          <TouchableOpacity style={styles.durationCol} onPress={() => openDatePicker('end')}>
            <Text style={styles.durationLabel}>End Date</Text>
            <Text style={styles.durationValue}>{formatDate(data.endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderPicker()}
      {renderScheduleModal()}
      {renderIntervalPicker()}
      {renderCycleDaysPicker()}

      <View style={{ height: 100 }} />
    </View>
  );
}