import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from '../../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import { fetchDonorProfile } from '../../../redux/slices/bloodDonationSlice';
import { AppDispatch, RootState } from '../../../redux/store';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export default function BloodDonationDashboardScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
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
            t('you_ll_get_a_notification_here_the_mom')
        );
    };

    const UrgentBanner = (
        <TouchableOpacity style={styles.urgentBanner} onPress={handleRequestBlood} activeOpacity={0.85}>
            <View style={styles.urgentIconWrap}>
                <AppIcon name="droplet" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.urgentTitle}>{t('need_blood_urgently')}</Text>
                <Text style={styles.urgentDesc}>{t('notify_nearby_donors_instantly')}</Text>
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
                <Text style={styles.heroTitle}>{t('become_a_life_saver')}</Text>
                <Text style={styles.heroSubtitle}>
                    {t('your_single_donation_can_save_up_to_3')}
                </Text>
                <TouchableOpacity style={styles.heroButton} onPress={handleCheckEligibility} activeOpacity={0.85}>
                    <Text style={styles.heroButtonText}>{t('check_eligibility')}</Text>
                    <AppIcon name="arrow-right" size={16} color={theme.error} />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t('how_it_works')}</Text>
            <View style={styles.stepsCard}>
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('check_eligibility')}</Text>
                        <Text style={styles.stepDesc}>{t('answer_a_few_health_questions_to_ensur')}</Text>
                    </View>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('register')}</Text>
                        <Text style={styles.stepDesc}>{t('create_your_donor_profile_to_track_you')}</Text>
                    </View>
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepItem}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>{t('donate_earn')}</Text>
                        <Text style={styles.stepDesc}>{t('visit_a_nearby_center_save_lives_and_e')}</Text>
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
                        <Text style={styles.activePillText}>{t('active_donor')}</Text>
                    </View>
                </View>
                <Text style={styles.heroPoints}>{profile?.points || 0}</Text>
                <Text style={styles.heroPointsLabel}>{t('points_earned')}</Text>

                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatValue}>{profile?.totalDonations || 0}</Text>
                        <Text style={styles.heroStatLabel}>{t('donations')}</Text>
                    </View>
                    <View style={styles.heroStatDivider} />
                    <View style={styles.heroStatItem}>
                        <Text style={styles.heroStatValue}>{profile?.bloodGroup || '-'}</Text>
                        <Text style={styles.heroStatLabel}>{t('blood_group_2')}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
            <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionCard} onPress={handleHistory} activeOpacity={0.7}>
                    <View style={[styles.actionIconWrap, { backgroundColor: theme.infoBg }]}>
                        <AppIcon name="history" size={22} color="#3B82F6" />
                    </View>
                    <Text style={styles.actionLabel}>{t('donation_history')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionCard} onPress={handleNearbyRequests} activeOpacity={0.7}>
                    <View style={[styles.actionIconWrap, { backgroundColor: theme.errorBg }]}>
                        <AppIcon name="map-pin" size={22} color="#EF4444" />
                    </View>
                    <Text style={styles.actionLabel}>{t('nearby_requests')}</Text>
                </TouchableOpacity>
            </View>

            {UrgentBanner}

            <View style={styles.impactCard}>
                <View style={styles.impactIconWrap}>
                    <AppIcon name="award" size={20} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.impactTitle}>{t('impact_tracker')}</Text>
                    <Text style={styles.impactDesc}>You've earned {profile?.points || 0} points making a difference.</Text>
                </View>
            </View>

            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t('your_badges')}</Text>
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>{t('see_all_2')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badgesRow}
            >
                {/* Always show the first badge for active profiles */}
                <View style={styles.badgeItem}>
                    <View style={[styles.badgeIconWrap, { borderColor: '#F59E0B', backgroundColor: theme.warningBg }]}>
                        <AppIcon name="award" size={28} color="#F59E0B" />
                    </View>
                    <Text style={styles.badgeName}>{t('new_donor')}</Text>
                    <View style={styles.badgePointsPill}>
                        <Text style={styles.badgePointsText}>500 pts</Text>
                    </View>
                </View>

                {/* Progress Card to Next Badge */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <View style={styles.lockedBadgeIcon}>
                            <AppIcon name="shield-check" size={20} color={theme.textMuted} />
                        </View>
                        <View>
                            <Text style={styles.nextBadgeTitle}>{t('life_saver')}</Text>
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
            <View style={[styles.topHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.topHeaderTitle}>{t('blood_donation')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
                {profile ? renderDonorView() : renderNonDonorView()}
            </ScrollView>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    topHeader: {
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
    topHeaderTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
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
        backgroundColor: c.card,
        borderRadius: 12,
        paddingVertical: 14,
    },
    heroButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: c.error,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
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
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
        marginBottom: 3,
    },
    stepDesc: {
        fontSize: 13,
        color: c.textSecondary,
        lineHeight: 18,
    },
    stepLine: {
        width: 2,
        height: 20,
        backgroundColor: c.cardSecondary,
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
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
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
        backgroundColor: c.warningBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: c.border,
    },
    impactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: c.warningBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    impactTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: c.warning,
        marginBottom: 2,
    },
    impactDesc: {
        fontSize: 12,
        color: c.warning,
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
        backgroundColor: c.warningBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 2,
        borderColor: c.border,
    },
    badgeName: {
        fontSize: 12,
        fontWeight: '500',
        color: c.textSecondary,
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
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
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
        backgroundColor: c.cardSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextBadgeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: c.text,
    },
    nextBadgeSubtitle: {
        fontSize: 10,
        color: c.textSecondary,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: c.cardSecondary,
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
        color: c.textSecondary,
        alignSelf: 'flex-end',
        fontWeight: '600',
    },
});
