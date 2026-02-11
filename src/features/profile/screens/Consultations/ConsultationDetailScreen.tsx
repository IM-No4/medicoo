import { useNavigation, useRoute } from '@react-navigation/native';
import {
    ChevronLeft,
    Download,
    FileText,
    MessageCircle,
    MoreVertical,
    Phone,
    Share2,
    Star,
    Stethoscope,
    Video
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getConsultationDetail } from '../../../../services/api';

export default function ConsultationDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const { consultationId } = route.params;

    const [loading, setLoading] = useState(true);
    const [consultation, setConsultation] = useState<any>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await getConsultationDetail(consultationId);
                setConsultation(data);
            } catch (error) {
                // Mock for dev
                setConsultation({
                    _id: consultationId,
                    doctorId: {
                        _id: 'd1',
                        name: 'Dr. Sarah Wilson',
                        specialty: 'Cardiologist',
                        experience: '12 years',
                        hospital: 'Apollo Hospitals, Bangalore'
                    },
                    date: '2026-01-20',
                    time: '10:30 AM',
                    status: 'Completed',
                    type: 'Video',
                    fee: 500,
                    hasFeedback: false,
                    diagnosis: 'Mild hypertension and stress-related fatigue.',
                    notes: 'Patient advised to reduce caffeine intake and monitor blood pressure weekly. Follow up in 2 weeks.',
                    prescription: [
                        { medicine: 'Telmisartan 40mg', dosage: '1-0-0', duration: '15 days' },
                        { medicine: 'Magnesium B6', dosage: '0-0-1', duration: '10 days' }
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [consultationId]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2FA561" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Consultation Detail</Text>
                <TouchableOpacity style={styles.moreButton}>
                    <MoreVertical size={20} color="#111827" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Doctor Card */}
                <View style={styles.doctorSection}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                            <Stethoscope size={32} color="#2FA561" />
                        </View>
                        {consultation.type === 'Video' && (
                            <View style={styles.typeIcon}>
                                <Video size={12} color="#fff" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.doctorName}>{consultation.doctorId.name}</Text>
                    <Text style={styles.specialtyText}>{consultation.doctorId.specialty} • {consultation.doctorId.experience}</Text>
                    <Text style={styles.hospitalText}>{consultation.doctorId.hospital}</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionCircle}>
                            <Phone size={20} color="#2FA561" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCircle}>
                            <MessageCircle size={20} color="#2FA561" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCircle}>
                            <Share2 size={20} color="#2FA561" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <View style={styles.dateBlock}>
                            <Text style={styles.dateLabel}>Date</Text>
                            <Text style={styles.dateValue}>{new Date(consultation.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                        </View>
                        <View style={styles.dividerVertical} />
                        <View style={styles.dateBlock}>
                            <Text style={styles.dateLabel}>Time</Text>
                            <Text style={styles.dateValue}>{consultation.time}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: consultation.status === 'Completed' ? '#10B981' : '#3B82F6' }]}>
                        <Text style={styles.statusBadgeText}>{consultation.status}</Text>
                    </View>
                </View>

                {/* Consultation Details */}
                <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                        <FileText size={18} color="#111827" />
                        <Text style={styles.sectionTitle}>Diagnosis & Notes</Text>
                    </View>
                    <View style={styles.detailCard}>
                        <Text style={styles.diagnosisTitle}>Diagnosis</Text>
                        <Text style={styles.detailText}>{consultation.diagnosis}</Text>
                        <View style={styles.innerDivider} />
                        <Text style={styles.diagnosisTitle}>Doctor's Notes</Text>
                        <Text style={styles.detailText}>{consultation.notes}</Text>
                    </View>
                </View>

                {/* Prescription */}
                {consultation.prescription && (
                    <View style={styles.detailSection}>
                        <View style={styles.sectionHeader}>
                            <Stethoscope size={18} color="#111827" />
                            <Text style={styles.sectionTitle}>Prescription</Text>
                            <TouchableOpacity style={styles.downloadLink}>
                                <Download size={14} color="#2FA561" />
                                <Text style={styles.downloadText}>Download PDF</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.prescriptionCard}>
                            {consultation.prescription.map((item: any, index: number) => (
                                <View key={index} style={[styles.prescriptionItem, index === consultation.prescription.length - 1 && { borderBottomWidth: 0 }]}>
                                    <View style={styles.prescLeft}>
                                        <Text style={styles.medName}>{item.medicine}</Text>
                                        <Text style={styles.medDosage}>{item.dosage} • {item.duration}</Text>
                                    </View>
                                    <View style={styles.takeBadge}>
                                        <Text style={styles.takeText}>Daily</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Feedback Section */}
                {consultation.status === 'Completed' && (
                    <View style={styles.feedbackSection}>
                        {!consultation.hasFeedback ? (
                            <View style={styles.feedbackPrompt}>
                                <Text style={styles.promptTitle}>How was your experience?</Text>
                                <Text style={styles.promptText}>Your feedback helps other patients find the best doctors.</Text>
                                <TouchableOpacity
                                    style={styles.reviewButton}
                                    onPress={() => executeAction('OPEN_DOCTOR_FEEDBACK', { consultationId: consultation._id, doctor: consultation.doctorId })}
                                >
                                    <Text style={styles.reviewButtonText}>Write a Review</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={[styles.feedbackPrompt, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
                                <View style={styles.feedbackGivenHeader}>
                                    <Text style={styles.promptTitle}>Your Feedback</Text>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} color="#FBBF24" fill="#FBBF24" />
                                        ))}
                                    </View>
                                </View>
                                <Text style={styles.promptText}>Thank you for providing feedback for this consultation!</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    moreButton: {
        padding: 8,
        marginRight: -12,
    },
    content: {
        paddingBottom: 40,
    },
    doctorSection: {
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 30,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 30,
    },
    placeholderAvatar: {
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    typeIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#2FA561',
        padding: 6,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#fff',
    },
    doctorName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 6,
    },
    specialtyText: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    hospitalText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    actionCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusCard: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 20,
    },
    dateBlock: {
        alignItems: 'center',
        gap: 4,
    },
    dateLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dateValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    dividerVertical: {
        width: 1,
        height: 30,
        backgroundColor: '#F3F4F6',
    },
    statusBadge: {
        alignSelf: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 14,
    },
    statusBadgeText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    detailSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    detailCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    diagnosisTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
    },
    innerDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 16,
    },
    downloadLink: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    downloadText: {
        fontSize: 13,
        color: '#2FA561',
        fontWeight: '600',
    },
    prescriptionCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    prescriptionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    prescLeft: {
        gap: 2,
    },
    medName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    medDosage: {
        fontSize: 13,
        color: '#6B7280',
    },
    takeBadge: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    takeText: {
        fontSize: 11,
        color: '#EA580C',
        fontWeight: '700',
    },
    feedbackSection: {
        paddingHorizontal: 20,
    },
    feedbackPrompt: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        textAlign: 'center',
    },
    promptTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    promptText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    reviewButton: {
        backgroundColor: '#2FA561',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 16,
    },
    reviewButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    feedbackGivenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 2,
    }
});
