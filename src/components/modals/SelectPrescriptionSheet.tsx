import AppIcon from '@/src/components/icons/AppIcon';
import { RootState } from '@/src/redux/store';
import { AttachedPrescription } from '@/src/redux/slices/cart.types';
import { Document, fetchDocuments, getDocumentViewUrl } from '@/src/services/api/document.api';
import { getMedicinePrescriptions } from '@/src/services/api/prescription.api';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (prescription: AttachedPrescription) => void;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function SelectPrescriptionSheet({ visible, onClose, onSelect }: Props) {
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
      .then((docs) => setDocuments(docs.filter((d) => d.documentType === 'prescription')))
      .catch((e) => console.warn('Failed to fetch prescription documents', e))
      .finally(() => setLoadingDocuments(false));

    if (doctorPrescriptionsEnabled) {
      setLoadingDoctorPrescriptions(true);
      getMedicinePrescriptions()
        .then(setDoctorPrescriptions)
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
          <Text style={styles.title}>Select a prescription</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>My Documents</Text>
            {loadingDocuments ? (
              <ActivityIndicator size="small" color="#2FA561" style={{ marginVertical: 20 }} />
            ) : documents.length === 0 ? (
              <Text style={styles.emptyText}>No uploaded prescriptions yet.</Text>
            ) : (
              documents.map((doc) => (
                <TouchableOpacity
                  key={doc._id}
                  style={styles.card}
                  onPress={() => handleSelectDocument(doc)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <AppIcon name="file-text" size={20} color="#2FA561" />
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

            <Text style={styles.sectionTitle}>From Your Doctor</Text>
            {!doctorPrescriptionsEnabled ? (
              <View style={styles.comingSoonCard}>
                <AppIcon name="clock" size={18} color="#9CA3AF" />
                <Text style={styles.comingSoonText}>Coming soon</Text>
              </View>
            ) : loadingDoctorPrescriptions ? (
              <ActivityIndicator size="small" color="#2FA561" style={{ marginVertical: 20 }} />
            ) : doctorPrescriptions.length === 0 ? (
              <Text style={styles.emptyText}>No prescriptions from your doctor yet.</Text>
            ) : (
              doctorPrescriptions.map((rx) => (
                <TouchableOpacity
                  key={rx._id}
                  style={styles.card}
                  onPress={() => handleSelectDoctorPrescription(rx)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <AppIcon name="stethoscope" size={20} color="#2FA561" />
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
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
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
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
    color: '#1F2937',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  comingSoonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comingSoonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
