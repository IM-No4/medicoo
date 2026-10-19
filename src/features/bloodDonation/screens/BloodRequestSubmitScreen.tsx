import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../../components/ThemedStatusBar';
import * as Location from 'expo-location';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { resetSubmitResult, submitBloodRequest } from '../../../redux/slices/bloodDonationSlice';
import { BloodUrgencyLevel } from '../../../services/api/bloodDonation.api';
import { AppDispatch, RootState } from '../../../redux/store';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Modal } from '../../../components/ThemedModal';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS: { value: BloodUrgencyLevel; label: string; color: string }[] = [
    { value: 'NORMAL', label: 'Normal', color: '#3B82F6' },
    { value: 'HIGH', label: 'High', color: '#F59E0B' },
    { value: 'CRITICAL', label: 'Critical', color: '#EF4444' },
];

export default function BloodRequestSubmitScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
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
            showStatus('warning', t('incomplete_form'), t('please_fill_in_the_hospital_location_b'));
            return;
        }

        try {
            showStatus('loading', t('submitting_request'), t('finding_nearby_donors'));

            const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') {
                showStatus('warning', t('location_needed'), t('please_enable_location_access_so_we_ca'));
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
            showStatus('error', t('request_failed'), error || 'Failed to submit your request. Please try again.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('request_blood')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.form}>
                <Text style={styles.helperText}>
                    {t('we_ll_notify_every_eligible_donor_near')}
                </Text>

                <Text style={styles.label}>{t('blood_group_needed')}</Text>
                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setShowPicker(true)} disabled={submitLoading}>
                    <Text style={[styles.pickerValue, !form.bloodGroup && styles.placeholder]}>
                        {form.bloodGroup || 'Select blood group'}
                    </Text>
                    <AppIcon name="chevron-down" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <Text style={styles.label}>{t('hospital')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('hospital_name')}
                    value={form.hospital}
                    onChangeText={(val) => setForm({ ...form, hospital: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>{t('location')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('area_address')}
                    value={form.location}
                    onChangeText={(val) => setForm({ ...form, location: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>{t('patient_name_optional')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('patient_name_2')}
                    value={form.patientName}
                    onChangeText={(val) => setForm({ ...form, patientName: val })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>{t('units_required_optional')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 2"
                    keyboardType="numeric"
                    value={form.unitsRequired}
                    onChangeText={(val) => setForm({ ...form, unitsRequired: val.replace(/[^0-9]/g, '') })}
                    editable={!submitLoading}
                />

                <Text style={styles.label}>{t('urgency')}</Text>
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

                <Text style={styles.label}>{t('contact_number')}</Text>
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
                        <Text style={styles.submitButtonText}>{t('notify_nearby_donors')}</Text>
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
                        <Text style={styles.modalTitle}>{t('select_blood_group')}</Text>
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
                            <Text style={styles.closeButtonText}>{t('close')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.card },
    scrollContent: { paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
    form: { padding: 24 },
    helperText: { fontSize: 13, color: c.textSecondary, lineHeight: 19, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 8 },
    input: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: c.text,
        marginBottom: 24,
    },
    pickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    pickerValue: { fontSize: 16, color: c.text },
    placeholder: { color: c.textMuted },
    urgencyRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    urgencyChip: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        backgroundColor: c.cardSecondary,
    },
    urgencyChipText: { fontSize: 13, fontWeight: '700', color: c.textSecondary },
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
    modalContent: { backgroundColor: c.card, borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: c.text, marginBottom: 20, textAlign: 'center' },
    groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    groupItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupItemActive: { backgroundColor: c.errorBg, borderColor: '#EF4444' },
    groupText: { fontSize: 16, fontWeight: '700', color: c.textSecondary },
    groupTextActive: { color: '#EF4444' },
    closeButton: { marginTop: 24, paddingVertical: 12, alignItems: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
});
