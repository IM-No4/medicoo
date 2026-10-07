import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Activity, Calendar, ChevronLeft, Heart, ShieldOff, Weight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RenderMedicationIcon } from '../../../../components/modals/AddMedicationModal/config/shapes';
import {
  getFamilyMemberAppointments,
  getFamilyMemberMedicines,
  getFamilyMemberVitals,
} from '../../../../services/api';

interface Params {
  memberId: string;
  name: string;
}

// Read-only view of a linked family member's medications, vitals, and
// upcoming appointments - reachable only from FamilyMembersScreen's own
// member list, and only shows anything once the member themselves has
// opted in (permissions.viewMedicalRecords, controlled from their own
// side - see FamilyMembersScreen's "Family Groups You Belong To" section).
export default function FamilyMemberHealthScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { memberId, name } = (route.params || {}) as Params;

  const [loading, setLoading] = useState(true);
  const [notShared, setNotShared] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setNotShared(false);
    try {
      const [medsResult, vitalsResult, apptsResult] = await Promise.allSettled([
        getFamilyMemberMedicines(memberId),
        getFamilyMemberVitals(memberId),
        getFamilyMemberAppointments(memberId),
      ]);

      // Any one of the three coming back NOT_SHARED means the member has
      // turned sharing off - all three are gated by the same permission,
      // so if one says no, they all would.
      const results = [medsResult, vitalsResult, apptsResult];
      const sharingOff = results.some(
        (r) => r.status === 'rejected' && r.reason?.response?.data?.code === 'NOT_SHARED'
      );
      if (sharingOff) {
        setNotShared(true);
        return;
      }

      if (medsResult.status === 'fulfilled') setMedicines(medsResult.value?.data || []);
      if (vitalsResult.status === 'fulfilled') setVitals(vitalsResult.value?.data || []);
      if (apptsResult.status === 'fulfilled') setAppointments(apptsResult.value?.data || []);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const latestByMetric = (metric: 'heartRate' | 'systolic' | 'weight') =>
    vitals.find((v) => v[metric] !== undefined);
  const latestHeartRate = latestByMetric('heartRate');
  const latestBp = latestByMetric('systolic');
  const latestWeight = latestByMetric('weight');

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name || 'Family Member'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0FBBA1" />
        </View>
      ) : notShared ? (
        <View style={styles.center}>
          <View style={styles.notSharedIcon}>
            <ShieldOff size={32} color="#9CA3AF" />
          </View>
          <Text style={styles.notSharedTitle}>Not Shared Yet</Text>
          <Text style={styles.notSharedText}>
            {name || 'This family member'} hasn't shared their health details with you yet.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>VITALS</Text>
          {!latestHeartRate && !latestBp && !latestWeight ? (
            <Text style={styles.emptyText}>No vitals logged yet.</Text>
          ) : (
            <View style={styles.vitalsRow}>
              <VitalCard icon={Heart} color="#EF4444" bg="#FEF2F2" label="Heart Rate" value={latestHeartRate ? `${latestHeartRate.heartRate}` : '-'} unit="bpm" />
              <VitalCard icon={Activity} color="#3B82F6" bg="#EFF6FF" label="Blood Pressure" value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '-'} unit="mmHg" />
              <VitalCard icon={Weight} color="#8B5CF6" bg="#F5F3FF" label="Weight" value={latestWeight ? `${latestWeight.weight}` : '-'} unit="kg" />
            </View>
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>MEDICATIONS</Text>
          {medicines.length === 0 ? (
            <Text style={styles.emptyText}>No medications added.</Text>
          ) : (
            medicines.map((item) => (
              <View key={item._id} style={styles.medCard}>
                <View style={[styles.medIconBox, { backgroundColor: item.color || '#E0F7F4' }]}>
                  <RenderMedicationIcon
                    shapeKey={item.shape || 'tablet'}
                    leftColor={item.leftColor}
                    rightColor={item.rightColor}
                    size={0.8}
                  />
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{item.medicineName}</Text>
                  <Text style={styles.medDosage}>
                    {[item.dosage, item.scheduleType].filter(Boolean).join(' · ')}
                    {item.times?.length ? ` · ${item.times.join(', ')}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>UPCOMING APPOINTMENTS</Text>
          {appointments.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming appointments.</Text>
          ) : (
            appointments.map((appt) => (
              <View key={appt.id} style={styles.apptCard}>
                <View style={styles.apptIconBox}>
                  <Calendar size={18} color="#0FBBA1" />
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{appt.doctorName}</Text>
                  <Text style={styles.medDosage}>
                    {[appt.specialization, appt.date, appt.start].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function VitalCard({ icon: Icon, color, bg, label, value, unit }: any) {
  return (
    <View style={styles.vitalCard}>
      <View style={[styles.vitalIconBox, { backgroundColor: bg }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.vitalValue}>{value}</Text>
        {value !== '-' && <Text style={styles.vitalUnit}>{unit}</Text>}
      </View>
      <Text style={styles.vitalLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', flex: 1, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  notSharedIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  notSharedTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  notSharedText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    color: '#494949',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: '#94A3B8', marginBottom: 4 },
  vitalsRow: { flexDirection: 'row', gap: 10 },
  vitalCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  vitalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' },
  vitalValue: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  vitalUnit: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },
  vitalLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 10,
  },
  medIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: { flex: 1, gap: 3 },
  medName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  medDosage: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  apptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    marginBottom: 10,
  },
  apptIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6FBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
