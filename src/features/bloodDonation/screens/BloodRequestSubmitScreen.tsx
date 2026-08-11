import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { resetSubmitResult, submitBloodRequest } from '../../../redux/slices/bloodDonationSlice';
import { BloodUrgencyLevel } from '../../../services/api/bloodDonation.api';
import { AppDispatch, RootState } from '../../../redux/store';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS: { value: BloodUrgencyLevel; label: string; color: string }[] = [
    { value: 'NORMAL', label: 'Normal', color: '#3B82F6' },
    { value: 'HIGH', label: 'High', color: '#F59E0B' },
    { value: 'CRITICAL', label: 'Critical', color: '#EF4444' },
];

export default function BloodRequestSubmitScreen() {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const { submitLoading, submitResult, submitError } = useSelector((state: RootState) => state.bloodDonation);

    const [form, setForm] = useState({
        patientName: '',
        hospital: '',
        location: '',
        bloodGroup: '',
        unitsRequired: '',
        urgencyLevel: 'NORMAL' as BloodUrgencyLevel,
        contactNumber: '',
    });
    const [showPicker, setShowPicker] = useState(false);
    const [status, setStatus] = useState<{ visible: boolean; type: StatusType; title: string; message: string }>({
        visible: false,
        type: 'idle',
        title: '',
        message: '',
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };
    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const handleSubmit = async () => {
        if (!form.hospital || !form.location || !form.bloodGroup || !form.contactNumber) {
            showStatus('warning', 'Incomplete Form', 'Please fill in the hospital, location, blood group, and a contact number.');
            return;
        }

        try {
            showStatus('loading', 'Submitting Request', 'Finding nearby donors...');

            const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') {
                showStatus('warning', 'Location needed', 'Please enable location access so we can find donors near the hospital.');
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;

            const result = await dispatch(submitBloodRequest({
                patientName: form.patientName || undefined,
                hospital: form.hospital,
                location: form.location,
                latitude,
                longitude,
                bloodGroup: form.bloodGroup,
                unitsRequired: form.unitsRequired ? parseInt(form.unitsRequired, 10) : undefined,
                urgencyLevel: form.urgencyLevel,
                contactNumber: form.contactNumber,
            })).unwrap();

            hideStatus();
            dispatch(resetSubmitResult());
            navigation.replace('BloodRequestDetail', { requestId: result.requestId });
        } catch (error: any) {
            showStatus('error', 'Request Failed', error || 'Failed to submit your request. Please try again.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <StatusBar style="dark" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AppIcon name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Request Blood</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.helperText}>
                    We'll notify every eligible donor near the hospital right away. The first one who accepts will be in touch.
                </Text>

                <Text style={styles.label}>Blood Group Needed</Text>
                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowPicker(true)} disabled={submitLoading}>
                    <Text style={[styles.pickerValue, !form.bloodGroup && styles.placeholder]}>
                        {form.bloodGroup || 'Select blood group'}
                    </Text>
                    <AppIcon name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>

                <Text style={styles.label}>Hospital</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Hospital name"
                    value={form.hospital}
                    onChangeText={(val) => setForm({ ...form, hospital: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>Location</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Area / address"
                    value={form.location}
                    onChangeText={(val) => setForm({ ...form, location: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>Patient Name (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Patient name"
                    value={form.patientName}
                    onChangeText={(val) => setForm({ ...form, patientName: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>Units Required (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                    value={form.unitsRequired}
                    onChangeText={(val) => setForm({ ...form, unitsRequired: val.replace(/[^0-9]/g, '') })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>Urgency</Text>
                <View style={styles.urgencyRow}>
                    {URGENCY_LEVELS.map((level) => (
                        <TouchableOpacity
                            key={level.value}
                            style={[
                                styles.urgencyChip,
                                form.urgencyLevel === level.value && { backgroundColor: level.color, borderColor: level.color },
                            ]}
                            onPress={() => setForm({ ...form, urgencyLevel: level.value })}
                            disabled={submitLoading}
                        >
                            <Text style={[styles.urgencyChipText, form.urgencyLevel === level.value && styles.urgencyChipTextActive]}>
                                {level.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Contact Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                    value={form.contactNumber}
                    onChangeText={(val) => setForm({ ...form, contactNumber: val.replace(/[^0-9]/g, '') })}
                    editable={!submitLoading}
                    maxLength={10}
                />

                <TouchableOpacity
                    style={[styles.submitButton, submitLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitLoading}
                >
                    {submitLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Notify Nearby Donors</Text>
                    )}
                </TouchableOpacity>
            </View>

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
            />

            <Modal visible={showPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Blood Group</Text>
                        <View style={styles.groupGrid}>
                            {BLOOD_GROUPS.map((group) => (
                                <TouchableOpacity
                                    key={group}
                                    style={[styles.groupItem, form.bloodGroup === group && styles.groupItemActive]}
                                    onPress={() => {
                                        setForm({ ...form, bloodGroup: group });
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text style={[styles.groupText, form.bloodGroup === group && styles.groupTextActive]}>
                                        {group}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowPicker(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    form: { padding: 24 },
    helperText: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        marginBottom: 24,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    pickerValue: { fontSize: 16, color: '#111827' },
    placeholder: { color: '#9CA3AF' },
    urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    urgencyChip: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    urgencyChipText: { fontSize: 13, fontWeight: '700', color: '#4B5563' },
    urgencyChipTextActive: { color: '#FFFFFF' },
    submitButton: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonDisabled: { opacity: 0.6 },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 20, textAlign: 'center' },
    groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    groupItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupItemActive: { backgroundColor: '#FEF2F2', borderColor: '#EF4444' },
    groupText: { fontSize: 16, fontWeight: '700', color: '#4B5563' },
    groupTextActive: { color: '#EF4444' },
    closeButton: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
});
