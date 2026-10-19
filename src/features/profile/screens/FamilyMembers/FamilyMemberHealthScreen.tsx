import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from '../../../../components/ThemedStatusBar';
import {
  Activity,
  Calendar,
  Check,
  ChevronLeft,
  FileText,
  Heart,
  Lock,
  Pill,
  Plus,
  Stethoscope,
  Upload,
  Weight,
  X,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RenderMedicationIcon } from '../../../../components/modals/AddMedicationModal/config/shapes';
import {
  FamilyConsent,
  getFamilyMemberAdherence,
  getFamilyMemberAppointments,
  getFamilyMemberDocuments,
  getFamilyMemberMedicines,
  getFamilyMemberPrescriptions,
  getFamilyMemberVitals,
} from '../../../../services/api/family.api';
import { markMedicineIntake } from '../../../../services/api/medicine.api';
import { apiClient } from '../../../../services/api/client';
import { uploadDocument } from '../../../../services/api/document.api';
import { getToken } from '../../../../utils/tokenManagement';
import { setPreferredBookingMember } from '../../../doctor/bookingTarget';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';

interface Params {
  memberId: string;
  name: string;
  relation?: string;
  /** Has their own Medicoo account */
  linked?: boolean;
  consent?: FamilyConsent;
}

type Locked = Partial<Record<'appointments' | 'medicines' | 'adherence' | 'prescriptions' | 'documents' | 'vitals', boolean>>;

const capitalise = (text?: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

/** "8:00 am" -> "08:00" (how a dose time is stored when it is logged) */
const to24 = (time: string) => {
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(time).trim());
  if (!match) return time;
  let hours = parseInt(match[1], 10) % 12;
  if (match[3].toLowerCase() === 'pm') hours += 12;
  return `${String(hours).padStart(2, '0')}:${match[2]}`;
};

const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * One family member, looked after from the family head's account. Each section is gated by its own agreement from the member (a
 * member without a Medicoo account is looked after entirely by the head, so nothing is locked for them).
 */
