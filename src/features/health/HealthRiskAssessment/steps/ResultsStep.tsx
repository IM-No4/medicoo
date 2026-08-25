import { MessageCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AssessmentCategoryResult, HealthRiskAssessmentResult } from '../../../../services/api/healthRiskAssessment.api';
import { ACCENT, BUCKET_COLOR, styles as stepStyles } from '../styles';

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
    const color = BUCKET_COLOR[category.bucket] ?? ACCENT;
    return (
        <View style={localStyles.categoryCard}>
            <View style={localStyles.categoryHeaderRow}>
                <Text style={localStyles.categoryLabel}>{category.label}</Text>
                <View style={[localStyles.bucketPill, { backgroundColor: color + '1A' }]}>
                    <Text style={[localStyles.bucketPillText, { color }]}>{category.bucket}</Text>
                </View>
            </View>
            <Text style={localStyles.categoryTip}>{category.tip}</Text>
        </View>
    );
}

export default function ResultsStep({ result, onDiscuss, onDone }: Props) {
    return (
        <View style={[stepStyles.container, { paddingTop: 4 }]}>
            {result.categories.map((category) => (
                <CategoryRow key={category.key} category={category} />
            ))}

            <Text style={[stepStyles.hint, { marginTop: 12 }]}>
                This is a general wellness snapshot, not a medical diagnosis. For anything you're concerned about,
                please see a doctor.
            </Text>

            <TouchableOpacity
                style={localStyles.discussBtn}
                onPress={() => onDiscuss(buildSummary(result))}
                activeOpacity={0.85}
            >
                <MessageCircle size={18} color={ACCENT} />
                <Text style={localStyles.discussBtnText}>Discuss this with Medo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={localStyles.doneBtn} onPress={onDone} activeOpacity={0.85}>
                <Text style={localStyles.doneBtnText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

const localStyles = StyleSheet.create({
    categoryCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        marginBottom: 10,
    },
    categoryHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    categoryLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    bucketPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    bucketPillText: { fontSize: 12, fontWeight: '700' },
    categoryTip: { fontSize: 13, color: '#64748B', lineHeight: 19 },
    discussBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: ACCENT,
        borderRadius: 18,
        paddingVertical: 15,
        marginTop: 16,
    },
    discussBtnText: { fontSize: 15, fontWeight: '700', color: ACCENT },
    doneBtn: {
        backgroundColor: ACCENT,
        borderRadius: 18,
        paddingVertical: 17,
        alignItems: 'center',
        marginTop: 12,
    },
    doneBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});
