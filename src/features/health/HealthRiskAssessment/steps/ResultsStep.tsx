import { MessageCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AssessmentCategoryResult, HealthRiskAssessmentResult } from '../../../../services/api/healthRiskAssessment.api';
import { ACCENT, BUCKET_COLOR, createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    result: HealthRiskAssessmentResult;
    onDiscuss: (summaryText: string) => void;
    onDone: () => void;
}

const buildSummary = (result: HealthRiskAssessmentResult) => {
    const parts = result.categories.map((c) => `${c.label} - ${c.bucket}`).join(', ');
    return `I just completed a wellness check-in. My results: ${parts}. Overall: ${result.overallBucket}.`;
};

function CategoryRow({ category }: { category: AssessmentCategoryResult }) {
  const { theme } = useTheme();
  const localStyles = useMemo(() => createLocalStyles(theme), [theme]);
  const { t } = useLanguage();
    const color = BUCKET_COLOR[category.bucket] ?? ACCENT;
    return (
        <View style={localStyles.categoryCard}>
            <View style={localStyles.categoryHeaderRow}>
                <Text style={localStyles.categoryLabel}>{t(category.label)}</Text>
                <View style={[localStyles.bucketPill, { backgroundColor: color + '1A' }]}>
                    <Text style={[localStyles.bucketPillText, { color }]}>{t(category.bucket)}</Text>
                </View>
            </View>
            <Text style={localStyles.categoryTip}>{t(category.tip)}</Text>
        </View>
    );
}

export default function ResultsStep({ result, onDiscuss, onDone }: Props) {
  const { theme } = useTheme();
  const localStyles = useMemo(() => createLocalStyles(theme), [theme]);
  const stepStyles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    return (
        <View style={[stepStyles.container, { paddingTop: 4 }]}>
            {result.categories.map((category) => (
                <CategoryRow key={category.key} category={category} />
            ))}

            <Text style={[stepStyles.hint, { marginTop: 12 }]}>
                {t('wellness_snapshot_disclaimer')}
            </Text>

            <TouchableOpacity
                style={localStyles.discussBtn}
                onPress={() => onDiscuss(buildSummary(result))}
                activeOpacity={0.85}
            >
                <MessageCircle size={18} color={ACCENT} />
                <Text style={localStyles.discussBtnText}>{t('discuss_this_with_medo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={localStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
                <Text style={localStyles.doneBtnText}>{t('done')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const createLocalStyles = (c: ThemeColors) => StyleSheet.create({
    categoryCard: {
        backgroundColor: c.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        padding: 14,
        marginBottom: 10,
    },
    categoryHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    categoryLabel: { fontSize: 13.5, fontWeight: '700', color: c.text },
    bucketPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    bucketPillText: { fontSize: 11, fontWeight: '700' },
    categoryTip: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
    discussBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: 10,
        height: 48,
        marginTop: 16,
    },
    discussBtnText: { fontSize: 13, fontWeight: '800', color: ACCENT, letterSpacing: 0.6 },
    doneBtn: {
        backgroundColor: ACCENT,
        borderRadius: 10,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    doneBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },
});
