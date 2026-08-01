import { ClipboardList, FlaskConical, Pill } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConsultationDetails } from '../../services/api/doctor.api';

interface Props {
    details: ConsultationDetails | null | undefined;
}

export default function ConsultationDetailsCard({ details }: Props) {
    if (!details) return null;

    const hasNotes = !!details.notes;
    const hasMedicines = details.prescribedMedicines?.length > 0;
    const hasLabTests = details.prescribedLabTests?.length > 0;

    if (!hasNotes && !hasMedicines && !hasLabTests) return null;

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <ClipboardList size={16} color="#111827" />
                <Text style={styles.sectionTitle}>Consultation Summary</Text>
            </View>

            {hasNotes && (
                <View style={styles.block}>
                    <Text style={styles.blockLabel}>Diagnosis / Notes</Text>
                    <Text style={styles.notesText}>{details.notes}</Text>
                </View>
            )}

            {hasMedicines && (
                <View style={styles.block}>
                    <View style={styles.blockHeaderRow}>
                        <Pill size={14} color="#2FA561" />
                        <Text style={styles.blockLabel}>Prescribed Medicines</Text>
                    </View>
                    {details.prescribedMedicines.map((med, index) => (
                        <View key={`${med.medicineSku}-${index}`} style={styles.itemRow}>
                            <Text style={styles.itemTitle}>{med.medicineName}</Text>
                            <Text style={styles.itemSub}>
                                {[med.intakeDetails.dosage, med.intakeDetails.period].filter(Boolean).join(' · ')}
                            </Text>
                            {med.intakeDetails.instructions?.map((instr, i) => (
                                <Text key={i} style={styles.itemNote}>· {instr}</Text>
                            ))}
                        </View>
                    ))}
                </View>
            )}

            {hasLabTests && (
                <View style={styles.block}>
                    <View style={styles.blockHeaderRow}>
                        <FlaskConical size={14} color="#3B82F6" />
                        <Text style={styles.blockLabel}>Recommended Lab Tests</Text>
                    </View>
                    {details.prescribedLabTests.map((test, index) => (
                        <View key={`${test.testName}-${index}`} style={styles.itemRow}>
                            <Text style={styles.itemTitle}>{test.testName}</Text>
                            {!!test.additionalDetails && <Text style={styles.itemSub}>{test.additionalDetails}</Text>}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    block: { marginBottom: 14 },
    blockHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    blockLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    notesText: { fontSize: 14, color: '#374151', lineHeight: 20, marginTop: 6 },
    itemRow: {
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
    },
    itemTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
    itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    itemNote: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
});
