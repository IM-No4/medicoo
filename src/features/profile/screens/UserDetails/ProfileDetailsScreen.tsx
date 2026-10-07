import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, Droplet, Edit2, Mail, MapPin, Phone, Ruler, Trash2, User, Weight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
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

export default function ProfileDetailsScreen() {
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
            title: 'Delete Account',
            message: "Your account will be permanently deleted after 30 days. Log back in anytime before then to cancel.",
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
                        title: 'Something went wrong',
                        message: 'Could not schedule account deletion. Please try again.',
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
                {React.createElement(icon, { size: 20, color: '#6B7280' })}
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
                <ActivityIndicator size="large" color="#0FBBA1" />
            </View>
        );
    }

    const profileImage = profile?.profileImage
        ? (profile.profileImage.startsWith('http') ? profile.profileImage : `data:image/jpeg;base64,${profile.profileImage}`)
        : null;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Image & Name */}
                <View style={styles.profileHeader}>
                    <View style={styles.imageContainer}>
                        {profileImage ? (
                            <Image source={{ uri: profileImage }} style={styles.avatar} />
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
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    {renderDetailRow(Phone, 'Phone Number', profile?.mobile || profile?.phone || authMobile, true)}
                    {renderDetailRow(Mail, 'Email', profile?.email, !!profile?.email)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    {renderDetailRow(User, 'Gender', formatGenderForDisplay(profile?.gender))}
                    {renderDetailRow(Calendar, 'Date of Birth', formatDateForDisplay(profile?.dob))}
                    {renderDetailRow(Droplet, 'Blood Group', profile?.bloodGroup)}
                    {renderDetailRow(Ruler, 'Height', profile?.height ? `${profile.height} cm` : null)}
                    {renderDetailRow(Weight, 'Weight', profile?.weight ? `${profile.weight} kg` : null)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>
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
                        <Text style={styles.deleteRowText}>Delete Account</Text>
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
                    <Text style={styles.editButtonText}>Edit Profile</Text>
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

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
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: { width: '100%', height: '100%' },
    placeholderAvatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0FBBA1' },
    initials: { fontSize: 36, fontWeight: '600', color: '#fff' },
    nameText: { fontSize: 24, fontWeight: '700', color: '#111827' },

    section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 16, textTransform: 'uppercase' },

    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    detailContent: { flex: 1 },
    detailLabel: { fontSize: 12, color: '#6B7280' },
    detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '500', marginTop: 2 },

    deleteRow: { flexDirection: 'row', alignItems: 'center' },
    deleteIconContainer: { backgroundColor: '#FEF2F2' },
    deleteRowText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },

    verifiedBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    verifiedText: { fontSize: 10, fontWeight: '600', color: '#166534' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    editButton: {
        backgroundColor: '#0FBBA1',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    editButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
