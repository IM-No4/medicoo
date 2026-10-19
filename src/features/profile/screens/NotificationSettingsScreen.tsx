import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
    BellOff,
    Calendar,
    ChevronLeft,
    Gift,
    Package,
    Pill,
    Users,
    Wallet,
} from 'lucide-react-native';
import React, { useCallback, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StatusModal, { StatusType } from '../../../components/modals/StatusModal';
import {
    CustomerNotificationSettings,
    getProfileDetails,
    updateNotificationSettings,
} from '../../../services/api';
import {
    getNotificationPermissionStatus,
    NotificationPermissionStatus,
    requestNotificationPermission,
} from '../../../utils/deviceUtils';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

const DEFAULT_NOTIFICATION_SETTINGS: CustomerNotificationSettings = {
    orderUpdates: true,
    appointments: true,
    payments: true,
    medicineReminders: true,
    promotions: true,
    community: true,
};

const NOTIFICATION_ITEMS: {
    key: keyof CustomerNotificationSettings;
    icon: React.ComponentType<any>;
    title: string;
    sub: string;
}[] = [
    { key: 'orderUpdates', icon: Package, title: 'Order Updates', sub: 'Order placed, packed, shipped, and delivered' },
    { key: 'appointments', icon: Calendar, title: 'Appointments & Consultations', sub: 'Approvals, reminders, and chat messages with your doctor' },
    { key: 'payments', icon: Wallet, title: 'Payments', sub: 'Payment success and failure alerts' },
    { key: 'medicineReminders', icon: Pill, title: 'Medicine Reminders', sub: 'Reminders to take your scheduled medicines' },
    { key: 'promotions', icon: Gift, title: 'Offers & Promotions', sub: 'Discounts and special offers from Medicoo' },
    { key: 'community', icon: Users, title: 'Community', sub: 'Blood requests, family and friend requests' },
];

export default function NotificationSettingsScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<CustomerNotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [permission, setPermission] = useState<NotificationPermissionStatus>('not-determined');
    const [requestingPermission, setRequestingPermission] = useState(false);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [statusModal, setStatusModal] = useState<{
        visible: boolean;
        status: StatusType;
        title: string;
        message: string;
    }>({ visible: false, status: 'idle', title: '', message: '' });

    const showStatus = (status: StatusType, title: string, message: string) => {
        setStatusModal({ visible: true, status, title, message });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [profile, permissionStatus] = await Promise.all([
                getProfileDetails().catch(() => null),
                getNotificationPermissionStatus(),
            ]);
            if (profile?.notificationSettings) {
                setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...profile.notificationSettings });
            }
            setPermission(permissionStatus);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const toggleSetting = async (key: keyof CustomerNotificationSettings) => {
        const next = { ...settings, [key]: !settings[key] };
        setSettings(next);
        setSavingKey(key);
        try {
            await updateNotificationSettings(next);
        } catch {
            setSettings(settings);
            showStatus('error', t('update_failed'), t('couldn_t_save_your_notification_prefer'));
        } finally {
            setSavingKey(null);
        }
    };

    const handleEnableNotifications = async () => {
        if (permission === 'denied') {
            Linking.openSettings();
            return;
        }
        setRequestingPermission(true);
        try {
            await requestNotificationPermission();
        } finally {
            setRequestingPermission(false);
            setPermission(await getNotificationPermissionStatus());
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('notification_settings')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {permission !== 'granted' && permission !== 'provisional' && (
                    <View style={styles.permissionBanner}>
                        <BellOff size={18} color="#DC2626" />
                        <View style={styles.permissionBannerTextCol}>
                            <Text style={styles.permissionBannerTitle}>{t('notifications_are_turned_off')}</Text>
                            <Text style={styles.permissionBannerSub}>
                                {permission === 'denied'
                                    ? "You won't receive order, appointment, or offer alerts until you enable this in phone settings."
                                    : "You won't receive order, appointment, or offer alerts until you enable this."}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.permissionBannerButton, requestingPermission && { opacity: 0.7 }]}
                            onPress={handleEnableNotifications}
                            disabled={requestingPermission}
                        >
                            {requestingPermission ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.permissionBannerButtonText}>
                                    {permission === 'denied' ? 'Open Settings' : 'Enable'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                <View style={styles.card}>
                    {NOTIFICATION_ITEMS.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <View
                                key={item.key}
                                style={[
                                    styles.itemRow,
                                    idx === NOTIFICATION_ITEMS.length - 1 ? null : styles.itemRowDivider,
                                ]}
                            >
                                <View style={styles.itemLeft}>
                                    <View style={styles.iconBox}>
                                        <Icon size={18} color={theme.textSecondary} />
                                    </View>
                                    <View style={styles.itemTextCol}>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        <Text style={styles.itemSub}>{item.sub}</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={settings[item.key]}
                                    onValueChange={() => toggleSetting(item.key)}
                                    disabled={savingKey === item.key}
                                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                                    thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
                                />
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            <StatusModal
                visible={statusModal.visible}
                status={statusModal.status}
                title={statusModal.title}
                message={statusModal.message}
                onClose={() => setStatusModal((prev) => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    center: { justifyContent: 'center', alignItems: 'center' },

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
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: c.text },

    content: { padding: 20, paddingBottom: 40 },

    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: c.errorBg,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
    },
    permissionBannerTextCol: { flex: 1 },
    permissionBannerTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626', marginBottom: 2 },
    permissionBannerSub: { fontSize: 12, lineHeight: 16, color: c.textSecondary },
    permissionBannerButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 76,
        alignItems: 'center',
    },
    permissionBannerButtonText: { fontSize: 12, fontWeight: '700', color: '#fff' },

    card: {
        backgroundColor: c.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        gap: 12,
    },
    itemRowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemTextCol: { flex: 1 },
    itemTitle: { fontSize: 14, fontWeight: '600', color: c.text },
    itemSub: { fontSize: 11.5, marginTop: 2, color: c.textSecondary },
});
