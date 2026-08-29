import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft, Star, Stethoscope } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
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
import { getMyDoctorReview, submitDoctorFeedback } from '../../../../services/api';
import { API_BASE_URL } from '../../../../services/api/client';
import { formatDoctorName } from '../../../../utils/formatters';

export default function DoctorFeedbackScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { consultationId, doctor } = route.params;

    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Whether this patient already reviewed this doctor before (from any
    // past consultation, not just this one - reviews aren't per-consultation)
    // so this becomes an update instead of a fresh review.
    const [isUpdate, setIsUpdate] = useState(false);

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

    useEffect(() => {
        if (!doctor?._id) return;
        getMyDoctorReview(doctor._id)
            .then((existing) => {
                if (existing) {
                    setRating(existing.rating);
                    setReview(existing.review || '');
                    setIsUpdate(true);
                }
            })
            .catch(() => { /* No existing review to pre-fill - fine to start blank */ });
    }, [doctor?._id]);

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
            showStatus(
                'success',
                isUpdate ? 'Review Updated' : 'Review Submitted',
                'Thank you for your valuable feedback! It helps other patients find the best care.'
            );
        } catch (error: any) {
            // Temporary: pins down whether this is still a missing-doctorId
            // 400 (e.g. a stale backend process that hasn't picked up the
            // controller fix yet) or a genuinely different failure.
            console.warn('[DoctorFeedbackScreen] submit failed', {
                doctorId: doctor?._id,
                status: error?.response?.status,
                data: error?.response?.data,
                message: error?.message,
            });
            const serverMessage = error?.response?.data?.message;
            showStatus('error', 'Could Not Submit', serverMessage || 'We could not save your review right now. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isUpdate ? 'Update Review' : 'Write a Review'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.doctorInfo}>
                    {doctor.image || doctor.uniformPhoto ? (
                        <Image
                            source={{
                                uri: (doctor.image || doctor.uniformPhoto).startsWith('http')
                                    ? (doctor.image || doctor.uniformPhoto)
                                    : `${API_BASE_URL}/${doctor.image || doctor.uniformPhoto}`
                            }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Stethoscope size={32} color="#0FBBA1" />
                        </View>
                    )}
                    <Text style={styles.doctorName}>{formatDoctorName(doctor.name)}</Text>
                    <Text style={styles.specialtyText}>{doctor.specialty || doctor.specialization}</Text>
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
                        <Text style={styles.submitButtonText}>{isUpdate ? 'Update Review' : 'Submit Review'}</Text>
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
    // Same header recipe as the rest of the Profile screens - white bar +
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
        backgroundColor: '#0FBBA1',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#0FBBA1',
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
