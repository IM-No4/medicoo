import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/icons/AppIcon';

import { executeAction } from '@/src/actions/ActionExecutor';
import { DoctorStackParamList } from '@/src/navigation/DoctorStack';
import { API_BASE_URL } from '../../services/api/client';
import { formatDoctorName } from '../../utils/formatters';

export default function BookAppointmentScreen() {
  // ... (NavProp type defs remain, just ensuring consistent imports)
  type RouteProps = RouteProp<
    DoctorStackParamList,
    'BookAppointment'
  >;

  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const { doctor } = route.params || {};

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if we are in "Request" mode based on availability
  const isRequestMode = doctor?.nextSlot === 'Not Available';

  // Generate next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      fullDate: d.toISOString().split('T')[0],
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    setLoading(true);
    // Simulate loading or fetch real slots
    // If RequestMode, we might not fetch slots, or fetch and find none
    setTimeout(() => {
      try {
        // Mock empty if request mode, or mock data
        // For now, if request mode, leave empty to show request UI
        if (isRequestMode) {
          setSlots({ morning: [], afternoon: [], evening: [] });
        } else {
          const result = {
            morning: ['09:00 AM', '10:00 AM', '11:30 AM'],
            afternoon: ['02:00 PM', '03:15 PM'],
            evening: ['06:00 PM', '07:30 PM'],
          };
          setSlots(result);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleConfirm = () => {
    if (!selectedSlot && !isRequestMode) return;
    executeAction('OPEN_BOOKING_SUCCESS', {
      date: dates[selectedDate].fullDate,
      slot: selectedSlot,
      isRequest: isRequestMode
    });
  };

  if (!doctor) return null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.iconButton}>
          <AppIcon name="arrow-left" size={24} color="#1c1c1e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isRequestMode ? 'Request Appointment' : 'Select Time'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Doctor Summary */}
        <View style={styles.doctorSummary}>
          <View style={styles.imageContainer}>
            {doctor.image || doctor.uniformPhoto ? (
              <Image
                source={{
                  uri: (doctor.image || doctor.uniformPhoto).startsWith('http')
                    ? (doctor.image || doctor.uniformPhoto)
                    : `${API_BASE_URL}/${doctor.image || doctor.uniformPhoto}`
                }}
                style={styles.doctorImage}
              />
            ) : (
              <Text style={{ fontSize: 24 }}>👨‍⚕️</Text>
            )}
            <View style={styles.verifiedBadge}>
              <AppIcon name="check" size={10} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>{formatDoctorName(doctor.name)}</Text>
            <Text style={styles.docSpecialty}>{doctor.specialty || doctor.specialization}</Text>
            <View style={styles.miniLocation}>
              <AppIcon name="map-pin" size={10} color="#8e8e93" />
              <Text style={styles.docLocation}>{doctor.location || doctor.hospital}</Text>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRequestMode ? 'Preferred Date' : 'Select Date'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
            {dates.map((item, index) => {
              const isSelected = selectedDate === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                  onPress={() => {
                    setSelectedDate(index);
                    setSelectedSlot(null);
                  }}
                >
                  <Text style={[styles.dayText, isSelected && styles.textSelected]}>{item.day}</Text>
                  <Text style={[styles.dateText, isSelected && styles.textSelected]}>{item.date}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Slots or Request UI */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRequestMode ? 'Preferred Time' : 'Available Slots'}</Text>

          {loading ? (
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#1C6ED5" />
            </View>
          ) : isRequestMode ? (
            <View style={styles.requestContainer}>
              <Text style={styles.requestInfo}>
                Doctor is currently unavailable for online booking. You can send a request for an appointment on {dates[selectedDate].day}, {dates[selectedDate].date} {dates[selectedDate].month}.
              </Text>
              <View style={styles.preferenceButtons}>
                {['Morning', 'Afternoon', 'Evening'].map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.prefChip, selectedSlot === time && styles.prefChipSelected]}
                    onPress={() => setSelectedSlot(time)}
                  >
                    <Text style={[styles.prefText, selectedSlot === time && styles.prefTextSelected]}>{time}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <>
              {(!slots?.morning?.length && !slots?.afternoon?.length && !slots?.evening?.length) ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No slots available for this date.</Text>
                </View>
              ) : (
                <>
                  {/* Morning */}
                  {slots?.morning?.length > 0 && <Text style={styles.slotHeader}>Morning</Text>}
                  <View style={styles.slotGrid}>
                    {slots?.morning.map((time: string) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.slotChip, selectedSlot === time && styles.slotChipSelected]}
                        onPress={() => setSelectedSlot(time)}
                      >
                        <Text style={[styles.slotText, selectedSlot === time && styles.slotTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Afternoon */}
                  {slots?.afternoon?.length > 0 && <Text style={styles.slotHeader}>Afternoon</Text>}
                  <View style={styles.slotGrid}>
                    {slots?.afternoon.map((time: string) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.slotChip, selectedSlot === time && styles.slotChipSelected]}
                        onPress={() => setSelectedSlot(time)}
                      >
                        <Text style={[styles.slotText, selectedSlot === time && styles.slotTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Evening */}
                  {slots?.evening?.length > 0 && <Text style={styles.slotHeader}>Evening</Text>}
                  <View style={styles.slotGrid}>
                    {slots?.evening.map((time: string) => (
                      <TouchableOpacity
                        key={time}
                        style={[styles.slotChip, selectedSlot === time && styles.slotChipSelected]}
                        onPress={() => setSelectedSlot(time)}
                      >
                        <Text style={[styles.slotText, selectedSlot === time && styles.slotTextSelected]}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedSlot && styles.disabledButton]}
          disabled={!selectedSlot}
          onPress={handleConfirm}
        >
          <Text style={styles.confirmButtonText}>
            {isRequestMode ? 'Send Request' : 'Confirm Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  iconButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1c1c1e' },
  scrollContent: { paddingBottom: 140 },
  doctorSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  imageContainer: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#F2F2F7',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
    position: 'relative'
  },
  doctorImage: { width: '100%', height: '100%', borderRadius: 30 },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0FBBA1',
    borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff'
  },
  docName: { fontSize: 17, fontWeight: '700', color: '#1c1c1e', marginBottom: 2 },
  docSpecialty: { fontSize: 14, color: '#8e8e93', marginBottom: 4 },
  miniLocation: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docLocation: { fontSize: 13, color: '#8e8e93' },
  section: { padding: 20, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1c1c1e', marginBottom: 16 },
  dateCard: {
    width: 64, height: 76, borderRadius: 16, borderWidth: 1, borderColor: '#E5E5EA',
    justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#fff',
  },
  dateCardSelected: { backgroundColor: '#0FBBA1', borderColor: '#0FBBA1' },
  dayText: { fontSize: 12, color: '#8e8e93', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateText: { fontSize: 18, fontWeight: '700', color: '#1c1c1e' },
  textSelected: { color: '#fff' },
  slotHeader: { fontSize: 14, fontWeight: '600', color: '#8e8e93', marginTop: 16, marginBottom: 12 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  slotChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA',
    marginRight: 10, marginBottom: 10, backgroundColor: '#fff',
  },
  slotChipSelected: { backgroundColor: '#0FBBA1', borderColor: '#0FBBA1' },
  slotText: { fontSize: 14, color: '#1c1c1e' },
  slotTextSelected: { color: '#fff', fontWeight: '600' },

  // Request Mode Styles
  requestContainer: {
    backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F2F2F7'
  },
  requestInfo: { fontSize: 14, color: '#3A3A3C', lineHeight: 20, marginBottom: 16 },
  preferenceButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#E5E5EA'
  },
  prefChipSelected: { backgroundColor: '#0FBBA1', borderColor: '#0FBBA1' },
  prefText: { fontSize: 14, color: '#3A3A3C' },
  prefTextSelected: { color: '#fff', fontWeight: '600' },

  // Empty State
  emptyState: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#8e8e93' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff',
    padding: 20, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E5EA',
  },
  confirmButton: {
    backgroundColor: '#0FBBA1', borderRadius: 24, paddingVertical: 16, alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#A0A0A0' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  loadingContainer: {
    height: 200, justifyContent: 'center', alignItems: 'center'
  },
});