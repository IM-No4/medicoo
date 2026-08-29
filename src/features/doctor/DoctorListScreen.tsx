import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '../../components/icons/AppIcon';
import { addFavoriteDoctor, getFavoriteDoctors, getNearbyDoctors, removeFavoriteDoctor } from '../../services/api/user.api';
import DoctorCard from './components/DoctorCard';

type Doctor = {
    id: string;
    name: string;
    specialization: string;
    uniformPhoto?: string;
    consultationFee: number;
    hospital?: string;
    experienceYears?: number;
    rating?: number;
    availability?: string;
    isAcceptingAppointments?: boolean;
    image?: string;
    activeAppointment?: {
        requestId: string;
        status: string;
        consultationType?: string;
        preferredDate?: string;
        preferredTime?: string;
    } | null;
};

const PAGE_SIZE = 10;

const majorSpecializations = [
    { id: 'Cardiologist', label: 'Cardiologist', icon: 'heart', color: '#FF6F61' },
    { id: 'Dermatologist', label: 'Dermatologist', icon: 'sun', color: '#6B5B95' },
    { id: 'General Practitioner', label: 'General Practitioner', icon: 'profile', color: '#88B04B' },
    { id: 'Pediatrician', label: 'Pediatrician', icon: 'baby', color: '#F7CAC9' },
    { id: 'Orthopedic Surgeon', label: 'Orthopedic Surgeon', icon: 'bone', color: '#92A8D1' },
    { id: 'Neurologist', label: 'Neurologist', icon: 'brain', color: '#FFC107' },
    { id: 'Gastroenterologist', label: 'Gastroenterologist', icon: 'apple', color: '#8E44AD' },
    { id: 'Pulmonologist', label: 'Pulmonologist', icon: 'wind', color: '#27AE60' },
    { id: 'Urologist', label: 'Urologist', icon: 'droplet', color: '#3498DB' },
    { id: 'Endocrinologist', label: 'Endocrinologist', icon: 'flask-conical', color: '#2ECC71' },
    { id: 'Psychiatrist', label: 'Psychiatrist', icon: 'brain-circuit', color: '#9B59B6' },
    { id: 'Rheumatologist', label: 'Rheumatologist', icon: 'flower-2', color: '#E67E22' },
    { id: 'Ophthalmologist', label: 'Ophthalmologist', icon: 'eye', color: '#2980B9' },
    { id: 'Oncologist', label: 'Oncologist', icon: 'briefcase-medical', color: '#C0392B' },
    { id: 'Dentist', label: 'Dentist', icon: 'smile', color: '#2E86C1' },
];

