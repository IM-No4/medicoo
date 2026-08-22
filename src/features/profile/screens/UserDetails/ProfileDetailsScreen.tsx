import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Calendar, ChevronLeft, Droplet, Edit2, Mail, MapPin, Phone, Ruler, User, Weight } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { executeAction } from '../../../../actions/ActionExecutor';
import { getProfileDetails } from '../../../../services/api';
import { formatDateForDisplay, formatGenderForDisplay } from '../../../../utils/formatters';

export default function ProfileDetailsScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const authMobile = useSelector((state: any) => state.auth.mobile);

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
                <ActivityIndicator size="large" color="#2FA561" />
            </View>
        );
    }

    const profileImage = profile?.profileImage
        ? (profile.profileImage.startsWith('http') ? profile.profileImage : `data:image/jpeg;base64,${profile.profileImage}`)
        : null;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FE' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    backButton: { padding: 8, marginLeft: -8 },
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
    placeholderAvatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2FA561' },
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
        backgroundColor: '#2FA561',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    editButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
