import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
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
import { getNearbyDoctors } from '../../services/api/user.api';
import DoctorCard from './components/DoctorCard';

type Doctor = {
    id: string;
    name: string;
    specialization: string;
    uniformPhoto?: string;
    consultationFee: number;
    totalReviews: number;
    averageRating: number;
    hospital?: string;
    experienceYears?: number;
    availability?: string;
    image?: string;
};

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
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('All');
    const [favorites, setFavorites] = useState<string[]>([]);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'rating_low_to_high' | 'rating_high_to_low' | 'price_low_to_high' | 'price_high_to_low'>('rating_high_to_low');
    const [page, setPage] = useState(1);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // ---------------- Load Doctors ----------------
    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getNearbyDoctors({
                page,
                query: debouncedSearchQuery,
                specialization: selectedSpecialty === 'All' ? 'all' : selectedSpecialty,
                sort: sortBy,
            });
            setDoctors(data);
        } catch (error) {
            console.error('Failed to fetch doctors:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearchQuery, selectedSpecialty, sortBy]);

    useEffect(() => {
        fetchDoctors();
        loadFavorites();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, selectedSpecialty, sortBy, page]);

    // ---------------- Favorites ----------------
    const loadFavorites = async () => {
        try {
            const stored = await AsyncStorage.getItem('favorites');
            if (stored) setFavorites(JSON.parse(stored));
        } catch { }
    };

    const toggleFavorite = async (id: string) => {
        const updated = favorites.includes(id)
            ? favorites.filter(f => f !== id)
            : [...favorites, id];

        setFavorites(updated);
        await AsyncStorage.setItem('favorites', JSON.stringify(updated));
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
            default: return 'Sort';
        }
    };

    // ---------------- Filtering Logic (Client-side for favorites only) ----------------
    const filteredDoctors = doctors.filter(doc => {
        const matchesFavorite = !showFavoritesOnly || favorites.includes(doc.id);
        return matchesFavorite;
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1C6ED5" />
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ---------- Header ---------- */}
            <View style={styles.header}>
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <AppIcon name="arrow-left" size={24} color="#1c1c1e" />
                    </TouchableOpacity>

                    <Text style={styles.title}>Consult a Doctor</Text>

                    <View style={{ width: 24 }} />
                </View>

                {/* ---------- Search Box ---------- */}
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={20} color="#8e8e93" />
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
                    <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
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
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {filteredDoctors.map(doc => (
                    <DoctorCard
                        key={doc.id}
                        doctor={{
                            id: doc.id,
                            name: doc.name,
                            specialty: doc.specialization,
                            rating: doc.averageRating,
                            experience: `${doc.experienceYears || 0} yrs`,
                            consultationFee: doc.consultationFee || 500,
                            location: doc.hospital || 'Unknown Hospital',
                            nextSlot: doc.availability || 'Check availability',
                            image: doc.image
                        }}
                        isFavorite={favorites.includes(doc.id)}
                        onToggleFavorite={() => toggleFavorite(doc.id)}
                        onBook={() => navigation.navigate('BookAppointment', { doc })}
                        onPress={() => navigation.navigate('DoctorDetail', { doctor: doc })}
                    />
                ))}

                {filteredDoctors.length === 0 && (() => {
                    const hasActiveFilters = searchQuery.trim() !== '' || selectedSpecialty !== 'All' || showFavoritesOnly || sortBy !== 'rating_high_to_low';

                    return (
                        <View style={styles.emptyContainer}>
                            {/* Graphic Illustration */}
                            <View style={styles.illustrationWrapper}>
                                <LinearGradient
                                    colors={showFavoritesOnly ? ['#FEF2F2', '#FFF1F2', '#FEE2E2'] : ['#EFF6FF', '#F0F9FF', '#E0F2FE']}
                                    style={styles.illustrationAura}
                                />
                                <Image
                                    source={require('../../assets/images/empty-doctors.png')}
                                    style={styles.emptyGraphicImage}
                                    resizeMode="contain"
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
                })()}
            </ScrollView>

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
                                            selectedSpecialty === spec.id && styles.gridItemSelected,
                                        ]}
                                        onPress={() => setSelectedSpecialty(spec.id)}
                                    >
                                        <AppIcon
                                            name={spec.icon as any}
                                            size={24}
                                            color={selectedSpecialty === spec.id ? '#fff' : spec.color}
                                        />
                                        <Text
                                            style={[
                                                styles.gridLabel,
                                                selectedSpecialty === spec.id && styles.gridLabelSelected,
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
                                onPress={() => setFilterModalVisible(false)}
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

    header: {
        backgroundColor: '#fff',
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    backButton: { padding: 4 },

    title: { fontSize: 18, fontWeight: '600', color: '#1c1c1e' },

    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
    },

    input: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1c1c1e' },

    filterBar: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },

    filterRow: { paddingHorizontal: 16, alignItems: 'center' },

    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 10,
    },

    sortChipText: { fontSize: 13, color: '#1c1c1e', marginRight: 6, fontWeight: '500' },

    filterButton: {
        padding: 8,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
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

    listContent: { padding: 20, paddingBottom: 40 },

    emptyContainer: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#F2F4F7',
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    illustrationWrapper: {
        width: 180,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        position: 'relative',
    },
    illustrationAura: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        opacity: 0.85,
    },
    emptyGraphicImage: {
        width: 170,
        height: 150,
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