export default function FamilyMemberHealthScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { memberId, name, relation, linked, consent } = (route.params || {}) as Params;

  const can = (key: keyof FamilyConsent) => !linked || !!consent?.[key];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locked, setLocked] = useState<Locked>({});
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [adherence, setAdherence] = useState<any[]>([]);
  const [adherenceSummary, setAdherenceSummary] = useState<{ taken: number; skipped: number; missed: number } | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [markingKey, setMarkingKey] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [appts, meds, adh, rx, docs, vit] = await Promise.allSettled([
      getFamilyMemberAppointments(memberId),
      getFamilyMemberMedicines(memberId),
      getFamilyMemberAdherence(memberId, 7),
      getFamilyMemberPrescriptions(memberId),
      getFamilyMemberDocuments(memberId),
      getFamilyMemberVitals(memberId),
    ]);
    const notShared = (r: PromiseSettledResult<any>) => r.status === 'rejected' && (r.reason as any)?.response?.data?.code === 'NOT_SHARED';
    setLocked({
      appointments: notShared(appts),
      medicines: notShared(meds),
      adherence: notShared(adh),
      prescriptions: notShared(rx),
      documents: notShared(docs),
      vitals: notShared(vit),
    });
    if (appts.status === 'fulfilled') setAppointments(appts.value?.data || []);
    if (meds.status === 'fulfilled') setMedicines(meds.value?.data || []);
    if (adh.status === 'fulfilled') {
      setAdherence(adh.value?.data || []);
      setAdherenceSummary(adh.value?.summary || null);
    }
    if (rx.status === 'fulfilled') setPrescriptions(rx.value?.data || []);
    if (docs.status === 'fulfilled') setDocuments(docs.value?.data || []);
    if (vit.status === 'fulfilled') setVitals(vit.value?.data || []);
    setLoading(false);
    setRefreshing(false);
  }, [memberId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayString();
  // The log rows carry the medicine name, not the schedule id, so match a dose by name + time.
  const statusOfDose = (medicine: any, time: string) =>
    adherence.find((a) => a.date === today && a.time === to24(time) && a.medicineName === medicine.medicineName)?.status as
      | 'taken'
      | 'skipped'
      | 'missed'
      | undefined;

  const markDose = async (medicine: any, time: string, status: 'taken' | 'skipped') => {
    const key = `${medicine._id}-${time}`;
    setMarkingKey(key);
    try {
      await markMedicineIntake({ scheduleId: medicine._id, date: today, time: to24(time), status, forMemberId: memberId });
      await load();
    } catch (error: any) {
      Alert.alert('Could not save', error?.response?.data?.message || 'Please try again.');
    } finally {
      setMarkingKey(null);
    }
  };

  const openFile = async (doc: any) => {
    setOpeningId(doc._id);
    try {
      const token = await getToken('access_token');
      const target = `${FileSystem.cacheDirectory}${(doc.name || 'document').replace(/[^a-zA-Z0-9]/g, '_')}.${doc.fileType === 'image' ? 'jpg' : 'pdf'}`;
      const result = await FileSystem.downloadAsync(`${apiClient.defaults.baseURL}${doc.viewUrl}`, target, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
    } catch (error) {
      Alert.alert('Could not open', 'The file could not be opened. Please try again.');
    } finally {
      setOpeningId(null);
    }
  };

  const addDocument = () => {
    Alert.alert('What kind of document?', undefined, [
      { text: 'Lab report', onPress: () => pickAndUpload('lab_report') },
      { text: 'Prescription', onPress: () => pickAndUpload('prescription') },
      { text: 'Other', onPress: () => pickAndUpload('other') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickAndUpload = async (documentType: string) => {
    try {
      const picked = await getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const formData = new FormData();
      const lower = asset.uri.toLowerCase();
      const type = lower.endsWith('.pdf') ? 'application/pdf' : lower.endsWith('.png') ? 'image/png' : 'image/jpeg';
      formData.append('file', { uri: asset.uri, name: asset.name || 'upload', type } as any);
      formData.append('name', asset.name || 'Document');
      formData.append('documentType', documentType);
      formData.append('forMemberId', memberId);
      await uploadDocument(formData);
      await load();
    } catch (error: any) {
      Alert.alert('Could not add', error?.response?.data?.message || 'Please try again.');
    }
  };

  const latestByMetric = (metric: 'heartRate' | 'systolic' | 'weight') => vitals.find((v) => v[metric] !== undefined);
  const latestHeartRate = latestByMetric('heartRate');
  const latestBp = latestByMetric('systolic');
  const latestWeight = latestByMetric('weight');

  const Section = ({ title, locked: isLocked, lockedText, action, children }: any) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {isLocked ? (
        <View style={styles.lockedRow}>
          <Lock size={14} color={theme.textMuted} />
          <Text style={styles.lockedText}>{lockedText || `${name || 'They'} has not shared this with you.`}</Text>
        </View>
      ) : (
        children
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{name || 'Family Member'}</Text>
          {relation ? <Text style={styles.headerSub}>{capitalise(relation)}{linked ? '' : ' · looked after by you'}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={['#10B981']} />}
        >
          {/* What you can do for them */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, !can('bookConsultations') && styles.actionBtnOff]}
              disabled={!can('bookConsultations')}
              onPress={() => {
                setPreferredBookingMember({ memberId, name: name || 'Family member', hasAccount: !!linked });
                navigation.navigate('DoctorStack', { screen: 'DoctorList' });
              }}
              activeOpacity={0.8}
            >
              <Stethoscope size={16} color={can('bookConsultations') ? '#fff' : theme.textMuted} />
              <Text style={[styles.actionBtnText, !can('bookConsultations') && styles.actionBtnTextOff]}>Book a doctor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, !can('manageMedications') && styles.actionBtnOff]}
              disabled={!can('manageMedications')}
              onPress={() => navigation.navigate('AddMedication', { forMemberId: memberId, forMemberName: name })}
              activeOpacity={0.8}
            >
              <Pill size={16} color={can('manageMedications') ? '#fff' : theme.textMuted} />
              <Text style={[styles.actionBtnText, !can('manageMedications') && styles.actionBtnTextOff]}>Add medicine</Text>
            </TouchableOpacity>
          </View>
          {linked && !can('bookConsultations') ? (
            <Text style={styles.hint}>{name} has not allowed you to book or manage things for them yet. They can turn these on in Family Members.</Text>
          ) : (
            <Text style={styles.hint}>"Book a doctor" starts a booking for {name}. You can change who it is for before you send it.</Text>
          )}

          <Section title="Appointments" locked={locked.appointments} lockedText={`${name} has not shared their appointments.`}>
            {appointments.length === 0 ? (
              <Text style={styles.emptyText}>No consultations yet.</Text>
            ) : (
              appointments.map((appt) => (
                <View key={appt.id} style={styles.card}>
                  <View style={styles.iconBox}>
                    <Calendar size={18} color="#10B981" />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{appt.doctorName}</Text>
                    <Text style={styles.cardSub}>
                      {[appt.specialization, appt.date ? new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', appt.start, capitalise(appt.status)]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Section>

          <Section title="Medicines" locked={locked.medicines} lockedText={`${name} has not shared their medicines.`}>
            {medicines.length === 0 ? (
              <Text style={styles.emptyText}>No medicines added yet.</Text>
            ) : (
              medicines.map((item) => (
                <View key={item._id} style={styles.medCard}>
                  <View style={styles.medTop}>
                    <View style={[styles.iconBox, { backgroundColor: item.color || '#E0F7F4' }]}>
                      <RenderMedicationIcon shapeKey={item.shape || 'tablet'} leftColor={item.leftColor} rightColor={item.rightColor} size={0.8} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{item.medicineName}</Text>
                      <Text style={styles.cardSub}>{[item.dosage, item.scheduleType].filter(Boolean).join(' · ')}</Text>
                    </View>
                  </View>
                  {(item.times || []).length > 0 ? (
                    <View style={styles.doseRow}>
                      {item.times.map((time: string) => {
                        const state = statusOfDose(item, time);
                        const busy = markingKey === `${item._id}-${time}`;
                        return (
                          <View key={time} style={styles.doseChip}>
                            <Text style={styles.doseTime}>{time}</Text>
                            {state ? (
                              <Text style={[styles.doseState, state === 'taken' ? styles.doseTaken : styles.doseOther]}>{capitalise(state)}</Text>
                            ) : can('manageMedications') ? (
                              busy ? (
                                <ActivityIndicator size="small" color="#10B981" />
                              ) : (
                                <View style={styles.doseButtons}>
                                  <TouchableOpacity onPress={() => markDose(item, time, 'taken')} style={styles.doseTick}>
                                    <Check size={14} color="#fff" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => markDose(item, time, 'skipped')} style={styles.doseSkip}>
                                    <X size={14} color={theme.textSecondary} />
                                  </TouchableOpacity>
                                </View>
                              )
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </Section>

          <Section title="Last 7 days" locked={locked.adherence} lockedText={`${name} has not shared what they took or skipped.`}>
            {adherenceSummary ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryNum, { color: '#10B981' }]}>{adherenceSummary.taken}</Text>
                  <Text style={styles.summaryLabel}>Taken</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryNum, { color: '#F59E0B' }]}>{adherenceSummary.skipped}</Text>
                  <Text style={styles.summaryLabel}>Skipped</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={[styles.summaryNum, { color: '#EF4444' }]}>{adherenceSummary.missed}</Text>
                  <Text style={styles.summaryLabel}>Missed</Text>
                </View>
              </View>
            ) : null}
            {adherence.slice(0, 12).map((row) => (
              <View key={row.id} style={styles.logRow}>
                <Text style={styles.logText} numberOfLines={1}>{row.medicineName}</Text>
                <Text style={styles.logMeta}>
                  {new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {row.time} · {capitalise(row.status)}
                  {row.markedBy === 'caregiver' ? ' · by you' : ''}
                </Text>
              </View>
            ))}
            {adherence.length === 0 ? <Text style={styles.emptyText}>Nothing logged yet.</Text> : null}
          </Section>

          <Section title="Prescriptions" locked={locked.prescriptions} lockedText={`${name} has not shared their prescriptions.`}>
            {prescriptions.length === 0 ? (
              <Text style={styles.emptyText}>No prescriptions yet.</Text>
            ) : (
              prescriptions.map((doc) => (
                <TouchableOpacity key={doc._id} style={styles.card} onPress={() => openFile(doc)} activeOpacity={0.7}>
                  <View style={styles.iconBox}>
                    {openingId === doc._id ? <ActivityIndicator size="small" color="#10B981" /> : <FileText size={18} color="#10B981" />}
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.cardSub}>{[doc.sourceName, new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </Section>

          <Section
            title="Documents"
            locked={locked.documents}
            lockedText={`${name} has not shared their documents.`}
            action={
              can('manageDocuments') ? (
                <TouchableOpacity onPress={addDocument} style={styles.addLink} activeOpacity={0.7}>
                  <Upload size={14} color="#10B981" />
                  <Text style={styles.addLinkText}>Add</Text>
                </TouchableOpacity>
              ) : null
            }
          >
            {documents.filter((d) => d.documentType !== 'prescription').length === 0 ? (
              <Text style={styles.emptyText}>No documents yet.</Text>
            ) : (
              documents
                .filter((d) => d.documentType !== 'prescription')
                .map((doc) => (
                  <TouchableOpacity key={doc._id} style={styles.card} onPress={() => openFile(doc)} activeOpacity={0.7}>
                    <View style={styles.iconBox}>
                      {openingId === doc._id ? <ActivityIndicator size="small" color="#10B981" /> : <FileText size={18} color="#10B981" />}
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.cardSub}>{[capitalise(String(doc.documentType || '').replace(/_/g, ' ')), new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })].join(' · ')}</Text>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </Section>

          {linked ? (
            <Section title="Vitals" locked={locked.vitals} lockedText={`${name} has not shared their vitals.`}>
              {!latestHeartRate && !latestBp && !latestWeight ? (
                <Text style={styles.emptyText}>No vitals logged yet.</Text>
              ) : (
                <View style={styles.vitalsRow}>
                  <VitalCard icon={Heart} color="#EF4444" bg="#FEF2F2" label="Heart Rate" value={latestHeartRate ? `${latestHeartRate.heartRate}` : '-'} unit="bpm" />
                  <VitalCard icon={Activity} color="#3B82F6" bg="#EFF6FF" label="Blood Pressure" value={latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '-'} unit="mmHg" />
                  <VitalCard icon={Weight} color="#8B5CF6" bg="#F5F3FF" label="Weight" value={latestWeight ? `${latestWeight.weight}` : '-'} unit="kg" />
                </View>
              )}
            </Section>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function VitalCard({ icon: Icon, color, bg, label, value, unit }: any) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 16,
      backgroundColor: c.card,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
        android: { elevation: 2 },
      }),
    },
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    headerSub: { fontSize: 11.5, color: c.textSecondary, marginTop: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: 20 },

    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, height: 44, borderRadius: 10, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    actionBtnOff: { backgroundColor: c.cardSecondary },
    actionBtnText: { fontSize: 12.5, fontWeight: '800', letterSpacing: 0.4, color: '#fff' },
    actionBtnTextOff: { color: c.textMuted },
    hint: { fontSize: 11.5, color: c.textSecondary, lineHeight: 16, marginTop: 10 },

    section: { marginTop: 24 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: c.textSecondary },
    addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addLinkText: { fontSize: 12.5, fontWeight: '700', color: '#10B981' },
    emptyText: { fontSize: 12.5, color: c.textMuted },
    lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: c.cardSecondary },
    lockedText: { flex: 1, fontSize: 12, color: c.textSecondary, lineHeight: 17 },

    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.borderLight, padding: 12, marginBottom: 8, gap: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: c.successBg, alignItems: 'center', justifyContent: 'center' },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 13.5, fontWeight: '700', color: c.text },
    cardSub: { fontSize: 11.5, color: c.textSecondary, marginTop: 2 },

    medCard: { backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.borderLight, padding: 12, marginBottom: 8 },
    medTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    doseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
    doseChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: c.cardSecondary },
    doseTime: { fontSize: 12, fontWeight: '600', color: c.text },
    doseState: { fontSize: 11.5, fontWeight: '700' },
    doseTaken: { color: '#10B981' },
    doseOther: { color: '#F59E0B' },
    doseButtons: { flexDirection: 'row', gap: 6 },
    doseTick: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
    doseSkip: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' },

    summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    summaryBox: { flex: 1, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.borderLight, paddingVertical: 12, alignItems: 'center' },
    summaryNum: { fontSize: 20, fontWeight: '800' },
    summaryLabel: { fontSize: 11.5, color: c.textSecondary, marginTop: 2 },
    logRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    logText: { fontSize: 13, fontWeight: '600', color: c.text },
    logMeta: { fontSize: 11.5, color: c.textSecondary, marginTop: 1 },

    vitalsRow: { flexDirection: 'row', gap: 10 },
    vitalCard: { flex: 1, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.borderLight, padding: 12 },
    vitalIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    vitalValue: { fontSize: 15, fontWeight: '800', color: c.text },
    vitalUnit: { fontSize: 10, color: c.textMuted, fontWeight: '600' },
    vitalLabel: { fontSize: 11, color: c.textSecondary, fontWeight: '600', marginTop: 2 },
  });
