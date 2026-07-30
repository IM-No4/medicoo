import React, { useState, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { useDispatch } from 'react-redux';

import { addGoal } from '../../../redux/slices/goalsSlice';
import StatusModal, { StatusType } from '../StatusModal';
import GoalTypeStep, { GOAL_TYPES } from './steps/GoalTypeStep';
import GoalTargetStep from './steps/GoalTargetStep';
import GoalFrequencyStep from './steps/GoalFrequencyStep';

const { width } = Dimensions.get('window');

const STEPS = [GoalTypeStep, GoalTargetStep, GoalFrequencyStep];
const STEP_TITLES = ['Choose Goal', 'Set Target', 'Frequency'];

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddGoalModal({ visible, onClose, onSuccess }: AddGoalModalProps) {
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const [stepIndex, setStepIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

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
            handleClose();
        }
    };

    const handleClose = () => {
        setStepIndex(0);
        animateProgress(0);
        setForm({ type: '', title: '', target: '', unit: '', color: '#6366F1', frequency: 'Daily' });
        onClose();
    };

    /* ---------- Swipe Down with Animation ---------- */
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    Animated.timing(translateY, {
                        toValue: 1000,
                        duration: 300,
                        useNativeDriver: true,
                    }).start(() => {
                        handleClose();
                        setTimeout(() => {
                            translateY.setValue(0);
                        }, 100);
                    });
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const isNextDisabled = () => {
        if (stepIndex === 0) return !form.type;
        if (stepIndex === 1) return !form.target || (form.type === 'custom' && !form.title);
        return false;
    };

    const handleSave = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            dispatch(addGoal({
                id: Math.random().toString(36).substring(7),
                type: form.type,
                title: form.type === 'custom' ? form.title : (form.title || 'Goal'),
                target: parseFloat(form.target) || 0,
                unit: form.unit,
                current: 0,
                color: form.color,
                frequency: form.frequency,
                enabled: true,
            }));
            onSuccess?.();
            setStatus({
                visible: true,
                type: 'success',
                title: 'Goal Created! 🎯',
                message: `Your ${form.title || 'goal'} has been added to your daily habits.`,
            });
            setStepIndex(0);
            animateProgress(0);
            setForm({ type: '', title: '', target: '', unit: '', color: '#6366F1', frequency: 'Daily' });
        }, 1200);
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
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity
                        style={styles.backdropTouchable}
                        activeOpacity={1}
                        onPress={handleClose}
                    />

                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [{ translateY }],
                                paddingBottom: Math.max(insets.bottom, 0),
                            },
                        ]}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                        >
                            {/* Handle / Header Area with pan handlers */}
                            <View style={styles.modalHeader} {...panResponder.panHandlers}>
                                <View style={styles.dragIndicator} />

                                <View style={styles.headerBar}>
                                    <TouchableOpacity style={styles.iconBtn} onPress={goBack} activeOpacity={0.7}>
                                        <ChevronLeft size={22} color="#64748B" />
                                    </TouchableOpacity>

                                    <View style={styles.headerCenter}>
                                        <Text style={styles.stepTitle}>{STEP_TITLES[stepIndex]}</Text>
                                    </View>

                                    <TouchableOpacity style={styles.iconBtn} onPress={handleClose} activeOpacity={0.7}>
                                        <X size={20} color="#64748B" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Progress bar */}
                            <View style={styles.progressTrack}>
                                <Animated.View
                                    style={[
                                        styles.progressFill,
                                        { width: progressWidth, backgroundColor: accentColor },
                                    ]}
                                />
                            </View>

                            {/* Content */}
                            <ScrollView
                                style={{ flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingTop: 8 }}
                            >
                                <StepComponent data={form} onChange={updateForm} />
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <TouchableOpacity
                                    style={[
                                        styles.nextBtn,
                                        { backgroundColor: isNextDisabled() ? '#E2E8F0' : '#2FA561' },
                                        !isNextDisabled() && {
                                            shadowColor: '#2FA561',
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
                                            {isLastStep ? 'Save Goal ✓' : 'Continue →'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </Animated.View>
                </View>
            </Modal>

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={() => {
                    setStatus(prev => ({ ...prev, visible: false }));
                    if (status.type === 'success') onClose();
                }}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </>
    );
}

const styles = StyleSheet.create({
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        flex: 1,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '95%',
        overflow: 'hidden',
    },
    modalHeader: {
        paddingTop: 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
        zIndex: 10,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E2E8F0',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16,
    },
    progressTrack: {
        height: 3,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 20,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    stepLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stepTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
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
