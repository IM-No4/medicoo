import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

import { AppDispatch } from '../../redux/store';
import { addGoal } from '../../redux/slices/goalsSlice';
import StatusModal, { StatusType } from '../../components/modals/StatusModal';
import GoalTypeStep, { GOAL_TYPES } from '../../components/modals/AddGoalModal/steps/GoalTypeStep';
import GoalTargetStep from '../../components/modals/AddGoalModal/steps/GoalTargetStep';
import GoalFrequencyStep from '../../components/modals/AddGoalModal/steps/GoalFrequencyStep';
import { enableStepsTracking, isHealthConnectSupported, openHealthConnectInPlayStore } from '../../services/health/healthConnectStepsService';

const STEPS = [GoalTypeStep, GoalTargetStep, GoalFrequencyStep];
const STEP_TITLES = ['Choose Goal', 'Set Target', 'Frequency'];

// Same header + progress-bar structure as HealthRiskAssessmentScreen - a
// pushed screen, not a bottom sheet, matching how the rest of the app's
// multi-step flows now look.
export default function AddGoalScreen() {
    const navigation = useNavigation();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();
    const [stepIndex, setStepIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;

    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
        // Whether dismissing this status should also leave the screen.
        // False only for "could not save goal" - the goal doesn't exist yet
        // there, so the user should land back on the form to retry instead
        // of losing what they filled in.
        closeOnDismiss: boolean;
    }>({ visible: false, type: 'idle', title: '', message: '', closeOnDismiss: false });

    const [form, setForm] = useState({
        type: '',
        title: '',
        target: '',
        unit: '',
        color: '#6366F1',
        frequency: 'Daily',
    });

    const updateForm = (data: Partial<typeof form>) => {
        setForm(prev => ({ ...prev, ...data }));
    };

    const animateProgress = (toStep: number) => {
        Animated.spring(progressAnim, {
            toValue: toStep / (STEPS.length - 1),
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

    const isNextDisabled = () => {
        if (stepIndex === 0) return !form.type;
        if (stepIndex === 1) return !form.target || (form.type === 'custom' && !form.title);
        return false;
    };

    const handleEnableTracking = async () => {
        const result = await enableStepsTracking();
        if (result.success) {
            setStatus({
                visible: true,
                type: 'success',
                title: 'Tracking Enabled',
                message: 'Medicoo will keep your steps goal updated automatically from Health Connect.',
                closeOnDismiss: true,
            });
            return;
        }

        if (result.reason === 'not_installed' || result.reason === 'update_required') {
            // Below Android 14, Health Connect is a separate Play Store app -
            // this is the expected/common case, not just a dead-end failure,
            // so send the user straight to install/update it.
            setStatus({
                visible: true,
                type: 'warning',
                title: result.reason === 'not_installed' ? 'Health Connect Required' : 'Health Connect Update Required',
                message: result.reason === 'not_installed'
                    ? 'Automatic step tracking needs the Health Connect app, which isn\'t installed on this device yet.'
                    : 'Your Health Connect app needs an update before Medicoo can read step data from it.',
                primaryAction: openHealthConnectInPlayStore,
                primaryActionText: 'Get Health Connect',
                closeOnDismiss: true,
            });
            return;
        }

        setStatus({
            visible: true,
            type: 'error',
            title: 'Could not enable tracking',
            message: 'Permission wasn\'t granted, so tracking is off for now. You can try again from Manage Goals.',
            closeOnDismiss: true,
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const createdType = form.type;
            const createdTitle = form.title;

            await dispatch(addGoal({
                type: form.type,
                title: form.type === 'custom' ? form.title : (form.title || 'Goal'),
                target: parseFloat(form.target) || 0,
                unit: form.unit,
                color: form.color,
                frequency: form.frequency,
                enabled: true,
            })).unwrap();

            // Steps is the one goal type that can be auto-tracked - offer to
            // wire it up right after creation rather than leaving the user
            // to discover Health Connect on their own. Only relevant on
            // Android, where Health Connect actually exists.
            if (createdType === 'steps' && isHealthConnectSupported) {
                setStatus({
                    visible: true,
                    type: 'info',
                    title: 'Track Steps Automatically?',
                    message: `Let Medicoo read your steps from Health Connect so "${createdTitle || 'Daily Steps'}" updates automatically using your phone's background step data.`,
                    primaryAction: handleEnableTracking,
                    primaryActionText: 'Enable',
                    closeOnDismiss: true,
                });
            } else {
                setStatus({
                    visible: true,
                    type: 'success',
                    title: 'Goal Created',
                    message: `Your ${createdTitle || 'goal'} has been added to your daily habits.`,
                    closeOnDismiss: true,
                });
            }
        } catch (error: any) {
            // addGoal's thunk rejects via rejectWithValue(string) - unwrap()
            // throws that string directly, not an Error object, so
            // error.message is always undefined here even when the backend
            // sent a specific reason. Same fix as FriendsScreen.tsx.
            setStatus({
                visible: true,
                type: 'error',
                title: 'Could not save goal',
                message: typeof error === 'string' ? error : 'Something went wrong. Please try again.',
                closeOnDismiss: false,
            });
        } finally {
            setLoading(false);
        }
    };

    const goalMeta = GOAL_TYPES.find(g => g.id === form.type);
    const accentColor = form.color || goalMeta?.color || '#6366F1';
    const StepComponent = STEPS[stepIndex] as any;
    const isLastStep = stepIndex === STEPS.length - 1;

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={goBack} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{STEP_TITLES[stepIndex]}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        { width: progressWidth, backgroundColor: accentColor },
                    ]}
                />
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingTop: 8 }}
            >
                <StepComponent data={form} onChange={updateForm} />
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={[
                        styles.nextBtn,
                        { backgroundColor: isNextDisabled() ? '#E2E8F0' : '#0FBBA1' },
                        !isNextDisabled() && {
                            shadowColor: '#0FBBA1',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                            elevation: 6,
                        },
                    ]}
                    disabled={isNextDisabled() || loading}
                    onPress={isLastStep ? handleSave : goNext}
                    activeOpacity={0.85}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={[styles.nextBtnText, isNextDisabled() && { color: '#94A3B8' }]}>
                            {isLastStep ? 'Save Goal' : 'Continue'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
                onClose={() => {
                    setStatus(prev => ({ ...prev, visible: false }));
                    if (status.closeOnDismiss) navigation.goBack();
                }}
                autoCloseDelay={status.type === 'success' && !status.primaryAction ? 2500 : undefined}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    // Same header recipe as the rest of the app's screens - white bar +
    // shadow, plain icon back button, fontSize 20/600/#111827 title.
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
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
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
    footer: {
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    nextBtn: {
        borderRadius: 18,
        paddingVertical: 17,
        alignItems: 'center',
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
});
