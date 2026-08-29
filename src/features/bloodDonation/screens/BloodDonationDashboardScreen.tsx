import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import { fetchDonorProfile } from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch, RootState } from '../../../redux/store';

export default function BloodDonationDashboardScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();
    const { profile } = useSelector((state: RootState) => state.bloodDonation);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchDonorProfile());
        }, [dispatch])
    );

    const handleBack = () => executeAction('GO_BACK');
    const handleCheckEligibility = () => executeAction('OPEN_BLOOD_ELIGIBILITY');
    const handleHistory = () => executeAction('OPEN_BLOOD_HISTORY');
    const handleRequestBlood = () => executeAction('OPEN_BLOOD_REQUEST_SUBMIT');
    const handleNearbyRequests = () => {
        // No request-list endpoint yet - donors are notified directly by
        // push the moment a matching request comes in nearby, so this is
        // an informational stop rather than a browsable list for now.
        Alert.alert(
            'Nearby Requests',
            "You'll get a notification here the moment a matching blood request comes in near you."
        );
    };

    const UrgentBanner = (
        <TouchableOpacity style={styles.urgentBanner} onPress={handleRequestBlood} activeOpacity={0.85}>
            <View style={styles.urgentIconWrap}>
                <AppIcon name="droplet" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.urgentTitle}>Need blood urgently?</Text>
                <Text style={styles.urgentDesc}>Notify nearby donors instantly</Text>
            </View>
            <AppIcon name="chevron-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
    );

    const renderNonDonorView = () => (
        <View style={styles.content}>
            <View style={styles.heroCard}>
                <View style={styles.heroIconChip}>
                    <AppIcon name="droplet" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.heroTitle}>Become a Life Saver</Text>
                <Text style={styles.heroSubtitle}>
                    Your single donation can save up to 3 lives. Join our community of heroes today.
                </Text>
                <TouchableOpacity style={styles.heroButton} onPress={handleCheckEligibility} activeOpacity={0.85}>
                    <Text style={styles.heroButtonText}>Check Eligibility</Text>
                    <AppIcon name="arrow-right" size={16} color="#B91C1C" />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.stepsCard}>
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Check Eligibility</Text>
                        <Text style={styles.stepDesc}>Answer a few health questions to ensure it's safe for you to donate.</Text>
                    </View>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Register</Text>
                        <Text style={styles.stepDesc}>Create your donor profile to track your donations and rewards.</Text>
                    </View>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Donate & Earn</Text>
                        <Text style={styles.stepDesc}>Visit a nearby center, save lives, and earn badges.</Text>
                    </View>
                </View>
            </View>

            {UrgentBanner}
        </View>
    );

    const renderDonorView = () => (
        <View style={styles.content}>
            <View style={styles.heroCard}>
                <View style={styles.heroTopRow}>
                    <View style={styles.heroIconChip}>
                        <AppIcon name="droplet" size={18} color="#FFFFFF" />
                    </View>
                    <View style={styles.activePill}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activePillText}>ACTIVE DONOR</Text>
                    </View>
                </View>
                <Text style={styles.heroPoints}>{profile?.points || 0}</Text>
                <Text style={styles.heroPointsLabel}>Points Earned</Text>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatValue}>{profile?.totalDonations || 0}</Text>
                        <Text style={styles.heroStatLabel}>Donations</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatValue}>{profile?.bloodGroup || '-'}</Text>
                        <Text style={styles.heroStatLabel}>Blood Group</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={handleHistory} activeOpacity={0.7}>
                    <View style={[styles.actionIconWrap, { backgroundColor: '#EFF6FF' }]}>
                        <AppIcon name="history" size={22} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>Donation History</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={handleNearbyRequests} activeOpacity={0.7}>
                    <View style={[styles.actionIconWrap, { backgroundColor: '#FEF2F2' }]}>
                        <AppIcon name="map-pin" size={22} color="#EF4444" />
                    </View>
                    <Text style={styles.actionLabel}>Nearby Requests</Text>
                </TouchableOpacity>
            </View>

            {UrgentBanner}

            <View style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                    <AppIcon name="award" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.impactTitle}>Impact Tracker</Text>
                    <Text style={styles.impactDesc}>You've earned {profile?.points || 0} points making a difference.</Text>
                </View>
            </View>

            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Your Badges</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesRow}
            >
                {/* Always show the first badge for active profiles */}
                <View style={styles.badgeItem}>
                    <View style={[styles.badgeIconWrap, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                        <AppIcon name="award" size={28} color="#F59E0B" />
                    </View>
                    <Text style={styles.badgeName}>New Donor</Text>
                    <View style={styles.badgePointsPill}>
                        <Text style={styles.badgePointsText}>500 pts</Text>
                    </View>
                </View>

                {/* Progress Card to Next Badge */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View style={styles.lockedBadgeIcon}>
                            <AppIcon name="shield-check" size={20} color="#9CA3AF" />
                        </View>
                        <View>
                            <Text style={styles.nextBadgeTitle}>Life Saver</Text>
                            <Text style={styles.nextBadgeSubtitle}>1500 pts to unlock</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(((profile?.points || 0) / 1500) * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {profile?.points || 0} / 1500
                    </Text>
                </View>

                {profile?.badges && profile.badges.map((badge) => (
                    <View key={badge.id} style={styles.badgeItem}>
                        <View style={styles.badgeIconWrap}>
                            <AppIcon name={badge.icon as any} size={28} color="#F59E0B" />
                        </View>
                        <Text style={styles.badgeName}>{badge.name}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.topHeader, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.topHeaderTitle}>Blood Donation</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {profile ? renderDonorView() : renderNonDonorView()}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    topHeader: {
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
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    topHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    content: {
        padding: 20,
    },

    // Hero card - shared base look for both the donor status card and the
    // non-donor call-to-action card, matching the app's convention of a
    // single solid-color "hero card" (see DoctorEarningsScreen's balance
    // card) rather than a full-bleed gradient banner.
    heroCard: {
        backgroundColor: '#B91C1C',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    heroIconChip: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
    },
    activePillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    heroPoints: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    heroPointsLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        marginBottom: 20,
    },
    heroStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
    },
    heroStatItem: {
        flex: 1,
    },
    heroStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    heroStatValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    heroStatLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 2,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 14,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 20,
        marginBottom: 20,
    },
    heroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 14,
    },
    heroButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#B91C1C',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '600',
    },

    stepsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    stepItem: {
        flexDirection: 'row',
        gap: 14,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#B91C1C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 3,
    },
    stepDesc: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    stepLine: {
        width: 2,
        height: 20,
        backgroundColor: '#F3F4F6',
        marginLeft: 13,
        marginVertical: 4,
    },

    actionGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    actionIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },

    urgentBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#DC2626',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    urgentIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    urgentTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    urgentDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },

    impactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    impactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    impactTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 2,
    },
    impactDesc: {
        fontSize: 12,
        color: '#B45309',
        lineHeight: 16,
    },

    badgesRow: {
        gap: 12,
        paddingRight: 4,
    },
    badgeItem: {
        alignItems: 'center',
        width: 84,
    },
    badgeIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: '#FEF3C7',
    },
    badgeName: {
        fontSize: 12,
        fontWeight: '500',
        color: '#4B5563',
        textAlign: 'center',
    },
    badgePointsPill: {
        position: 'absolute',
        bottom: -6,
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    badgePointsText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    progressCard: {
        width: 180,
        height: 110,
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        justifyContent: 'space-between',
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lockedBadgeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBadgeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    nextBadgeSubtitle: {
        fontSize: 10,
        color: '#6B7280',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#B91C1C',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        color: '#6B7280',
        alignSelf: 'flex-end',
        fontWeight: '600',
    },
});
