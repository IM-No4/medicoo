import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from '../../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import { checkEligibility } from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch } from '../../../redux/store';
import { getProfileDetails } from '../../../services/api';
import { formatDateForApi, formatDateForDisplay } from '../../../utils/formatters';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Modal } from '../../../components/ThemedModal';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodEligibilityFormScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [form, setForm] = useState({
        age: '',
        weight: '',
        bloodGroup: '',
        lastDonationDate: '',
        hasHealthIssues: false,
        isMedicated: false,
        hasRecentTattooOrPiercing: false,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoadingProfile(true);
                const profile = await getProfileDetails();
                setForm(prev => ({
                    ...prev,
                    age: profile.age ? String(profile.age) : prev.age,
                    weight: profile.weight ? String(profile.weight) : prev.weight,
                    bloodGroup: profile.bloodGroup || prev.bloodGroup,
                    lastDonationDate: profile.lastDonationDate || prev.lastDonationDate,
                }));
            } catch (error) {
                console.error('Failed to fetch profile for pre-population', error);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchUserData();
    }, []);

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
        if (!form.age || !form.weight || !form.bloodGroup) {
            showStatus('warning', t('missing_information'), t('please_fill_in_age_weight_and_blood_gr'));
            return;
        }

        const age = parseInt(form.age);
        const weight = parseInt(form.weight);

        if (isNaN(age) || isNaN(weight)) {
            showStatus('error', t('invalid_input'), t('please_enter_valid_numbers_for_age_and'));
            return;
        }

        try {
            setSubmitting(true);
            showStatus('loading', t('testing_eligibility'), t('please_wait_while_we_check_your_criter'));

            const result = await dispatch(checkEligibility({
                age,
                weight,
                bloodGroup: form.bloodGroup,
                lastDonationDate: form.lastDonationDate || undefined,
                hasHealthIssues: form.hasHealthIssues,
                isMedicated: form.isMedicated,
                hasRecentTattooOrPiercing: form.hasRecentTattooOrPiercing,
            })).unwrap();

            if (result.isEligible) {
                showStatus(
                    'success',
                    t('congratulations'),
                    t('you_are_eligible_to_donate_blood_would'),
                    () => {
                        hideStatus();
                        executeAction('OPEN_BLOOD_APPLICATION');
                    },
                    'Apply Now'
                );
            } else {
                showStatus(
                    'info',
                    t('eligibility_notice'),
                    result.reason || "We're sorry, you don't meet the current eligibility criteria for blood donation.",
                    () => {
                        hideStatus();
                        executeAction('GO_BACK');
                    },
                    'OK'
                );
            }
        } catch (error: any) {
            console.error('Eligibility check failed:', error);
            showStatus('error', t('check_failed'), error || 'Something went wrong. Please try again later.');
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
                <Text style={styles.headerTitle}>{t('eligibility_test')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loadingProfile ? (
                <View style={[styles.form, { paddingVertical: 100, alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color="#EF4444" />
                    <Text style={{ marginTop: 12, color: theme.textSecondary }}>{t('fetching_your_profile')}</Text>
                </View>
            ) : (
                <View style={styles.form}>
                    <Text style={styles.label}>{t('age_years')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('enter_your_age')}
                        keyboardType="numeric"
                        value={form.age}
                        onChangeText={(val) => setForm({ ...form, age: val })}
                    />

                    <Text style={styles.label}>{t('weight_kg')}</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={t('enter_your_weight')}
                        keyboardType="numeric"
                        value={form.weight}
                        onChangeText={(val) => setForm({ ...form, weight: val })}
                    />

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

                    <Text style={styles.label}>{t('last_donation_date_optional')}</Text>
                    <TouchableOpacity
                        style={styles.pickerTrigger}
                        onPress={() => setShowDatePicker(true)}
                        disabled={submitting}
                    >
                        <Text style={[styles.pickerValue, !form.lastDonationDate && styles.placeholder]}>
                            {form.lastDonationDate ? formatDateForDisplay(form.lastDonationDate) : 'Select date if you have donated before'}
                        </Text>
                        <AppIcon name="calendar" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.switchRow}>
                        <View style={styles.switchText}>
                            <Text style={styles.switchLabel}>{t('do_you_have_any_chronic_health_issues')}</Text>
                            <Text style={styles.switchSubLabel}>{t('e_g_heart_disease_diabetes_etc')}</Text>
                        </View>
                        <Switch
                            value={form.hasHealthIssues}
                            onValueChange={(val) => setForm({ ...form, hasHealthIssues: val })}
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={styles.switchText}>
                            <Text style={styles.switchLabel}>{t('are_you_currently_under_medication')}</Text>
                            <Text style={styles.switchSubLabel}>{t('for_any_underlying_condition')}</Text>
                        </View>
                        <Switch
                            value={form.isMedicated}
                            onValueChange={(val) => setForm({ ...form, isMedicated: val })}
                        />
                    </View>

                    <View style={[styles.switchRow, { marginBottom: 8 }]}>
                        <View style={styles.switchText}>
                            <Text style={styles.switchLabel}>{t('recent_tattoos_or_piercings')}</Text>
                            <Text style={styles.switchSubLabel}>{t('within_the_last_6_months')}</Text>
                        </View>
                        <Switch
                            value={form.hasRecentTattooOrPiercing}
                            onValueChange={(val) => setForm({ ...form, hasRecentTattooOrPiercing: val })}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, (submitting || loadingProfile) && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={submitting || loadingProfile}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>{t('see_result')}</Text>
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

            <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
                <View style={styles.sheetBackdrop}>
                    <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={() => setShowPicker(false)} />
                    <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.handleBar} />
                        <Text style={styles.sheetTitle}>{t('select_blood_group')}</Text>
                        <View style={styles.groupList}>
                            {BLOOD_GROUPS.map((group, index) => (
                                <TouchableOpacity
                                    key={group}
                                    style={[styles.groupRow, index === BLOOD_GROUPS.length - 1 && styles.groupRowLast]}
                                    onPress={() => {
                                        setForm({ ...form, bloodGroup: group });
                                        setShowPicker(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.groupRowText, form.bloodGroup === group && styles.groupRowTextActive]}>
                                        {group}
                                    </Text>
                                    {form.bloodGroup === group && (
                                        <View style={styles.checkCircle}>
                                            <AppIcon name="check" size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Android's native picker is already its own OS-level dialog the
                moment showDatePicker flips true, regardless of where it sits
                in the tree. iOS's inline "spinner" style has no such dialog
                chrome of its own - rendering it bare (as before) placed it at
                the bottom of the ScrollView, well below the field that
                triggered it, which read as "nothing happened". Wrapping it
                in the same bottom sheet used for blood group fixes that. */}
            {Platform.OS === 'ios' ? (
                <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
                    <View style={styles.sheetBackdrop}>
                        <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
                        <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 20 }]}>
                            <View style={styles.handleBar} />
                            <View style={styles.sheetHeaderRow}>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.sheetCancelText}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <Text style={styles.sheetHeaderTitle}>{t('last_donation_date')}</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                    <Text style={styles.sheetDoneText}>{t('done')}</Text>
                                </TouchableOpacity>
                            </View>
                            <DateTimePicker
                                value={form.lastDonationDate ? new Date(form.lastDonationDate) : new Date()}
                                mode="date"
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) {
                                        setForm(prev => ({ ...prev, lastDonationDate: formatDateForApi(selectedDate) }));
                                    }
                                }}
                                maximumDate={new Date()}
                            />
                        </View>
                    </View>
                </Modal>
            ) : (
                showDatePicker && (
                    <DateTimePicker
                        value={form.lastDonationDate ? new Date(form.lastDonationDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(false);
                            if (event.type === 'set' && selectedDate) {
                                setForm(prev => ({ ...prev, lastDonationDate: formatDateForApi(selectedDate) }));
                            }
                        }}
                        maximumDate={new Date()}
                    />
                )
            )}
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
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    switchText: {
        flex: 1,
        paddingRight: 16,
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: c.text,
    },
    switchSubLabel: {
        fontSize: 12,
        color: c.textSecondary,
        marginTop: 2,
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
    submitButton: {
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 14,
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
    sheetBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    backdropTouchable: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        backgroundColor: c.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    sheetHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sheetHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
    },
    sheetCancelText: {
        fontSize: 15,
        color: c.textSecondary,
        fontWeight: '500',
    },
    sheetDoneText: {
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '700',
    },
    groupList: {
        marginBottom: 4,
    },
    groupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    groupRowLast: {
        borderBottomWidth: 0,
    },
    groupRowText: {
        fontSize: 16,
        fontWeight: '500',
        color: c.text,
    },
    groupRowTextActive: {
        fontWeight: '700',
        color: '#EF4444',
    },
    checkCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
