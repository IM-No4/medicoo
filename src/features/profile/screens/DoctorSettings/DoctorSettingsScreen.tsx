import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { CalendarCheck, ChevronLeft, ChevronRight, Eye, FileText, Moon, Sun, UserCog } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { getDoctorProfile, updateDoctorSettings } from '../../../../services/api/user.api';

export default function DoctorSettingsScreen() {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // State
    const [isOnline, setIsOnline] = useState(false);
    const [fees, setFees] = useState({
        chat: { fee: 0, isEnabled: false },
        voice: { fee: 0, isEnabled: false },
        video: { fee: 0, isEnabled: false },
    });
    const [currency, setCurrency] = useState('INR');
    const [profileData, setProfileData] = useState<any>(null);
    const [initialSettings, setInitialSettings] = useState<any>(null);

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

    useFocusEffect(
        useCallback(() => {
            fetchSettings();
        }, [])
    );

    const hasChanges = useCallback(() => {
        if (!initialSettings) return false;

        const currentData = { isOnline, fees, currency };
        const initialData = {
            isOnline: initialSettings.isOnline,
            fees: initialSettings.fees,
            currency: initialSettings.currency
        };

        return JSON.stringify(currentData) !== JSON.stringify(initialData);
    }, [isOnline, fees, currency, initialSettings]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const profile = await getDoctorProfile();
            if (profile) {
                // Normalize data to handle Mongoose response structure
                // effectively merging _doc and root fields, and extracting nested status
                const data = {
                    ...profile,
                    ...(profile._doc || {}), // Flatten _doc if present
                };

                setProfileData(data);

                // Extract Online Status
                const practiceStatus = profile.practiceStatus || data.practiceStatus || {};
                const onlineStatus = practiceStatus.isOnline ?? false;
                setIsOnline(onlineStatus);

                // Extract Fees
                // Check approvedProfile first (live data), then root/doc (draft/current)
                const profileFees = profile.approvedProfile?.consultationFees || data.consultationFees || {};

                const loadedFees = {
                    chat: profileFees.chat || { fee: 0, isEnabled: false },
                    voice: profileFees.voice || { fee: 0, isEnabled: false },
                    video: profileFees.video || { fee: 0, isEnabled: false },
                };
                setFees(loadedFees);

                const loadedCurrency = profileFees.currency || 'INR';
                setCurrency(loadedCurrency);

                setInitialSettings({
                    isOnline: onlineStatus,
                    fees: loadedFees,
                    currency: loadedCurrency
                });
            }
        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            // Construct payload
            const payload = {
                isOnline,
                consultationFees: {
                    currency,
                    ...fees
                }
            };

            await updateDoctorSettings(payload);
            showStatus('success', 'Settings Saved', 'Your practice availability and consultation fees have been updated successfully.');
            setInitialSettings({ isOnline, fees, currency });
        } catch {
            showStatus('error', 'Update Failed', 'We couldn\'t save your settings. Please check your internet connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    const toggleFeeEnabled = (type: 'chat' | 'voice' | 'video') => {
        setFees(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                isEnabled: !prev[type].isEnabled
            }
        }));
    };

    const updateFeeAmount = (type: 'chat' | 'voice' | 'video', amount: string) => {
        const num = parseInt(amount) || 0;
        setFees(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                fee: num
            }
        }));
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#2FA561" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Doctor Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={{ paddingBottom: 100 }}>

                        {/* Status Card */}
                        <View style={[styles.card, isOnline ? styles.onlineCard : styles.offlineCard]}>
                            <View style={styles.statusRow}>
                                <View style={styles.statusInfo}>
                                    <View style={styles.statusHeader}>
                                        {isOnline ? <Sun size={24} color="#059669" /> : <Moon size={24} color="#6B7280" />}
                                        <Text style={[styles.statusTitle, isOnline ? { color: '#059669' } : { color: '#374151' }]}>
                                            {isOnline ? 'You are Online' : 'You are Offline'}
                                        </Text>
                                    </View>
                                    <Text style={styles.statusDesc}>
                                        {isOnline
                                            ? 'Patients can currently request appointments with you.'
                                            : 'You are not visible for new immediate appointments.'}
                                    </Text>
                                </View>
                                <Switch
                                    value={isOnline}
                                    onValueChange={setIsOnline}
                                    trackColor={{ false: '#D1D5DB', true: '#A7F3D0' }}
                                    thumbColor={isOnline ? '#2FA561' : '#F3F4F6'}
                                />
                            </View>
                        </View>

                        {/* Consultation Fees */}
                        <Text style={styles.sectionTitle}>Consultation Fees</Text>
                        <View style={styles.card}>
                            {['video', 'voice', 'chat'].map((type) => {
                                const t = type as 'video' | 'voice' | 'chat';
                                const item = fees[t];

                                return (
                                    <View key={type} style={styles.feeRow}>
                                        <View style={styles.feeInfo}>
                                            <Text style={styles.feeLabel}>
                                                {type.charAt(0).toUpperCase() + type.slice(1)} Consultation
                                            </Text>
                                            <Text style={styles.feeSub}>Set your fee for {type} calls</Text>
                                        </View>

                                        <View style={styles.feeControls}>
                                            {item.isEnabled && (
                                                <View style={styles.inputWrap}>
                                                    <Text style={styles.currency}>₹</Text>
                                                    <TextInput
                                                        style={styles.feeInput}
                                                        value={item.fee.toString()}
                                                        onChangeText={(v) => updateFeeAmount(t, v)}
                                                        keyboardType="numeric"
                                                        maxLength={5}
                                                    />
                                                </View>
                                            )}
                                            <Switch
                                                value={item.isEnabled}
                                                onValueChange={() => toggleFeeEnabled(t)}
                                                trackColor={{ false: '#E5E7EB', true: '#BBF7D0' }}
                                                thumbColor={item.isEnabled ? '#2FA561' : '#fff'}
                                            />
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Managing Profile */}
                        <Text style={styles.sectionTitle}>Profile Management</Text>
                        <View style={styles.card}>
                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => executeAction('OPEN_DOCTOR_ONBOARDING')}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.iconBox}>
                                        <UserCog size={20} color="#4B5563" />
                                    </View>
                                    <Text style={styles.actionText}>Edit Profile Details</Text>
                                </View>
                                <ChevronRight size={20} color="#D1D5DB" />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => executeAction('OPEN_DOCTOR_DETAIL', { doctor: profileData, preview: true })}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.iconBox}>
                                        <Eye size={20} color="#4B5563" />
                                    </View>
                                    <Text style={styles.actionText}>Preview Public Profile</Text>
                                </View>
                                <ChevronRight size={20} color="#D1D5DB" />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => executeAction('OPEN_MANAGE_APPOINTMENTS')}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.iconBox}>
                                        <CalendarCheck size={20} color="#4B5563" />
                                    </View>
                                    <Text style={styles.actionText}>Manage Appointments</Text>
                                </View>
                                <ChevronRight size={20} color="#D1D5DB" />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity
                                style={styles.actionRow}
                                onPress={() => executeAction('OPEN_MANAGE_AVAILABILITY')}
                            >
                                <View style={styles.actionLeft}>
                                    <View style={styles.iconBox}>
                                        <FileText size={20} color="#4B5563" />
                                    </View>
                                    <Text style={styles.actionText}>Manage Availability</Text>
                                </View>
                                <ChevronRight size={20} color="#D1D5DB" />
                            </TouchableOpacity>
                        </View>
                    </View>


                </ScrollView>

                {/* Footer Save Button */}
                {hasChanges() && (
                    <View style={[styles.footer, { paddingBottom: insets.bottom - 24 }]}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

            </KeyboardAvoidingView>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </View >
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    backButton: { padding: 8, marginLeft: -8 },
    backText: { fontSize: 16, color: '#2FA561', fontWeight: '500' },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

    content: {
        padding: 20,
        paddingBottom: 100
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden'
    },

    // Status Card
    onlineCard: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
    offlineCard: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16
    },
    statusInfo: { flex: 1, paddingRight: 16 },
    statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    statusTitle: { fontSize: 16, fontWeight: '700' },
    statusDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },

    // Sections
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },

    // Fees
    feeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    feeInfo: { flex: 1 },
    feeLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
    feeSub: { fontSize: 12, color: '#9CA3AF' },
    feeControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 40,
        width: 100
    },
    currency: { fontSize: 14, color: '#6B7280', marginRight: 4 },
    feeInput: {
        flex: 1,
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
        paddingVertical: 0, // Fix for Android clipping
        height: '100%'
    },

    // Profile Actions
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16
    },
    actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center'
    },
    actionText: { fontSize: 15, fontWeight: '500', color: '#374151' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 64 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6'
    },
    saveButton: {
        backgroundColor: '#2FA561',
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2FA561',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' }
});
