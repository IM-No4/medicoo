import { StatusBar } from '../../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import { bloodDonationApi } from '../../../services/api/bloodDonation.api';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

export default function BloodDonationHistoryScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await bloodDonationApi.getDonationHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.historyCard}>
            <View style={styles.cardHeader}>
                <View style={styles.dateInfo}>
                    <AppIcon name="calendar" size={16} color={theme.textSecondary} />
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? theme.successBg : theme.warningBg }]}>
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? theme.success : theme.warning }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.locationInfo}>
                    <AppIcon name="map-pin" size={16} color="#EF4444" />
                    <Text style={styles.locationText}>{item.locationName}</Text>
                </View>
                {item.pointsEarned > 0 && (
                    <View style={styles.pointsAward}>
                        <AppIcon name="award" size={14} color="#F59E0B" />
                        <Text style={styles.pointsAwardText}>+{item.pointsEarned} Points</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('donation_history')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#EF4444" />
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {history.length > 0 ? (
                        <FlatList
                            data={history}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={[styles.listContent, { paddingBottom: 20 + insets.bottom }]}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                <View style={styles.infoCard}>
                                    <AppIcon name="info" size={20} color="#3B82F6" />
                                    <Text style={styles.infoText}>
                                        {t('each_donation_saves_up_to_3_lives_and')}
                                    </Text>
                                </View>
                            }
                        />
                    ) : (
                        <View style={styles.center}>
                            <AppIcon name="droplet" size={64} color={theme.border} />
                            <Text style={styles.emptyTitle}>{t('no_donations_yet')}</Text>
                            <Text style={styles.emptySubtitle}>{t('your_contribution_can_save_lives')}</Text>
                            <View style={[styles.infoCard, { marginTop: 40, width: '100%' }]}>
                                <AppIcon name="info" size={20} color="#3B82F6" />
                                <Text style={styles.infoText}>
                                    {t('each_donation_saves_up_to_3_lives_and')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
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
    listContent: {
        padding: 20,
    },
    historyCard: {
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: c.textSecondary,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: c.textSecondary,
    },
    pointsAward: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: c.warningBg,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: c.border,
    },
    pointsAwardText: {
        fontSize: 12,
        fontWeight: '700',
        color: c.warning,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: c.textSecondary,
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: c.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: c.infoBg,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
    },
    infoText: {
        flex: 1,
        color: c.info,
        fontSize: 14,
        lineHeight: 20,
    },
});
