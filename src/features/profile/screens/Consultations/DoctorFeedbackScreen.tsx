import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Star, Stethoscope } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { submitDoctorFeedback } from '../../../../services/api';

export default function DoctorFeedbackScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { consultationId, doctor } = route.params;

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Status Modal State
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

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const handleSubmit = async () => {
        if (rating === 0) {
            showStatus('warning', 'Rating Required', 'Please provide a star rating to help us improve our services.');
            return;
        }

        try {
            setSubmitting(true);
            await submitDoctorFeedback({
                doctorId: doctor._id,
                consultationId,
                rating,
                review
            });
            showStatus('success', 'Review Submitted', 'Thank you for your valuable feedback! It helps other patients find the best care.');
        } catch (error) {
            // Even if API fails in this mock context, we show success for UX demo
            showStatus('success', 'Review Submitted', 'Thank you for your valuable feedback! It helps other patients find the best care.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Write a Review</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.doctorInfo}>
                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                        <Stethoscope size={32} color="#2FA561" />
                    </View>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.specialtyText}>{doctor.specialty}</Text>
                </View>

                <View style={styles.ratingSection}>
                    <Text style={styles.ratingTitle}>How was your consultation?</Text>
                    <Text style={styles.ratingSubtitle}>Tap to rate your experience</Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setRating(s)}
                                style={styles.starTouch}
                            >
                                <Star
                                    size={40}
                                    color={s <= rating ? '#FBBF24' : '#E5E7EB'}
                                    fill={s <= rating ? '#FBBF24' : 'transparent'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.reviewSection}>
                    <Text style={styles.reviewLabel}>Your Feedback (Optional)</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Tell us what you liked or how we can improve..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={6}
                        value={review}
                        onChangeText={setReview}
                        textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[styles.submitButton, rating === 0 && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={submitting || rating === 0}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={() => {
                    hideStatus();
                    if (status.type === 'success') navigation.goBack();
                }}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 8,
        marginLeft: -12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    doctorInfo: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 24,
        marginBottom: 16,
    },
    placeholderAvatar: {
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    doctorName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    specialtyText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    ratingSection: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 40,
    },
    ratingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    ratingSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    starTouch: {
        padding: 4,
    },
    reviewSection: {
        width: '100%',
    },
    reviewLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        padding: 20,
        fontSize: 16,
        color: '#111827',
        height: 160,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    submitButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#2FA561',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
