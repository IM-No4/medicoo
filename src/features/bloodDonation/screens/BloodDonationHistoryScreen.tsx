import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../actions/ActionExecutor';
import AppIcon from '../../../components/icons/AppIcon';
import { bloodDonationApi } from '../../../services/api/bloodDonation.api';

export default function BloodDonationHistoryScreen() {
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
                    <AppIcon name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#DCFCE7' : '#FEF9C3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'completed' ? '#166534' : '#854D0E' }]}>
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
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Donation History</Text>
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
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                <View style={styles.infoCard}>
                                    <AppIcon name="info" size={20} color="#3B82F6" />
                                    <Text style={styles.infoText}>
                                        Each donation saves up to 3 lives and earns you 500 bonus points!
                                    </Text>
                                </View>
                            }
                        />
                    ) : (
                        <View style={styles.center}>
                            <AppIcon name="droplet" size={64} color="#F3F4F6" />
                            <Text style={styles.emptyTitle}>No Donations Yet</Text>
                            <Text style={styles.emptySubtitle}>Your contribution can save lives.</Text>
                            <View style={[styles.infoCard, { marginTop: 40, width: '100%' }]}>
                                <AppIcon name="info" size={20} color="#3B82F6" />
                                <Text style={styles.infoText}>
                                    Each donation saves up to 3 lives and earns you 500 bonus points!
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
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
        color: '#111827',
    },
    listContent: {
        padding: 20,
    },
    historyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
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
        color: '#4B5563',
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
        color: '#6B7280',
    },
    pointsAward: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    pointsAwardText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
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
        color: '#4B5563',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 12,
        marginTop: 20,
    },
    infoText: {
        flex: 1,
        color: '#1E40AF',
        fontSize: 14,
        lineHeight: 20,
    },
});
