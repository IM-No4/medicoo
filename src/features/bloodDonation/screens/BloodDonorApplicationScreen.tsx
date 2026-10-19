import { StatusBar } from '../../../components/ThemedStatusBar';
import * as Location from 'expo-location';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { applyAsDonor } from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch } from '../../../redux/store';
import { getProfileDetails } from '../../../services/api';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Modal } from '../../../components/ThemedModal';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorApplicationScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [form, setForm] = useState({
        bloodGroup: '',
        address: '',
        availableForEmergency: true,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingProfile(true);
                const profile = await getProfileDetails();
                setForm(prev => ({
                    ...prev,
                    address: profile.address || prev.address,
                    bloodGroup: profile.bloodGroup || prev.bloodGroup || '',
                }));
            } catch (error) {
                console.error('Failed to fetch profile for pre-population', error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserData();
    }, []);

    const [showPicker, setShowPicker] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const handleSubmit = async () => {
        if (!form.bloodGroup || !form.address) {
            showStatus('warning', t('incomplete_form'), t('please_select_your_blood_group_and_pro'));
            return;
        }

        try {
            setSubmitting(true);
            showStatus('loading', t('submitting_application'), t('please_wait_while_we_process_your_dono'));

            // Real device location is required here, not a placeholder -
            // it's what nearby blood requests are matched against.
            const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
            if (permissionStatus !== 'granted') {
                showStatus('warning', t('location_needed'), t('please_enable_location_access_so_nearb'));
                setSubmitting(false);
                return;
            }
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = loc.coords;

            const result = await dispatch(applyAsDonor({
                bloodGroup: form.bloodGroup,
                location: {
                    latitude,
                    longitude,
                    address: form.address,
                },
                availableForEmergency: form.availableForEmergency,
            })).unwrap();

            showStatus(
                'success',
                t('application_successful'),
                `Congratulations! You are now a registered blood donor. We've awarded you ${result.points || 500} points for joining our mission to save lives!`,
                () => {
                    hideStatus();
                    executeAction('OPEN_BLOOD_DONATION');
                },
                'View Dashboard'
            );
        } catch (error: any) {
            console.error('Donor application failed:', error);
            showStatus('error', t('application_failed'), error || 'Failed to apply as donor. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('donor_application')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loadingProfile ? (
                <View style={[styles.form, { paddingVertical: 100, alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text style={{ marginTop: 12, color: theme.textSecondary }}>{t('fetching_your_profile')}</Text>
                </View>
            ) : (
                <View style={styles.form}>
                    <Text style={styles.label}>{t('select_blood_group')}</Text>
                    <TouchableOpacity
                        style={styles.pickerTrigger}
                        onPress={() => setShowPicker(true)}
                        disabled={submitting}
                    >
                        <Text style={[styles.pickerValue, !form.bloodGroup && styles.placeholder]}>
                            {form.bloodGroup || 'Select your blood group'}
                        </Text>
                        <AppIcon name="chevron-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <Text style={styles.label}>{t('residential_address')}</Text>
                    <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder={t('enter_your_full_address')}
                        multiline
                        numberOfLines={4}
                        value={form.address}
                        onChangeText={(val) => setForm({ ...form, address: val })}
                        editable={!submitting}
                    />

                    <TouchableOpacity
                        style={styles.checkboxRow}
                        onPress={() => setForm({ ...form, availableForEmergency: !form.availableForEmergency })}
                        disabled={submitting}
                    >
                        <View style={[styles.checkbox, form.availableForEmergency && styles.checkboxActive]}>
                            {form.availableForEmergency && <AppIcon name="check" size={16} color="#FFFFFF" />}
                        </View>
                        <View style={styles.checkboxText}>
                            <Text style={styles.checkboxLabel}>{t('available_for_emergencies')}</Text>
                            <Text style={styles.checkboxSubLabel}>{t('we_will_notify_you_when_there_s_an_urg')}</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('submit_application')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
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
    container: {
        flex: 1,
        backgroundColor: c.card,
    },
    scrollContent: {
        paddingBottom: 40,
    },
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
    },
    form: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: c.text,
        marginBottom: 8,
    },
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
    pickerValue: {
        fontSize: 16,
        color: c.text,
    },
    placeholder: {
        color: c.textMuted,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 32,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
    checkboxActive: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    checkboxText: {
        flex: 1,
    },
    checkboxLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: c.text,
    },
    checkboxSubLabel: {
        fontSize: 13,
        color: c.textSecondary,
        marginTop: 2,
        lineHeight: 18,
    },
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
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: c.card,
        borderRadius: 24,
        padding: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: c.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    groupGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
    },
    groupItem: {
        width: '22%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    groupItemActive: {
        backgroundColor: c.errorBg,
        borderColor: '#EF4444',
    },
    groupText: {
        fontSize: 16,
        fontWeight: '700',
        color: c.textSecondary,
    },
    groupTextActive: {
        color: '#EF4444',
    },
    closeButton: {
        marginTop: 24,
        paddingVertical: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3B82F6',
    },
});
