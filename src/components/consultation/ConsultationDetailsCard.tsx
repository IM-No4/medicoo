import { ClipboardList, FlaskConical, Pill } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ConsultationDetails } from '../../services/api/doctor.api';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

interface Props {
    details: ConsultationDetails | null | undefined;
}

export default function ConsultationDetailsCard({ details }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    if (!details) return null;

    const hasNotes = !!details.notes;
    const hasMedicines = details.prescribedMedicines?.length > 0;
    const hasLabTests = details.prescribedLabTests?.length > 0;

    if (!hasNotes && !hasMedicines && !hasLabTests) return null;

    return (
        <View style={styles.card}>
            <View style={styles.sectionHeader}>
                <ClipboardList size={16} color={theme.text} />
                <Text style={styles.sectionTitle}>{t('consultation_summary')}</Text>
            </View>

            {hasNotes && (
                <View style={styles.block}>
                    <Text style={styles.blockLabel}>{t('diagnosis_notes')}</Text>
                    <Text style={styles.notesText}>{details.notes}</Text>
                </View>
            )}

            {hasMedicines && (
                <View style={styles.block}>
                    <View style={styles.blockHeaderRow}>
                        <Pill size={14} color="#10B981" />
                        <Text style={styles.blockLabel}>{t('prescribed_medicines')}</Text>
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
                        <Text style={styles.blockLabel}>{t('recommended_lab_tests')}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
    card: {
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: c.text },
    block: { marginBottom: 14 },
    blockHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    blockLabel: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase' },
    notesText: { fontSize: 14, color: c.text, lineHeight: 20, marginTop: 6 },
    itemRow: {
        backgroundColor: c.cardSecondary,
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
    },
    itemTitle: { fontSize: 13, fontWeight: '600', color: c.text },
    itemSub: { fontSize: 12, color: c.textSecondary, marginTop: 2 },
    itemNote: { fontSize: 11, color: c.textMuted, marginTop: 1 },
});
