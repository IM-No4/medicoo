import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ================= TYPES & MOCK DATA ================= */

type TabType = 'nearby' | 'specialty' | 'emergency';

interface HospitalItem {
    id: string;
    name: string;
    category: string;
    rating: number;
    reviewsCount: string;
    distanceKm: number;
    distanceText: string;
    address: string;
    facilities: string[];
    specialties: string[];
    isEmergencyReady: boolean;
    icuBedsAvailable: number;
    totalBeds: number;
    isAccredited: boolean;
    consultationFee: string;
    image?: string;
    phone: string;
}

const CATEGORIES = [
    { id: 'all', label: 'All Hospitals', icon: 'hospital' },
    { id: 'emergency', label: 'Emergency 24/7', icon: 'ambulance' },
    { id: 'multi', label: 'Multi-Specialty', icon: 'shield-check' },
    { id: 'cardiology', label: 'Cardiology', icon: 'heart' },
    { id: 'neurology', label: 'Neurology', icon: 'brain' },
    { id: 'orthopedics', label: 'Orthopedics', icon: 'bone' },
    { id: 'pediatrics', label: 'Pediatrics', icon: 'baby' },
    { id: 'oncology', label: 'Oncology', icon: 'briefcase-medical' },
];

const HOSPITALS_DATA: HospitalItem[] = [
    {
        id: 'h1',
        name: 'Apollo Multi-Specialty Hospital',
        category: 'multi',
        rating: 4.8,
        reviewsCount: '12.4k',
        distanceKm: 1.8,
        distanceText: '1.8 km away',
        address: 'Plot 14, Greams Road, Healthcare Corridor',
        facilities: ['24/7 Emergency', '18 ICU Beds Ready', 'Cashless Insurance', 'Ambulance'],
        specialties: ['Cardiology', 'Neurology', 'Orthopedics', 'ICU', 'Oncology'],
        isEmergencyReady: true,
        icuBedsAvailable: 18,
        totalBeds: 450,
        isAccredited: true,
        consultationFee: '₹800 - ₹1,200',
        phone: '+919876543210',
    },
    {
        id: 'h2',
        name: 'Fortis Heart & Vascular Institute',
        category: 'cardiology',
        rating: 4.7,
        reviewsCount: '15.8k',
        distanceKm: 2.5,
        distanceText: '2.5 km away',
        address: 'Sector 62, Phase 8, Medical Zone',
        facilities: ['24/7 Cath Lab', 'Cardiac ICU', 'Organ Transplant', 'Ambulance'],
        specialties: ['Cardiology', 'Cardiac Surgery', 'Vascular Care', 'ICU'],
        isEmergencyReady: true,
        icuBedsAvailable: 12,
        totalBeds: 300,
        isAccredited: true,
        consultationFee: '₹900 - ₹1,500',
        phone: '+919876543211',
    },
    {
        id: 'h3',
        name: 'Max Super Specialty Hospital',
        category: 'multi',
        rating: 4.8,
        reviewsCount: '9.6k',
        distanceKm: 3.2,
        distanceText: '3.2 km away',
        address: 'Press Enclave Road, Saket Block',
        facilities: ['24/7 Emergency', '24 ICU Beds', 'Cashless Mediclaim', 'Trauma Center'],
        specialties: ['Neurology', 'Orthopedics', 'Nephrology', 'Gastroenterology'],
        isEmergencyReady: true,
        icuBedsAvailable: 24,
        totalBeds: 500,
        isAccredited: true,
        consultationFee: '₹750 - ₹1,100',
        phone: '+919876543212',
    },
    {
        id: 'h4',
        name: 'Manipal Children & Maternity Center',
        category: 'pediatrics',
        rating: 4.9,
        reviewsCount: '11.2k',
        distanceKm: 4.1,
        distanceText: '4.1 km away',
        address: 'HAL Airport Road, Kodihalli',
        facilities: ['24/7 NICU/PICU', 'High Risk Pregnancy', 'Pediatric Surgery'],
        specialties: ['Pediatrics', 'Neonatology', 'Obstetrics', 'Pediatric ICU'],
        isEmergencyReady: true,
        icuBedsAvailable: 10,
        totalBeds: 250,
        isAccredited: true,
        consultationFee: '₹700 - ₹1,000',
        phone: '+919876543213',
    },
    {
        id: 'h5',
        name: 'Narayana Health & Brain Institute',
        category: 'neurology',
        rating: 4.7,
        reviewsCount: '8.4k',
        distanceKm: 5.0,
        distanceText: '5.0 km away',
        address: 'Hosur Road, Bommasandra Industrial Area',
        facilities: ['Stroke Unit 24/7', 'Neuro ICU', 'Advanced MRI 3T', 'Trauma Center'],
        specialties: ['Neurology', 'Neurosurgery', 'Spine Care', 'Brain Trauma'],
        isEmergencyReady: true,
        icuBedsAvailable: 15,
        totalBeds: 350,
        isAccredited: true,
        consultationFee: '₹850 - ₹1,300',
        phone: '+919876543214',
    },
    {
        id: 'h6',
        name: 'HCG Cancer & Research Institute',
        category: 'oncology',
        rating: 4.8,
        reviewsCount: '6.9k',
        distanceKm: 6.2,
        distanceText: '6.2 km away',
        address: 'Kalinga Rao Road, Sampangi Rama Nagar',
        facilities: ['CyberKnife 24/7', 'Bone Marrow Transplant', 'Chemo Day Care'],
        specialties: ['Surgical Oncology', 'Medical Oncology', 'Radiation Care'],
        isEmergencyReady: false,
        icuBedsAvailable: 8,
        totalBeds: 200,
        isAccredited: true,
        consultationFee: '₹1,000 - ₹1,800',
        phone: '+919876543215',
    },
];

