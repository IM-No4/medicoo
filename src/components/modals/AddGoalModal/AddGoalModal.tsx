import { ChevronLeft, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../StatusModal';
import GoalTargetStep from './steps/GoalTargetStep';
import GoalTypeStep from './steps/GoalTypeStep';
import { styles } from './styles';

const STEPS = [
    GoalTypeStep,
    GoalTargetStep,
];

interface AddGoalModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AddGoalModal({ visible, onClose, onSuccess }: AddGoalModalProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const [form, setForm] = useState({
        type: '',
        title: '',
        target: '',
        unit: '',
        color: '#2FA561',
        frequency: 'Daily',
    });

    const StepComponent = STEPS[stepIndex] as any;

    const updateForm = (data: Partial<typeof form>) => {
        setForm(prev => ({ ...prev, ...data }));
    };

    const isNextDisabled = () => {
        if (stepIndex === 0) return !form.type;
        if (stepIndex === 1) return !form.target || (form.type === 'custom' && !form.title);
        return false;
    };

    const handleNext = async () => {
        if (stepIndex === STEPS.length - 1) {
            // Final step: Save Goal
            try {
                setLoading(true);
                // Simulate API call
                setTimeout(() => {
                    setLoading(false);
                    onSuccess?.();
                    showStatus('success', 'Goal Set!', 'Your new health habit has been tracked successfully.');

                    // Reset form for next time
                    setStepIndex(0);
                    setForm({
                        type: '',
                        title: '',
                        target: '',
                        unit: '',
                        color: '#2FA561',
                        frequency: 'Daily',
                    });
                }, 1500);
            } catch (error) {
                setLoading(false);
                showStatus('error', 'Update Failed', 'We couldn\'t save your goal. Please try again.');
            }
        } else {
            setStepIndex(stepIndex + 1);
        }
    };

    const handleBack = () => {
        if (stepIndex > 0) {
            setStepIndex(stepIndex - 1);
        } else {
            onClose();
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={onClose}
            >
                <View style={styles.modalBackdrop}>
                    <TouchableOpacity
                        style={styles.backdropTouchable}
                        activeOpacity={1}
                        onPress={onClose}
                    />

                    <View
                        style={[
                            styles.modalContainer,
                            { paddingBottom: Math.max(insets.bottom, 20) }
                        ]}
                    >
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            style={{ flex: 1 }}
                        >
                            <View style={styles.modalHeader}>
                                <View style={styles.dragIndicator} />

                                <View style={styles.headerBar}>
                                    <View style={styles.headerLeft}>
                                        {stepIndex > 0 && (
                                            <TouchableOpacity
                                                style={styles.iconButton}
                                                onPress={handleBack}
                                            >
                                                <ChevronLeft size={24} color="#111827" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <View style={styles.headerCenter}>
                                        <Text style={styles.headerTitle}>Set a Habit</Text>
                                    </View>

                                    <View style={styles.headerRight}>
                                        <TouchableOpacity
                                            style={styles.iconButton}
                                            onPress={onClose}
                                        >
                                            <X size={24} color="#111827" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <StepComponent
                                    data={form}
                                    onChange={updateForm}
                                />
                            </ScrollView>

                            <View style={[styles.fixedFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        isNextDisabled() && styles.primaryButtonDisabled
                                    ]}
                                    disabled={isNextDisabled() || loading}
                                    onPress={handleNext}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.primaryText}>
                                            {stepIndex === STEPS.length - 1 ? 'Save Goal' : 'Next'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </View>
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
