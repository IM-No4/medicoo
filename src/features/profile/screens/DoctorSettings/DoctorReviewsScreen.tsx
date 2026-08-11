import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MessageSquare, Star, ThumbsUp } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import { DoctorRatingBreakdown, DoctorReviewItem, getMyDoctorReviews } from '../../../../services/api/doctor.api';

const EMPTY_BREAKDOWN: DoctorRatingBreakdown[] = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, percentage: 0 }));

const formatReviewDate = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return '1 Day ago';
    if (diffDays < 7) return `${diffDays} Days ago`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 Week ago';
    if (diffWeeks < 5) return `${diffWeeks} Weeks ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths <= 1) return '1 Month ago';
    return `${diffMonths} Months ago`;
};

export default function DoctorReviewsScreen() {
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<DoctorReviewItem[]>([]);
    const [ratingBreakdown, setRatingBreakdown] = useState<DoctorRatingBreakdown[]>(EMPTY_BREAKDOWN);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    const filters = ['All', 'Recent', 'Highest', 'Lowest'];

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getMyDoctorReviews();
                if (cancelled) return;
                setReviews(data.reviews);
                setRatingBreakdown(data.ratingBreakdown);
                setAverageRating(data.averageRating);
                setTotalReviews(data.totalReviews);
            } catch {
                // Leave the empty-state defaults in place.
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // "Recent" is the same order the backend already returns (newest
    // first); Highest/Lowest re-sort by rating without touching the
    // underlying fetched list.
    const visibleReviews = useMemo(() => {
        if (activeFilter === 'Highest') return [...reviews].sort((a, b) => b.rating - a.rating);
        if (activeFilter === 'Lowest') return [...reviews].sort((a, b) => a.rating - b.rating);
        return reviews;
    }, [reviews, activeFilter]);

    const fiveStarPercent = ratingBreakdown.find(r => r.stars === 5)?.percentage ?? 0;
    const newReviewsCount = useMemo(
        () => reviews.filter(r => Date.now() - new Date(r.date).getTime() < 7 * 24 * 60 * 60 * 1000).length,
        [reviews]
    );

    const renderReviewItem = ({ item }: { item: DoctorReviewItem }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <View style={styles.patientInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.patientName.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.patientName}>{item.patientName}</Text>
                        <Text style={styles.reviewDate}>{formatReviewDate(item.date)}</Text>
                    </View>
                </View>
                <View style={styles.ratingBadge}>
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
            </View>

            <Text style={styles.comment}>{item.comment}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => executeAction('GO_BACK')} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Reviews & Ratings</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator color="#2FA561" />
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.statsSection}>
                        <View style={styles.ratingMainRow}>
                            <View style={styles.mainRatingBox}>
                                <Text style={styles.bigRating}>{averageRating.toFixed(1)}</Text>
                                <View style={styles.starsRow}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={14} color="#F59E0B" fill={s <= Math.round(averageRating) ? "#F59E0B" : "transparent"} />
                                    ))}
                                </View>
                                <Text style={styles.totalReviews}>{totalReviews} Review{totalReviews === 1 ? '' : 's'}</Text>
                            </View>

                            <View style={styles.breakdownContainer}>
                                {ratingBreakdown.map((item) => (
                                    <View key={item.stars} style={styles.breakdownRow}>
                                        <Text style={styles.breakdownStarText}>{item.stars}</Text>
                                        <View style={styles.progressBg}>
                                            <View style={[styles.progressFill, { width: `${item.percentage}%` }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.smallStatsRow}>
                            <View style={[styles.smallStatCard, { backgroundColor: '#F0FDF4' }]}>
                                <ThumbsUp size={18} color="#16A34A" />
                                <Text style={styles.smallStatValue}>{fiveStarPercent}%</Text>
                                <Text style={styles.smallStatLabel}>5-Star</Text>
                            </View>
                            <View style={[styles.smallStatCard, { backgroundColor: '#EFF6FF' }]}>
                                <MessageSquare size={18} color="#2563EB" />
                                <Text style={styles.smallStatValue}>{newReviewsCount}</Text>
                                <Text style={styles.smallStatLabel}>New</Text>
                            </View>
                        </View>
                    </View>

                    {/* Filters */}
                    <View style={styles.filterSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                            {filters.map((filter) => (
                                <TouchableOpacity
                                    key={filter}
                                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                                    onPress={() => setActiveFilter(filter)}
                                >
                                    <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Patient Feedbacks</Text>
                    </View>

                    {visibleReviews.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateText}>No reviews yet. They'll show up here once patients start leaving feedback.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={visibleReviews}
                            renderItem={renderReviewItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
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
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    scrollContent: { paddingBottom: 40 },
    loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    statsSection: { padding: 20, gap: 20 },
    ratingMainRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 24
    },
    mainRatingBox: { alignItems: 'center', minWidth: 100 },
    bigRating: { fontSize: 40, fontWeight: '800', color: '#111827' },
    starsRow: { flexDirection: 'row', gap: 2, marginVertical: 4 },
    totalReviews: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },

    breakdownContainer: { flex: 1, gap: 6 },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    breakdownStarText: { fontSize: 12, color: '#6B7280', fontWeight: '700', width: 10 },
    progressBg: { flex: 1, height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },

    smallStatsRow: { flexDirection: 'row', gap: 12 },
    smallStatCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)'
    },
    smallStatValue: { fontSize: 18, fontWeight: '800', color: '#111827' },
    smallStatLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },

    filterSection: { marginBottom: 16 },
    filterScroll: { paddingHorizontal: 20, gap: 8 },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    filterChipActive: {
        backgroundColor: '#2FA561',
        borderColor: '#2FA561'
    },
    filterText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    filterTextActive: { color: '#fff' },

    sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },

    emptyState: { paddingHorizontal: 20, paddingVertical: 32, alignItems: 'center' },
    emptyStateText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },

    listContent: { paddingHorizontal: 20, gap: 12 },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6'
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    patientInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#6B7280' },
    patientName: { fontSize: 15, fontWeight: '600', color: '#111827' },
    reviewDate: { fontSize: 12, color: '#9CA3AF' },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    ratingText: { fontSize: 13, fontWeight: '700', color: '#D97706' },
    comment: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginTop: 12 },
});