/* ================= MAIN COMPONENT ================= */

export default function HospitalListScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // 108 is India's national emergency ambulance/medical helpline - same
    // number AmbulanceListScreen.tsx already dials for its SOS button.
    const callEmergencyHelpline = () => {
        Linking.openURL('tel:108').catch(() => {});
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState<TabType>('nearby');

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'beds' | 'emergency'>('distance');

    /* ---------------- Filtering & Search Logic ---------------- */

    const filteredHospitals = useMemo(() => {
        let result = HOSPITALS_DATA;

        // Category filter
        if (selectedCategory === 'emergency') {
            result = result.filter((h) => h.isEmergencyReady);
        } else if (selectedCategory !== 'all') {
            result = result.filter((h) => h.category === selectedCategory || h.specialties.some(s => s.toLowerCase().includes(selectedCategory)));
        }

        // Tab filter
        if (activeTab === 'emergency') {
            result = result.filter((h) => h.isEmergencyReady && h.icuBedsAvailable > 0);
        } else if (activeTab === 'specialty') {
            result = result.filter((h) => h.category !== 'multi');
        }

        // Search query filter
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (h) =>
                    h.name.toLowerCase().includes(q) ||
                    h.address.toLowerCase().includes(q) ||
                    h.specialties.some((s) => s.toLowerCase().includes(q)) ||
                    h.facilities.some((f) => f.toLowerCase().includes(q))
            );
        }

        // Sorting
        if (sortBy === 'distance') result = [...result].sort((a, b) => a.distanceKm - b.distanceKm);
        if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating);
        if (sortBy === 'beds') result = [...result].sort((a, b) => b.icuBedsAvailable - a.icuBedsAvailable);
        if (sortBy === 'emergency') result = [...result].sort((a, b) => (b.isEmergencyReady ? 1 : 0) - (a.isEmergencyReady ? 1 : 0));

        return result;
    }, [selectedCategory, activeTab, searchQuery, sortBy]);

    const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || sortBy !== 'distance';

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('distance');
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'rating': return 'Highest Rated';
            case 'beds': return 'Most ICU Beds Available';
            case 'emergency': return '24/7 Emergency First';
            default: return 'Nearest First';
        }
    };

    /* ================= RENDER ================= */

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* ---------- Header ---------- */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Hospitals & Centers</Text>
                    <View style={styles.locationRow}>
                        <AppIcon name="map-pin" size={12} color="#059669" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            Near Your Location • 5 km radius
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.emergencyCallHeaderButton} onPress={callEmergencyHelpline}>
                    <AppIcon name="phone" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {/* ---------- Search Box ---------- */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        placeholder="Search hospitals, specialties, ICU, emergency..."
                        placeholderTextColor="#8E8E93"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== '' && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <AppIcon name="x" size={18} color="#8E8E93" />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity style={styles.filterIconButton} onPress={() => setFilterModalVisible(true)}>
                    <AppIcon name="filter" size={18} color="#1C1C1E" />
                </TouchableOpacity>
            </View>

            {/* ---------- Category Chips ---------- */}
            <View style={styles.categoriesBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <AppIcon
                                    name={cat.icon as any}
                                    size={14}
                                    color={isSelected ? '#FFFFFF' : '#475569'}
                                />
                                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ---------- Segmented Tabs ---------- */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'nearby' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('nearby')}
                >
                    <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
                        Nearby ({filteredHospitals.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'specialty' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('specialty')}
                >
                    <Text style={[styles.tabText, activeTab === 'specialty' && styles.tabTextActive]}>
                        Specialty Centers
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'emergency' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('emergency')}
                >
                    <Text style={[styles.tabText, activeTab === 'emergency' && styles.tabTextActive]}>
                        Emergency 24/7
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ---------- Main Content Scroll ---------- */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Emergency Hotline Banner */}
                <LinearGradient
                    colors={['#DC2626', '#EF4444', '#F87171']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.emergencyBanner}
                >
                    <View style={styles.emergencyBannerContent}>
                        <View style={styles.emergencyIconWrapper}>
                            <AppIcon name="ambulance" size={24} color="#DC2626" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.emergencyBannerTitle}>24/7 Emergency Medical Care</Text>
                            <Text style={styles.emergencyBannerSubtitle}>Instant ICU admission & ambulance booking</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.emergencyCallButton} activeOpacity={0.8} onPress={callEmergencyHelpline}>
                        <AppIcon name="phone" size={16} color="#DC2626" />
                        <Text style={styles.emergencyCallText}>Call Helpline 108</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Sub-header Filter & Sort row */}
                <View style={styles.subHeaderBar}>
                    <Text style={styles.resultsCountText}>
                        Showing {filteredHospitals.length} Hospitals
                    </Text>
                    <TouchableOpacity style={styles.sortTrigger} onPress={() => setSortModalVisible(true)}>
                        <Text style={styles.sortTriggerText}>{getSortLabel()}</Text>
                        <AppIcon name="chevron-down" size={14} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* LIST OF HOSPITALS */}
                <View style={styles.listSection}>
                    {filteredHospitals.map((hospital) => (
                        <View key={hospital.id} style={styles.hospitalCard}>
                            {/* Card Top Header */}
                            <View style={styles.hospitalHeaderRow}>
                                <View style={styles.hospitalAvatar}>
                                    <AppIcon name="hospital" size={26} color="#1C6ED5" />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.hospitalName} numberOfLines={1}>
                                            {hospital.name}
                                        </Text>
                                    </View>

                                    <Text style={styles.hospitalAddress} numberOfLines={1}>
                                        {hospital.address}
                                    </Text>

                                    <View style={styles.ratingDistanceRow}>
                                        <View style={styles.ratingBadge}>
                                            <AppIcon name="star" size={12} color="#F59E0B" />
                                            <Text style={styles.ratingBadgeText}>{hospital.rating}</Text>
                                            <Text style={styles.ratingCountText}>({hospital.reviewsCount})</Text>
                                        </View>
                                        <View style={styles.distanceBadge}>
                                            <AppIcon name="map-pin" size={11} color="#059669" />
                                            <Text style={styles.distanceBadgeText}>{hospital.distanceText}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Accreditations & Emergency Badges */}
                            <View style={styles.badgesRow}>
                                {hospital.isAccredited && (
                                    <View style={styles.accreditedBadge}>
                                        <AppIcon name="shield-check" size={12} color="#059669" />
                                        <Text style={styles.accreditedText}>NABH Accredited</Text>
                                    </View>
                                )}
                                {hospital.isEmergencyReady && (
                                    <View style={styles.emergencyBadge}>
                                        <AppIcon name="ambulance" size={12} color="#DC2626" />
                                        <Text style={styles.emergencyText}>24/7 Emergency Active</Text>
                                    </View>
                                )}
                                <View style={styles.icuBadge}>
                                    <Text style={styles.icuText}>{hospital.icuBedsAvailable} ICU Beds Ready</Text>
                                </View>
                            </View>

                            {/* Specialties Grid */}
                            <View style={styles.specialtiesWrapper}>
                                <Text style={styles.specialtiesLabel}>Key Departments:</Text>
                                <View style={styles.specialtiesGrid}>
                                    {hospital.specialties.map((spec, i) => (
                                        <View key={i} style={styles.specialtyChip}>
                                            <Text style={styles.specialtyChipText}>{spec}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            {/* Card Footer Actions */}
                            <View style={styles.cardFooter}>
                                <View>
                                    <Text style={styles.feeLabel}>OPD Consultation</Text>
                                    <Text style={styles.feeValue}>{hospital.consultationFee}</Text>
                                </View>

                                <View style={styles.actionsGroup}>
                                    <TouchableOpacity style={styles.phoneButton} activeOpacity={0.7}>
                                        <AppIcon name="phone" size={16} color="#1C6ED5" />
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.detailButton}
                                        onPress={() => navigation.navigate('HospitalDetail', { hospitalId: hospital.id })}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.detailButtonText}>View Details</Text>
                                        <AppIcon name="chevron-right" size={14} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* GRAPHIC EMPTY STATE */}
                {filteredHospitals.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.illustrationWrapper}>
                            <LinearGradient
                                colors={['#EFF6FF', '#F0F9FF', '#E0F2FE']}
                                style={styles.illustrationAura}
                            />
                            <Image
                                source={require('../../assets/images/empty-doctors.png')}
                                style={styles.emptyGraphicImage}
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={styles.emptyTitle}>
                            {searchQuery.trim() !== ''
                                ? 'No Hospitals Found'
                                : selectedCategory !== 'all'
                                ? `No ${selectedCategory.toUpperCase()} Centers`
                                : "We couldn't find any hospitals"}
                        </Text>

                        <Text style={styles.emptySubtitle}>
                            {searchQuery.trim() !== ''
                                ? `We couldn't find any hospitals matching "${searchQuery}". Check for typos or search for specialty keywords.`
                                : selectedCategory !== 'all'
                                ? `No hospital units available under this category right now. Try clearing filters to see all medical centers.`
                                : 'We couldn\'t find any hospitals in your selected area. Please try resetting your search and filters.'}
                        </Text>

                        {hasActiveFilters && (
                            <View style={styles.emptyActionsRow}>
                                <TouchableOpacity style={styles.resetFilterButton} onPress={resetAllFilters} activeOpacity={0.8}>
                                    <LinearGradient colors={['#1C6ED5', '#1557B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.resetFilterGradient}>
                                        <AppIcon name="rotate-ccw" size={16} color="#FFFFFF" />
                                        <Text style={styles.resetFilterText}>Reset All Filters</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {searchQuery !== '' && (
                                    <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                                        <Text style={styles.clearSearchText}>Clear Search</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* ---------- SORT MODAL ---------- */}
            <Modal visible={sortModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
                        <Text style={styles.modalTitle}>Sort Hospitals By</Text>
                        {[
                            { id: 'distance', label: 'Nearest First' },
                            { id: 'rating', label: 'Highest Rated' },
                            { id: 'beds', label: 'Most ICU Beds Available' },
                            { id: 'emergency', label: '24/7 Emergency Active First' },
                        ].map((opt) => (
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
                                {sortBy === opt.id && <AppIcon name="check" size={18} color="#1C6ED5" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* ---------- FILTER MODAL ---------- */}
            <Modal visible={filterModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Filter Hospitals</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <AppIcon name="x" size={22} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterSectionTitle}>Specialties & Departments</Text>
                        <View style={styles.filterChipGrid}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.modalFilterChip, selectedCategory === cat.id && styles.modalFilterChipSelected]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                >
                                    <Text style={[styles.modalFilterChipText, selectedCategory === cat.id && styles.modalFilterChipTextSelected]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.applyFilterButton}
                            onPress={() => setFilterModalVisible(false)}
                        >
                            <Text style={styles.applyFilterText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        gap: 12,
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
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748B',
    },
    emergencyCallHeaderButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
    },
    filterIconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoriesBar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    categoriesRow: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    categoryChipSelected: {
        backgroundColor: '#1C6ED5',
        borderColor: '#1C6ED5',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
    },
    categoryChipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#1C6ED5',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    tabTextActive: {
        fontWeight: '700',
        color: '#1C6ED5',
    },
    scrollContent: {
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    emergencyBanner: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'column',
        gap: 12,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    emergencyBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emergencyIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emergencyBannerTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    emergencyBannerSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginTop: 2,
    },
    emergencyCallButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    emergencyCallText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
    },
    subHeaderBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 4,
    },
    resultsCountText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    sortTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sortTriggerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    listSection: {
        gap: 14,
    },
    hospitalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    hospitalHeaderRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    hospitalAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    hospitalName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        flex: 1,
    },
    hospitalAddress: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    ratingDistanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    ratingBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
    },
    ratingCountText: {
        fontSize: 10,
        color: '#B45309',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distanceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#059669',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    accreditedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    accreditedText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    emergencyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    emergencyText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#DC2626',
    },
    icuBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    icuText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    specialtiesWrapper: {
        marginBottom: 10,
    },
    specialtiesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    specialtiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    specialtyChip: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    specialtyChipText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    feeLabel: {
        fontSize: 11,
        color: '#64748B',
    },
    feeValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 2,
    },
    actionsGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    phoneButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    detailButton: {
        backgroundColor: '#1C6ED5',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    detailButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    emptyContainer: {
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#F2F4F7',
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    sortOption: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sortOptionSelected: {
        backgroundColor: '#F0F9FF',
    },
    sortOptionText: {
        fontSize: 15,
        color: '#0F172A',
    },
    sortOptionTextSelected: {
        color: '#1C6ED5',
        fontWeight: '700',
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
    },
    filterChipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    modalFilterChip: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    modalFilterChipSelected: {
        backgroundColor: '#1C6ED5',
    },
    modalFilterChipText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
    modalFilterChipTextSelected: {
        color: '#FFFFFF',
    },
    applyFilterButton: {
        backgroundColor: '#1C6ED5',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    applyFilterText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
