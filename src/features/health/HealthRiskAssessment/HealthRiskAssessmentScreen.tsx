import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    getLatestHealthRiskAssessment,
    HealthRiskAssessmentResult,
    submitHealthRiskAssessment,
} from '../../../services/api/healthRiskAssessment.api';
import { ASSESSMENT_CATEGORIES } from './questions';
import { ACCENT, BUCKET_COLOR } from './styles';
import CategoryQuestionStep from './steps/CategoryQuestionStep';
import IntroStep from './steps/IntroStep';
import ResultsStep from './steps/ResultsStep';

const TOTAL_CATEGORY_STEPS = ASSESSMENT_CATEGORIES.length;
const RESULTS_STEP_INDEX = TOTAL_CATEGORY_STEPS + 1;

function StatusBadge({ bucket }: { bucket: string }) {
    const color = BUCKET_COLOR[bucket] ?? ACCENT;
    return (
        <View style={[styles.statusBadge, { backgroundColor: color + '1A' }]}>
            <Text style={[styles.statusBadgeText, { color }]} numberOfLines={1}>
                {bucket}
            </Text>
        </View>
    );
}

export default function HealthRiskAssessmentScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();

    // Opened from the profile's assessment history list to view a past
    // result read-only, instead of taking a new one.
    const viewResult: HealthRiskAssessmentResult | undefined = route.params?.viewResult;

    const [stepIndex, setStepIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [lastResult, setLastResult] = useState<HealthRiskAssessmentResult | null>(null);
    const [result, setResult] = useState<HealthRiskAssessmentResult | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (viewResult) return;
        getLatestHealthRiskAssessment()
            .then(setLastResult)
            .catch((e) => console.warn('Failed to load last assessment:', e));
    }, [viewResult]);

    const animateProgress = (toStep: number) => {
        const ratio = toStep === 0 ? 0 : toStep === RESULTS_STEP_INDEX ? 1 : toStep / TOTAL_CATEGORY_STEPS;
        Animated.spring(progressAnim, {
            toValue: ratio,
            useNativeDriver: false,
            tension: 60,
            friction: 10,
        }).start();
    };

    const goNext = () => {
        const next = stepIndex + 1;
        animateProgress(next);
        setStepIndex(next);
    };

    const goBack = () => {
        if (stepIndex > 0) {
            const prev = stepIndex - 1;
            animateProgress(prev);
            setStepIndex(prev);
        } else {
            navigation.goBack();
        }
    };

    const handleAnswer = (questionKey: string, optionIndex: number) => {
        setAnswers((prev) => ({ ...prev, [questionKey]: optionIndex }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const submitted = await submitHealthRiskAssessment(answers);
            setResult(submitted);
            goNext();
        } catch (error) {
            console.warn('Failed to submit health risk assessment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiscuss = (summaryText: string) => {
        navigation.navigate('AIAssistantChat', { seedMessage: summaryText });
    };

    // Read-only past-result view - skip the quiz entirely.
    if (viewResult) {
        return (
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
                        <ChevronLeft size={22} color="#1F2937" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.stepTitle}>Past Result</Text>
                    </View>
                    <StatusBadge bucket={viewResult.overallBucket} />
                </View>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8 }}>
                    <ResultsStep result={viewResult} onDiscuss={handleDiscuss} onDone={() => navigation.goBack()} />
                </ScrollView>
            </View>
        );
    }

    const isOnCategoryStep = stepIndex >= 1 && stepIndex <= TOTAL_CATEGORY_STEPS;
    const currentCategory = isOnCategoryStep ? ASSESSMENT_CATEGORIES[stepIndex - 1] : null;
    const isLastCategoryStep = stepIndex === TOTAL_CATEGORY_STEPS;
    const isResultsStep = stepIndex === RESULTS_STEP_INDEX;

    const isNextDisabled = () => {
        if (!currentCategory) return false;
        return currentCategory.questions.some((q) => answers[q.key] === undefined);
    };

    const stepTitle = stepIndex === 0
        ? 'Wellness Check-In'
        : currentCategory
            ? currentCategory.label
            : 'Your Results';

    const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                {isResultsStep ? (
                    <View style={styles.iconBtnSpacer} />
                ) : (
                    <TouchableOpacity onPress={goBack} style={styles.iconBtn} activeOpacity={0.7}>
                        <ChevronLeft size={22} color="#1F2937" />
                    </TouchableOpacity>
                )}
                <View style={styles.headerCenter}>
                    <Text style={styles.stepTitle}>{stepTitle}</Text>
                </View>
                {isResultsStep && result ? (
                    <StatusBadge bucket={result.overallBucket} />
                ) : (
                    <View style={styles.iconBtnSpacer} />
                )}
            </View>

            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: ACCENT }]} />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingTop: 8 }}
            >
                {stepIndex === 0 && <IntroStep lastResult={lastResult} />}
                {currentCategory && (
                    <CategoryQuestionStep category={currentCategory} answers={answers} onAnswer={handleAnswer} />
                )}
                {isResultsStep && result && (
                    <ResultsStep result={result} onDiscuss={handleDiscuss} onDone={() => navigation.goBack()} />
                )}
            </ScrollView>

            {!isResultsStep && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                    <TouchableOpacity
                        style={[styles.nextBtn, { backgroundColor: isNextDisabled() ? '#E2E8F0' : ACCENT }]}
                        disabled={isNextDisabled() || submitting}
                        onPress={isLastCategoryStep ? handleSubmit : goNext}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={[styles.nextBtnText, isNextDisabled() && { color: '#94A3B8' }]}>
                                {stepIndex === 0 ? 'Start Assessment' : isLastCategoryStep ? 'See Results' : 'Next'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Plain symmetry spacer for the header's other side - no background, so
    // it doesn't read as an empty badge/button when there's nothing to show.
    iconBtnSpacer: {
        width: 36,
        height: 36,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        maxWidth: 110,
    },
    statusBadgeText: { fontSize: 11, fontWeight: '700' },
    headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
    stepTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    progressTrack: {
        height: 3,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 20,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 16,
        marginBottom: 8,
    },
    progressFill: { height: '100%', borderRadius: 2 },
    footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
    nextBtn: { borderRadius: 18, paddingVertical: 17, alignItems: 'center' },
    nextBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
});
