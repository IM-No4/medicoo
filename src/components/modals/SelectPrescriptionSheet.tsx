import AppIcon from '@/src/components/icons/AppIcon';
import MedicalDisclaimerNote from '@/src/components/MedicalDisclaimerNote';
import { RootState } from '@/src/redux/store';
import { AttachedPrescription } from '@/src/redux/slices/cart.types';
import { Document, fetchDocuments, getDocumentViewUrl } from '@/src/services/api/document.api';
import { getMedicinePrescriptions } from '@/src/services/api/prescription.api';
import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import { Modal } from '../ThemedModal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (prescription: AttachedPrescription) => void;
}

// Prescriptions older than 3 months can't be used to order medicines (the
// backend rejects them), so don't offer them. An uploaded document has no
// prescription date of its own in the app, so its upload date is the cutoff.
const MAX_PRESCRIPTION_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const isRecentEnough = (dateString: string) =>
  Date.now() - new Date(dateString).getTime() <= MAX_PRESCRIPTION_AGE_MS;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SelectPrescriptionSheet({ visible, onClose, onSelect }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const doctorPrescriptionsEnabled = useSelector(
    (state: RootState) => state.appConfig.enabledServices.doctorPrescriptions
  );

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<Awaited<ReturnType<typeof getMedicinePrescriptions>>>([]);
  const [loadingDoctorPrescriptions, setLoadingDoctorPrescriptions] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setLoadingDocuments(true);
    fetchDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.documentType === 'prescription' && isRecentEnough(d.createdAt))))
      .catch((e) => console.warn('Failed to fetch prescription documents', e))
      .finally(() => setLoadingDocuments(false));

    if (doctorPrescriptionsEnabled) {
      setLoadingDoctorPrescriptions(true);
      getMedicinePrescriptions()
        .then((list) => setDoctorPrescriptions(list.filter((rx) => isRecentEnough(rx.createdAt))))
        .catch((e) => console.warn('Failed to fetch doctor prescriptions', e))
        .finally(() => setLoadingDoctorPrescriptions(false));
    }
  }, [visible, doctorPrescriptionsEnabled]);

  const handleSelectDocument = (doc: Document) => {
    // doc.fileUrl always comes back undefined - the backend strips it from
    // both list/upload responses and hands back a viewUrl-driving id
    // instead, so the actual file is fetched via this endpoint.
    onSelect({ mode: 'document', documentId: doc._id, uri: getDocumentViewUrl(doc._id), label: doc.name });
    onClose();
  };

  const handleSelectDoctorPrescription = (rx: (typeof doctorPrescriptions)[number]) => {
    onSelect({
      mode: 'doctor',
      prescriptionId: rx._id,
      label: `Dr. ${rx.doctorName || 'Prescription'} - ${formatDate(rx.createdAt)}`,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={onClose} />
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handleBar} />
          <Text style={styles.title}>{t('select_a_prescription')}</Text>
          <MedicalDisclaimerNote variant="medication" style={{ paddingHorizontal: 0, marginBottom: 4 }} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>{t('my_documents')}</Text>
            {loadingDocuments ? (
              <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
            ) : documents.length === 0 ? (
              <Text style={styles.emptyText}>{t('No uploaded prescriptions from the last 3 months')}</Text>
            ) : (
              documents.map((doc) => (
                <TouchableOpacity
                  key={doc._id}
                  style={styles.card}
                  onPress={() => handleSelectDocument(doc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <AppIcon name="file-text" size={20} color="#10B981" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{doc.name}</Text>
                    <Text style={styles.cardSubtitle}>{formatDate(doc.createdAt)}</Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              ))
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>{t('from_your_doctor')}</Text>
            {!doctorPrescriptionsEnabled ? (
              <View style={styles.comingSoonCard}>
                <AppIcon name="clock" size={18} color={theme.textMuted} />
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            ) : loadingDoctorPrescriptions ? (
              <ActivityIndicator size="small" color="#10B981" style={{ marginVertical: 20 }} />
            ) : doctorPrescriptions.length === 0 ? (
              <Text style={styles.emptyText}>{t('no_prescriptions_from_your_doctor_yet')}</Text>
            ) : (
              doctorPrescriptions.map((rx) => (
                <TouchableOpacity
                  key={rx._id}
                  style={styles.card}
                  onPress={() => handleSelectDoctorPrescription(rx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <AppIcon name="stethoscope" size={20} color="#10B981" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {rx.doctorName ? `Dr. ${rx.doctorName}` : 'Doctor Prescription'}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {formatDate(rx.createdAt)} · {rx.prescribedMedicines?.length || 0} medicine(s)
                    </Text>
                  </View>
                  <AppIcon name="chevron-right" size={18} color="#C7C7CC" />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: c.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: c.textMuted,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.cardSecondary,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: c.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: c.cardSecondary,
    marginVertical: 16,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.cardSecondary,
    borderWidth: 1,
    borderColor: c.border,
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
  },
});
