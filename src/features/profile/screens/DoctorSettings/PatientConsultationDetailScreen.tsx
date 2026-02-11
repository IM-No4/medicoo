import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, ChevronLeft, Clock, FileText, MapPin, MessageSquare, Paperclip, Phone, Pill, Stethoscope, Video } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';

export default function PatientConsultationDetailScreen() {
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();
    const { appointment } = route.params || {};

    // Mock data if not passed or to supplement
    const patientData = {
        name: appointment?.patientName || 'John Doe',
        age: 28,
        gender: 'Male',
        weight: '72 kg',
        height: '178 cm',
        bloodType: 'O+',
        image: appointment?.image || null,
        symptoms: ['Severe Headache', 'Nausea', 'Light sensitivity'],
        history: 'None',
        allergies: 'Peanuts',
        reason: appointment?.reason || 'Severe headache and nausea for 2 days.',
    };

    const consultationData = {
        id: appointment?.id || '123',
        status: appointment?.status || 'Upcoming', // Upcoming, Completed, In Progress
        date: appointment?.date || '2026-02-06',
        time: appointment?.time || '10:00 AM',
        type: appointment?.type || 'video',
    };

    // State for "After Consultation" details (Outcome)
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [notes, setNotes] = useState('');

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video size={16} color="#4B5563" />;
            case 'voice': return <Phone size={16} color="#4B5563" />;
            case 'chat': return <MessageSquare size={16} color="#4B5563" />;
            case 'clinic': return <MapPin size={16} color="#4B5563" />;
            default: return <Video size={16} color="#4B5563" />;
        }
    };

    const renderVitalsCard = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Patient Vitals</Text>
            <View style={styles.vitalsGrid}>
                <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Age</Text>
                    <Text style={styles.vitalValue}>{patientData.age} yrs</Text>
                </View>
                <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Gender</Text>
                    <Text style={styles.vitalValue}>{patientData.gender}</Text>
                </View>
                <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Weight</Text>
                    <Text style={styles.vitalValue}>{patientData.weight}</Text>
                </View>
                <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Height</Text>
                    <Text style={styles.vitalValue}>{patientData.height}</Text>
                </View>
                <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Blood Type</Text>
                    <Text style={styles.vitalValue}>{patientData.bloodType}</Text>
                </View>
            </View>
        </View>
    );

    const renderConsultationContext = () => (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Consultation Details</Text>

            <View style={styles.contextRow}>
                <View style={styles.iconLabel}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.contextText}>{consultationData.date}</Text>
                </View>
                <View style={styles.iconLabel}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.contextText}>{consultationData.time}</Text>
                </View>
                <View style={styles.iconLabel}>
                    {getTypeIcon(consultationData.type)}
                    <Text style={[styles.contextText, { textTransform: 'capitalize' }]}>{consultationData.type} Consultation</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reason for Visit</Text>
                <Text style={styles.sectionValue}>{patientData.reason}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Reported Symptoms</Text>
                <View style={styles.chipContainer}>
                    {patientData.symptoms.map((s, i) => (
                        <View key={i} style={styles.chip}>
                            <Text style={styles.chipText}>{s}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowSection}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>Allergies</Text>
                    <Text style={[styles.sectionValue, { color: '#EF4444' }]}>{patientData.allergies}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.sectionLabel}>Medical History</Text>
                    <Text style={styles.sectionValue}>{patientData.history}</Text>
                </View>
            </View>
        </View>
    );

    const renderAfterConsultation = () => (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>After Consultation details (Outcome)</Text>
                {/* Only editable if not completed? Or always editable for now */}
                {consultationData.status !== 'Completed' && (
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Editable</Text>
                    </View>
                )}
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <Stethoscope size={16} color="#4B5563" />
                    <Text style={styles.inputLabel}>Diagnosis</Text>
                </View>
                <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder="Enter diagnosis..."
                    value={diagnosis}
                    onChangeText={setDiagnosis}
                />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <Pill size={16} color="#4B5563" />
                    <Text style={styles.inputLabel}>Prescription</Text>
                </View>
                <TouchableOpacity style={styles.uploadBox}>
                    <Text style={styles.uploadText}>+ Add Medicines or Upload Rx</Text>
                </TouchableOpacity>
                <TextInput
                    style={[styles.textArea, { marginTop: 8 }]}
                    multiline
                    placeholder="Prescription notes..."
                    value={prescription}
                    onChangeText={setPrescription}
                />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <FileText size={16} color="#4B5563" />
                    <Text style={styles.inputLabel}>Clinical Notes (Private)</Text>
                </View>
                <TextInput
                    style={styles.textArea}
                    multiline
                    placeholder="Private notes for record..."
                    value={notes}
                    onChangeText={setNotes}
                />
            </View>

            <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                    <Paperclip size={16} color="#4B5563" />
                    <Text style={styles.inputLabel}>Attachments / Lab Orders</Text>
                </View>
                <TouchableOpacity style={styles.attachmentBtn}>
                    <Text style={styles.attachmentText}>Add Lab Test Order</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Patient Consultation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Patient Header */}
                <View style={styles.patientHeader}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{patientData.name.charAt(0)}</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.patientNameLarge}>{patientData.name}</Text>
                        <Text style={styles.patientId}>Patient ID: #PAT-{Math.floor(Math.random() * 10000)}</Text>
                    </View>
                </View>

                {renderVitalsCard()}
                {renderConsultationContext()}
                {renderAfterConsultation()}

                {/* Bottom Actions */}
                <View style={{ height: 40 }} />
            </ScrollView>

            {consultationData.status === 'Upcoming' && (
                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => {
                            if (consultationData.type === 'chat') {
                                executeAction('OPEN_DOCTOR_CHAT', { appointment });
                            } else {
                                executeAction('OPEN_DOCTOR_CALL', {
                                    appointment,
                                    type: consultationData.type === 'voice' ? 'voice' : 'video'
                                });
                            }
                        }}
                    >
                        <Text style={styles.buttonText}>Start {consultationData.type === 'chat' ? 'Chat' : 'Consultation'}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    content: { padding: 20, paddingBottom: 100 },

    patientHeader: {
        alignItems: 'center',
        marginBottom: 24
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E7FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    avatarTextLarge: { fontSize: 32, fontWeight: '700', color: '#4F46E5' },
    patientNameLarge: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
    patientId: { fontSize: 13, color: '#6B7280', marginTop: 4 },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16, flex: 1 },

    // Vitals
    vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    vitalItem: {
        flex: 1,
        minWidth: '28%',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 10,
        alignItems: 'center'
    },
    vitalLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
    vitalValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

    // Context
    contextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    iconLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contextText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },
    section: { marginBottom: 12 },
    sectionLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
    sectionValue: { fontSize: 14, color: '#374151', lineHeight: 20 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    chipText: { fontSize: 12, color: '#B45309', fontWeight: '500' },
    rowSection: { flexDirection: 'row', gap: 16 },

    // Outcome
    statusBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    statusText: { fontSize: 10, color: '#059669', fontWeight: '700' },
    inputGroup: { marginBottom: 16 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
    textArea: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 14
    },
    uploadBox: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB'
    },
    uploadText: { fontSize: 13, color: '#2FA561', fontWeight: '600' },
    attachmentBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        alignSelf: 'flex-start'
    },
    attachmentText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    primaryButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#2FA561',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});
