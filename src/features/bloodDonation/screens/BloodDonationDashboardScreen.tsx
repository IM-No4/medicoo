import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import { fetchDonorProfile } from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch, RootState } from '../../../redux/store';

export default function BloodDonationDashboardScreen() {
    const dispatch = useDispatch<AppDispatch>();
    const { profile, loading } = useSelector((state: RootState) => state.bloodDonation);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchDonorProfile());
        }, [dispatch])
    );

    const handleBack = () => executeAction('GO_BACK');
    const handleCheckEligibility = () => executeAction('OPEN_BLOOD_ELIGIBILITY');
    const handleApply = () => executeAction('OPEN_BLOOD_APPLICATION');
    const handleHistory = () => executeAction('OPEN_BLOOD_HISTORY');

    const renderNonDonorView = () => (
        <View style={styles.content}>
            <View style={styles.heroSection}>
                <View style={styles.heroIconCircle}>
                    <AppIcon name="home-heart" size={36} color="#EF4444" />
                </View>
                <Text style={styles.heroTitle}>Become a Life Saver</Text>
                <Text style={styles.heroSubtitle}>
                    Your single donation can save up to 3 lives. Join our community of heroes today.
                </Text>
            </View>

            <View style={styles.stepsSection}>
                <Text style={styles.sectionTitle}>How it works</Text>
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

            <TouchableOpacity style={styles.mainButton} onPress={handleCheckEligibility}>
                <Text style={styles.mainButtonText}>Check Eligibility</Text>
                <AppIcon name="arrow-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>


        </View>
    );

    const renderDonorView = () => (
        <View style={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={handleHistory}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#EFF6FF' }]}>
                            <AppIcon name="history" size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionLabel}>Donation History</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard}>
                        <View style={[styles.iconWrapper, { backgroundColor: '#FEF2F2' }]}>
                            <AppIcon name="map-pin" size={24} color="#EF4444" />
                        </View>
                        <Text style={styles.actionLabel}>Nearby Requests</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.pointsBanner}>
                <View style={styles.pointsBannerIcon}>
                    <AppIcon name="award" size={24} color="#F59E0B" />
                </View>
                <View style={styles.pointsBannerText}>
                    <Text style={styles.pointsBannerTitle}>Impact Tracker</Text>
                    <Text style={styles.pointsBannerDesc}>You've earned {profile?.points || 0} points making a difference.</Text>
                </View>
            </View>

            <View style={styles.badgesSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Your Badges</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.badgesList}
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                    {/* Always show the first badge for active profiles */}
                    <View style={styles.badgeItem}>
                        <View style={[styles.badgeIconWrapper, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                            <AppIcon name="award" size={32} color="#F59E0B" />
                        </View>
                        <Text style={styles.badgeName}>New Donor</Text>
                        <View style={styles.badgePointsBadge}>
                            <Text style={styles.badgePointsText}>500 pts</Text>
                        </View>
                    </View>

                    {/* Progress Card to Next Badge */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <View style={styles.lockedBadgeIcon}>
                                <AppIcon name="shield-check" size={24} color="#9CA3AF" />
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
                            <View style={styles.badgeIconWrapper}>
                                <AppIcon name={badge.icon as any} size={32} color="#F59E0B" />
                            </View>
                            <Text style={styles.badgeName}>{badge.name}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );



    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
        >
            <StatusBar style="light" />
            <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.header}
            >
                {profile ? (
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            <View style={styles.titleRow}>
                                <Text style={styles.welcomeText}>Blood Donor Dashboard</Text>
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>Active Donor</Text>
                                </View>
                            </View>
                            <Text style={styles.pointsText}>{profile?.points || 0} Points Earned</Text>
                        </View>
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profile?.totalDonations || 0}</Text>
                                <Text style={styles.statLabel}>Donations</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{profile?.bloodGroup || '-'}</Text>
                                <Text style={styles.statLabel}>Group</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.headerContent, { paddingBottom: 10 }]}>
                        <Text style={[styles.pointsText, { marginBottom: 4 }]}>Blood Donation</Text>
                        <Text style={[styles.welcomeText, { opacity: 0.9 }]}>Give the gift of life.</Text>
                    </View>
                )}
            </LinearGradient>

            {profile ? renderDonorView() : renderNonDonorView()}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    pointsText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    content: {
        padding: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
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
    iconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    badgesSection: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    badgesList: {
        flexDirection: 'row',
    },
    badgeItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 80,
    },
    badgeIconWrapper: {
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
    emptyBadges: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        color: '#9CA3AF',
        marginTop: 8,
        fontSize: 14,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        color: '#1E40AF',
        fontSize: 14,
        lineHeight: 20,
    },
    primaryActionCard: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
    },
    registrationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    registrationInfo: {
        flex: 1,
        marginRight: 16,
    },
    registrationTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    registrationSubTitle: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    registerButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    pointsBanner: {
        backgroundColor: '#FFFBEB',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    pointsBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    pointsBannerText: {
        flex: 1,
    },
    pointsBannerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 2,
    },
    pointsBannerDesc: {
        fontSize: 12,
        color: '#B45309',
    },
    badgePointsBadge: {
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
        borderColor: '#E5E7EB',
        marginRight: 16,
        justifyContent: 'space-between',
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    lockedBadgeIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
        backgroundColor: '#EF4444',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        color: '#6B7280',
        alignSelf: 'flex-end',
        fontWeight: '600',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroIconCircle: {
        width: 65,
        height: 65,
        borderRadius: 40,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    stepsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
    },
    stepItem: {
        flexDirection: 'row',
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    stepDesc: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
    stepLine: {
        width: 2,
        height: 24,
        backgroundColor: '#F3F4F6',
        marginLeft: 15,
        marginVertical: 4,
    },
    mainButton: {
        backgroundColor: '#EF4444',
        borderRadius: 16,
        paddingTop: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    mainButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    secondaryButton: {
        alignItems: 'center',
        padding: 8,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
});