export default function DoctorListScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    // initialLoading covers only the very first fetch (full-screen spinner).
    // loading covers every subsequent filter/search/sort-triggered fetch and
    // only swaps out the list body, keeping the header/search/filter bar in place.
    const [initialLoading, setInitialLoading] = useState(true);
    const hasLoadedOnce = useRef(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [togglingFavorites, setTogglingFavorites] = useState<Record<string, boolean>>({});
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [stagedSpecialty, setStagedSpecialty] = useState('All');
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'rating_low_to_high' | 'rating_high_to_low' | 'price_low_to_high' | 'price_high_to_low' | 'responsiveness_high_to_low'>('rating_high_to_low');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ---------------- Load Doctors ----------------
    // pageToLoad/append are passed explicitly (rather than read from state)
    // so a fast double-call - e.g. filters changing while a "load more" is
    // still in flight - can't race and load the wrong page.
    const fetchDoctors = useCallback(async (pageToLoad: number, append: boolean) => {
        try {
            if (append) setLoadingMore(true); else setLoading(true);
            const data = await getNearbyDoctors({
                page: pageToLoad,
                query: debouncedSearchQuery,
                specialization: selectedSpecialty === 'All' ? 'all' : selectedSpecialty,
                sort: sortBy,
            });
            setDoctors(prev => (append ? [...prev, ...data] : data));
            setHasMore(data.length >= PAGE_SIZE);
            setPage(pageToLoad);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
            if (!append) setDoctors([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            if (!hasLoadedOnce.current) {
                hasLoadedOnce.current = true;
                setInitialLoading(false);
            }
        }
    }, [debouncedSearchQuery, selectedSpecialty, sortBy]);

    // Reset to page 1 whenever the filters actually change.
    useEffect(() => {
        fetchDoctors(1, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, selectedSpecialty, sortBy]);

    // Favorites are unrelated to the doctor query itself, but can change on
    // other screens (e.g. detail screen) - refresh on every focus, not just mount.
    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const handleLoadMore = () => {
        if (loading || loadingMore || !hasMore) return;
        fetchDoctors(page + 1, true);
    };

    // ---------------- Favorites ----------------
    const loadFavorites = async () => {
        try {
            const res = await getFavoriteDoctors();
            const list = Array.isArray(res) ? res : res?.data || res?.doctors || [];
            const ids = list
                .map((item: any) => item.doctorId || item.id || item._id)
                .filter(Boolean);
            setFavorites(ids);
        } catch (e) {
            console.error('Failed to load favorite doctors', e);
        }
    };

    const toggleFavorite = async (id: string) => {
        if (togglingFavorites[id]) return;

        setTogglingFavorites(prev => ({ ...prev, [id]: true }));
        try {
            const isFav = favorites.includes(id);
            if (isFav) {
                await removeFavoriteDoctor(id);
                setFavorites(prev => prev.filter(f => f !== id));
            } else {
                await addFavoriteDoctor(id);
                setFavorites(prev => [...prev, id]);
            }
        } catch (e) {
            console.error('Failed to toggle favorite doctor', e);
        } finally {
            setTogglingFavorites(prev => ({ ...prev, [id]: false }));
        }
    };

    // ---------------- Reset All Filters ----------------
    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedSpecialty('All');
        setShowFavoritesOnly(false);
        setSortBy('rating_high_to_low');
    };

    // ---------------- Sorting Label ----------------
    const getSortLabel = () => {
        switch (sortBy) {
            case 'rating_low_to_high': return 'Rating: Low to High';
            case 'rating_high_to_low': return 'Rating: High to Low';
            case 'price_low_to_high': return 'Price: Low to High';
            case 'price_high_to_low': return 'Price: High to Low';
            case 'responsiveness_high_to_low': return 'Fastest to Respond';
            default: return 'Sort';
        }
    };

    const openFilterModal = () => {
        setStagedSpecialty(selectedSpecialty);
        setFilterModalVisible(true);
    };

    const applyFilterModal = () => {
        setSelectedSpecialty(stagedSpecialty);
        setFilterModalVisible(false);
    };

    // ---------------- Filtering Logic (Client-side for favorites only) ----------------
    const filteredDoctors = doctors.filter(doc => {
        const matchesFavorite = !showFavoritesOnly || favorites.includes(doc.id);
        return matchesFavorite;
    });

    if (initialLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1C6ED5" />
            </View>
        );
    }

    const renderEmptyState = () => {
        const hasActiveFilters = searchQuery.trim() !== '' || selectedSpecialty !== 'All' || showFavoritesOnly || sortBy !== 'rating_high_to_low';

        return (
            <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, showFavoritesOnly && styles.emptyIconCircleFavorite]}>
                    <AppIcon
                        name={showFavoritesOnly ? 'heart' : searchQuery.trim() !== '' ? 'search' : 'stethoscope'}
                        size={30}
                        color={showFavoritesOnly ? '#EF4444' : '#1C6ED5'}
                    />
                </View>

                <Text style={styles.emptyTitle}>
                    {showFavoritesOnly
                        ? 'No Favorite Doctors Yet'
                        : searchQuery.trim() !== ''
                            ? 'No Doctors Found'
                            : selectedSpecialty !== 'All'
                                ? `No ${selectedSpecialty} Specialists`
                                : "We couldn't find any doctors"}
                </Text>

                <Text style={styles.emptySubtitle}>
                    {showFavoritesOnly
                        ? 'Tap the heart icon on any doctor card to bookmark them for quick access.'
                        : searchQuery.trim() !== ''
                            ? `We couldn't find any doctors matching "${searchQuery}". Check for typos or try searching another term.`
                            : selectedSpecialty !== 'All'
                                ? `No doctors available under "${selectedSpecialty}" right now. Try clearing filters to see all available doctors.`
                                : 'We couldn\'t find any doctors in your area at this time. Please check back later.'}
                </Text>

                {hasActiveFilters && (
                    <View style={styles.emptyActionsRow}>
                        <TouchableOpacity
                            style={styles.resetFilterButton}
                            onPress={resetAllFilters}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#1C6ED5', '#1557B0']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.resetFilterGradient}
                            >
                                <AppIcon name="rotate-ccw" size={16} color="#FFFFFF" />
                                <Text style={styles.resetFilterText}>Reset All Filters</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {searchQuery !== '' && (
                            <TouchableOpacity
                                style={styles.clearSearchButton}
                                onPress={() => setSearchQuery('')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.clearSearchText}>Clear Search</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ---------- Header ---------- */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <ChevronLeft size={22} color="#111827" />
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Find a Doctor</Text>
                        {!loading && (
                            <Text style={styles.subtitle}>
                                {filteredDoctors.length > 0
                                    ? `${filteredDoctors.length}${hasMore && !showFavoritesOnly ? '+' : ''} doctor${filteredDoctors.length === 1 ? '' : 's'} available`
                                    : 'Consult with verified specialists'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* ---------- Search Box ---------- */}
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={19} color="#8e8e93" />
                    <TextInput
                        placeholder="Search doctors, specialties..."
                        placeholderTextColor="#8e8e93"
                        style={styles.input}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <AppIcon name="x" size={18} color="#8e8e93" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ---------- Filter Chips ---------- */}
            <View style={styles.filterBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    {selectedSpecialty !== 'All' && (
                        <TouchableOpacity
                            style={styles.activeFilterChip}
                            onPress={() => setSelectedSpecialty('All')}
                        >
                            <Text style={styles.activeFilterChipText} numberOfLines={1}>{selectedSpecialty}</Text>
                            <AppIcon name="x" size={13} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {showFavoritesOnly && (
                        <TouchableOpacity
                            style={styles.activeFilterChip}
                            onPress={() => setShowFavoritesOnly(false)}
                        >
                            <Text style={styles.activeFilterChipText}>Favorites</Text>
                            <AppIcon name="x" size={13} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {sortBy !== 'rating_high_to_low' && (
                        <TouchableOpacity
                            style={styles.activeFilterChip}
                            onPress={() => setSortBy('rating_high_to_low')}
                        >
                            <Text style={styles.activeFilterChipText}>{getSortLabel()}</Text>
                            <AppIcon name="x" size={13} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {(selectedSpecialty !== 'All' || showFavoritesOnly || sortBy !== 'rating_high_to_low') && (
                        <View style={styles.verticalDivider} />
                    )}

                    <TouchableOpacity style={styles.filterButton} onPress={openFilterModal}>
                        <AppIcon name="filter" size={16} color="#1c1c1e" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
                        <Text style={styles.sortButtonText}>{getSortLabel()}</Text>
                        <AppIcon name="chevron-down" size={14} color="#1c1c1e" />
                    </TouchableOpacity>
                    <View style={styles.verticalDivider} />

                    <TouchableOpacity
                        style={[styles.chip, showFavoritesOnly && styles.chipSelected]}
                        onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                        <AppIcon name="heart" size={13} color={showFavoritesOnly ? '#fff' : '#8e8e93'} />
                        <Text style={[styles.chipText, showFavoritesOnly && styles.chipTextSelected]}>
                            Favorites
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.chip, selectedSpecialty === 'All' && styles.chipSelected]}
                        onPress={() => setSelectedSpecialty('All')}
                    >
                        <Text style={[styles.chipText, selectedSpecialty === 'All' && styles.chipTextSelected]}>
                            All
                        </Text>
                    </TouchableOpacity>

                    {majorSpecializations.map(spec => (
                        <TouchableOpacity
                            key={spec.id}
                            style={[styles.chip, selectedSpecialty === spec.id && styles.chipSelected]}
                            onPress={() => setSelectedSpecialty(spec.id)}
                        >
                            <Text style={[styles.chipText, selectedSpecialty === spec.id && styles.chipTextSelected]}>
                                {spec.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                </ScrollView>
            </View>

            {/* ---------- Doctor List ---------- */}
            {/* `loading` only covers filter/search/sort-triggered refetches, so the
                header/search/filter bar above stay mounted and only this section swaps. */}
            {loading ? (
                <View style={styles.listLoadingContainer}>
                    <ActivityIndicator size="large" color="#1C6ED5" />
                </View>
            ) : (
                <FlatList
                    data={filteredDoctors}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReachedThreshold={0.4}
                    onEndReached={showFavoritesOnly ? undefined : handleLoadMore}
                    renderItem={({ item: doc }) => (
                        <DoctorCard
                            doctor={{
                                id: doc.id,
                                name: doc.name,
                                specialty: doc.specialization,
                                rating: doc.rating,
                                experience: `${doc.experienceYears || 0} yrs`,
                                consultationFee: doc.consultationFee || 500,
                                location: doc.hospital || 'Unknown Hospital',
                                nextSlot: doc.availability || 'Check availability',
                                isAcceptingAppointments: doc.isAcceptingAppointments,
                                activeAppointment: doc.activeAppointment,
                                image: doc.image
                            }}
                            isFavorite={favorites.includes(doc.id)}
                            isFavoriteLoading={!!togglingFavorites[doc.id]}
                            onToggleFavorite={() => toggleFavorite(doc.id)}
                            onBook={() => navigation.navigate('DoctorDetail', { doctor: doc, intent: 'BOOK' })}
                            onPress={() => navigation.navigate('DoctorDetail', { doctor: doc })}
                        />
                    )}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={loadingMore ? (
                        <ActivityIndicator size="small" color="#1C6ED5" style={{ marginVertical: 16 }} />
                    ) : null}
                />
            )}

            {/* Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter by Specialty</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <AppIcon name="x" size={24} color="#1c1c1e" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 0 }}
                        >
                            <Text style={styles.sectionHeader}>Specialty</Text>

                            <View style={styles.specialtyGrid}>
                                {majorSpecializations.map((spec) => (
                                    <TouchableOpacity
                                        key={spec.id}
                                        style={[
                                            styles.gridItem,
                                            stagedSpecialty === spec.id && styles.gridItemSelected,
                                        ]}
                                        onPress={() => setStagedSpecialty(spec.id)}
                                    >
                                        <AppIcon
                                            name={spec.icon as any}
                                            size={24}
                                            color={stagedSpecialty === spec.id ? '#fff' : spec.color}
                                        />
                                        <Text
                                            style={[
                                                styles.gridLabel,
                                                stagedSpecialty === spec.id && styles.gridLabelSelected,
                                            ]}
                                        >
                                            {spec.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Sticky footer */}
                        <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={applyFilterModal}
                            >
                                <Text style={styles.applyButtonText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>
            </Modal>

            {/* ---------- Sort Modal ---------- */}
            <Modal visible={sortModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
                        <Text style={styles.modalTitle}>Sort By</Text>

                        {[
                            { id: 'rating_high_to_low', label: 'Rating: High to Low' },
                            { id: 'rating_low_to_high', label: 'Rating: Low to High' },
                            { id: 'price_high_to_low', label: 'Price: High to Low' },
                            { id: 'price_low_to_high', label: 'Price: Low to High' },
                            { id: 'responsiveness_high_to_low', label: 'Fastest to Respond' },
                        ].map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.sortOption, sortBy === opt.id && styles.sortOptionSelected]}
                                onPress={() => {
                                    setSortBy(opt.id as any);
                                    setSortModalVisible(false);
                                }}
                            >
                                <Text style={[styles.sortOptionText, sortBy === opt.id && styles.sortOptionTextSelected]}>
                                    {opt.label}
                                </Text>
                                {sortBy === opt.id && <AppIcon name="check" size={20} color="#1C6ED5" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ---------------- STYLES SYSTEM ----------------

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F2F2F7' },

    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listLoadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },

    header: {
        backgroundColor: '#fff',
        paddingBottom: 16,
        paddingHorizontal: 24,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },

    backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },

    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    subtitle: { fontSize: 12.5, color: '#8e8e93', marginTop: 2, fontWeight: '500' },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        gap: 8,
    },

    input: { flex: 1, fontSize: 15, color: '#1c1c1e' },

    filterBar: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
        paddingBottom: 22,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    filterRow: { paddingHorizontal: 16, alignItems: 'center' },

    filterButton: {
        padding: 8,
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        marginRight: 12,
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 12,
    },
    sortButtonText: {
        fontSize: 13,
        color: '#1c1c1e',
        fontWeight: '500',
        marginRight: 4,
    },
    verticalDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E5EA',
        marginRight: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: '#fff',
        marginRight: 8,
    },

    chipSelected: { backgroundColor: '#1C6ED5', borderColor: '#1C6ED5' },

    chipText: { fontSize: 13, color: '#1c1c1e', fontWeight: '500' },

    chipTextSelected: { color: '#fff' },

    activeFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1C6ED5',
        marginRight: 8,
        maxWidth: 160,
    },
    activeFilterChipText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '600',
        flexShrink: 1,
    },

    listContent: { padding: 20, paddingBottom: 40, flexGrow: 1 , backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 16 },

    emptyContainer: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginTop: 8,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyIconCircleFavorite: {
        backgroundColor: '#FEF2F2',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#101828',
        textAlign: 'center',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#667085',
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: 20,
        paddingHorizontal: 12,
    },
    emptyActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    resetFilterButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    resetFilterGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        gap: 8,
    },
    resetFilterText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    clearSearchButton: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: '#F2F4F7',
        borderWidth: 1,
        borderColor: '#E4E7EC',
    },
    clearSearchText: {
        color: '#344054',
        fontSize: 13,
        fontWeight: '600',
    },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },

    modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },

    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 18,
    },

    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

    sortOption: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    sortOptionSelected: { backgroundColor: '#F2F8FF' },

    sortOptionText: { fontSize: 16, color: '#1c1c1e' },

    sortOptionTextSelected: { color: '#1C6ED5', fontWeight: '600' },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionHeader: { fontSize: 16, fontWeight: '600', color: '#1c1c1e', marginBottom: 12, marginTop: 8 },
    specialtyGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 0 },
    gridItem: {
        width: '32%', aspectRatio: 1, backgroundColor: '#F2F2F7', borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    gridItemSelected: { backgroundColor: '#1C6ED5' },
    gridLabel: {
        fontSize: 11, color: '#1c1c1e', marginTop: 8, textAlign: 'center', fontWeight: '500',
    },
    gridLabelSelected: { color: '#fff' },
    applyButton: {
        backgroundColor: '#1C6ED5', paddingVertical: 16, borderRadius: 16, alignItems: 'center',
    },
    applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    modalFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
});
