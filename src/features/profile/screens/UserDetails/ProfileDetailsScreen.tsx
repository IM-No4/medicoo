import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, Droplet, Edit2, Mail, MapPin, Phone, Ruler, Trash2, User, Weight } from 'lucide-react-native';
import React, { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../../../actions/ActionExecutor';
import { bootSuccess } from '../../../../bootstrap/boot.slice';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { logout as logoutRedux } from '../../../../redux/slices/authSlice';
import { clearActiveOrder } from '../../../../redux/slices/orderSlice';
import { getProfileDetails, logoutApi, requestAccountDeletion } from '../../../../services/api';
import { unregisterDeviceToken } from '../../../../services/api/pushNotification.api';
import { getFCMToken } from '../../../../utils/deviceUtils';
import { formatDateForDisplay, formatGenderForDisplay } from '../../../../utils/formatters';
import { clearToken } from '../../../../utils/tokenManagement';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { AuthImage } from '../../../../components/AuthImage';

export default function ProfileDetailsScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const authMobile = useSelector((state: any) => state.auth.mobile);

    // Delete Account lives here (behind a tap into Profile Details) rather
    // than sitting in the main Profile menu, so it isn't the kind of thing
    // someone brushes past and taps by accident - it now takes a deliberate
    // trip into this screen to even see it.
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
        secondaryActionText?: string;
    }>({ visible: false, type: 'idle', title: '', message: '' });

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const handleDeleteAccount = () => {
        setStatus({
            visible: true,
            type: 'warning',
            title: t('delete_account'),
            message: t('your_account_will_be_permanently_delet'),
            primaryActionText: 'Delete',
            secondaryActionText: 'Keep',
            primaryAction: async () => {
                hideStatus();
                try {
                    await requestAccountDeletion();
                } catch (error) {
                    console.error('Failed to request account deletion:', error);
                    setStatus({
                        visible: true,
                        type: 'error',
                        title: t('something_went_wrong'),
                        message: t('could_not_schedule_account_deletion_pl'),
                    });
                    return;
                }

                try {
                    await logoutApi();
                    const fcmToken = await getFCMToken();
                    if (fcmToken) {
                        await unregisterDeviceToken(fcmToken).catch(() => {});
                    }
                } catch (error) {
                    console.error('Logout after delete request failed:', error);
                } finally {
                    await clearToken('access_token');
                    dispatch(clearActiveOrder());
                    dispatch(logoutRedux());
                    dispatch(bootSuccess({ isAuthenticated: false }));
                }
            },
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchProfile();
        }, [])
    );

    const fetchProfile = async () => {
        try {
            const data = await getProfileDetails();
            setProfile(data);
        } catch (error) {
            console.error('Failed to fetch profile', error);
        } finally {
            setLoading(false);
        }
    };

    const renderDetailRow = (icon: any, label: string, value: string | null | undefined, isVerified = false) => (
        <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
                {React.createElement(icon, { size: 20, color: theme.textSecondary })}
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value || 'Not set'}</Text>
            </View>
            {isVerified && (
                <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    const profileImage: string | null = profile?.profileImage || null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile_details')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Image & Name */}
                <View style={styles.profileHeader}>
                    <View style={styles.imageContainer}>
                        {profileImage ? (
                            <AuthImage uri={profileImage} style={styles.avatar} />
                        ) : (
                            <View style={styles.placeholderAvatar}>
                                <Text style={styles.initials}>{profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.nameText}>{profile?.name || 'User'}</Text>
                </View>

                {/* Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('contact_information')}</Text>
                    {renderDetailRow(Phone, 'Phone Number', profile?.mobile || profile?.phone || authMobile, true)}
                    {renderDetailRow(Mail, 'Email', profile?.email, !!profile?.email)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('personal_details')}</Text>
                    {renderDetailRow(User, 'Gender', formatGenderForDisplay(profile?.gender))}
                    {renderDetailRow(Calendar, 'Date of Birth', formatDateForDisplay(profile?.dob))}
                    {renderDetailRow(Droplet, 'Blood Group', profile?.bloodGroup)}
                    {renderDetailRow(Ruler, 'Height', profile?.height ? `${profile.height} cm` : null)}
                    {renderDetailRow(Weight, 'Weight', profile?.weight ? `${profile.weight} kg` : null)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('address')}</Text>
                    {renderDetailRow(MapPin, 'Home Address', profile?.address)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <TouchableOpacity
                        style={styles.deleteRow}
                        activeOpacity={0.7}
                        onPress={handleDeleteAccount}
                    >
                        <View style={[styles.iconContainer, styles.deleteIconContainer]}>
                            <Trash2 size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.deleteRowText}>{t('delete_account')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Edit CTA */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => executeAction('OPEN_EDIT_PROFILE', { profile })}
                >
                    <Edit2 size={20} color="#fff" />
                    <Text style={styles.editButtonText}>{t('edit_profile')}</Text>
                </TouchableOpacity>
            </View>

            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
                secondaryActionText={status.secondaryActionText}
            />
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Same header recipe as the rest of the Profile screens - white bar +
    // shadow, plain icon back button, fontSize 20/600/#111827 title.
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
    headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },

    content: { padding: 20 },

    profileHeader: { alignItems: 'center', marginBottom: 32 },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        backgroundColor: c.cardSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: { width: '100%', height: '100%' },
    placeholderAvatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981' },
    initials: { fontSize: 36, fontWeight: '600', color: '#fff' },
    nameText: { fontSize: 24, fontWeight: '700', color: c.text },

    section: { backgroundColor: c.card, borderRadius: 16, padding: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: c.textSecondary, marginBottom: 16, textTransform: 'uppercase' },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 12, color: c.textSecondary },
    detailValue: { fontSize: 14, color: c.text, fontWeight: '500', marginTop: 2 },

    deleteRow: { flexDirection: 'row', alignItems: 'center' },
    deleteIconContainer: { backgroundColor: c.errorBg },
    deleteRowText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },

    verifiedBadge: {
        backgroundColor: c.successBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verifiedText: { fontSize: 10, fontWeight: '600', color: c.success },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: c.card,
        borderTopWidth: 1,
        borderTopColor: c.border,
    },
    editButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    editButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
