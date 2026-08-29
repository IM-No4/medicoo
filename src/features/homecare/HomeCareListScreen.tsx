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

export interface HomeCareProviderItem {
    id: string;
    name: string;
    rating: number;
    reviewsCount: string;
    accreditation: string;
    nextSlot: string;
    startingPrice: number;
    servicesOffered: { name: string; category: string; icon: string; price: number }[];
    features: string[];
    phone: string;
    address: string;
    badgeColor: string;
    isVerified: boolean;
    badgeText?: string;
}

const CATEGORIES = [
    { id: 'all', label: 'All Services', icon: 'heart' },
    { id: 'nursing', label: 'Home Nursing', icon: 'user' },
    { id: 'physio', label: 'Physiotherapy', icon: 'activity' },
    { id: 'elder', label: 'Elder Care', icon: 'heart' },
    { id: 'icu', label: 'ICU at Home', icon: 'briefcase-medical' },
    { id: 'equipment', label: 'Equipment Rental', icon: 'box' },
];

export const PROVIDERS_DATA: HomeCareProviderItem[] = [
    {
        id: 'p1',
        name: 'Portea Medical Care',
        rating: 4.8,
        reviewsCount: '8.4k',
        accreditation: 'ISO 9001 Certified • Verified Staff',
        nextSlot: 'Today, 4:00 PM',
        startingPrice: 499,
        servicesOffered: [
            { name: 'Physiotherapy', category: 'physio', icon: 'activity', price: 499 },
            { name: 'Home Nursing', category: 'nursing', icon: 'user', price: 800 },
            { name: 'Elder Care', category: 'elder', icon: 'heart', price: 799 },
            { name: 'ICU at Home', category: 'icu', icon: 'briefcase-medical', price: 3500 },
        ],
        features: ['100% Police Verified', 'Daily Progress Reports', 'Emergency Backup Support'],
        phone: '+919876543210',
        address: 'Bandra West, Mumbai',
        badgeColor: '#EC4899',
        isVerified: true,
        badgeText: 'POPULAR',
    },
    {
        id: 'p2',
        name: 'Care24 Home Healthcare',
        rating: 4.7,
        reviewsCount: '12.1k',
        accreditation: 'NABL Partner • Background Verified',
        nextSlot: 'Tomorrow, 9:00 AM',
        startingPrice: 600,
        servicesOffered: [
            { name: 'Home Nursing', category: 'nursing', icon: 'user', price: 1200 },
            { name: 'Elder Care', category: 'elder', icon: 'heart', price: 900 },
            { name: 'Patient Attendant', category: 'elder', icon: 'smile', price: 600 },
        ],
        features: ['24/7 Support Desk', 'Certified RN Staff', 'Regular Doctor Audits'],
        phone: '+919876543211',
        address: 'Andheri East, Mumbai',
        badgeColor: '#1C6ED5',
        isVerified: true,
        badgeText: 'BESTSELLER',
    },
    {
        id: 'p3',
        name: 'Emoha Elder & Home Care',
        rating: 4.9,
        reviewsCount: '5.6k',
        accreditation: 'Aged Care Accredited • Verified Staff',
        nextSlot: 'Today, 6:00 PM',
        startingPrice: 799,
        servicesOffered: [
            { name: 'Elder Care', category: 'elder', icon: 'heart', price: 799 },
            { name: 'Dementia Care', category: 'elder', icon: 'brain', price: 1500 },
            { name: 'Companion Visit', category: 'elder', icon: 'smile', price: 500 },
        ],
        features: ['Personal Health Manager', 'Smart SOS Device Support', 'Daily Vital Monitoring'],
        phone: '+919876543212',
        address: 'Khar West, Mumbai',
        badgeColor: '#EC4899',
        isVerified: true,
    },
    {
        id: 'p4',
        name: 'Apollo Home Healthcare',
        rating: 4.9,
        reviewsCount: '15.4k',
        accreditation: 'JCI Accredited Hospital Backed',
        nextSlot: 'Today, 3:30 PM',
        startingPrice: 999,
        servicesOffered: [
            { name: 'ICU at Home', category: 'icu', icon: 'briefcase-medical', price: 3999 },
            { name: 'Home Nursing', category: 'nursing', icon: 'user', price: 1500 },
            { name: 'Physiotherapy', category: 'physio', icon: 'activity', price: 799 },
            { name: 'Equipment Rental', category: 'equipment', icon: 'box', price: 450 },
        ],
        features: ['Hospital-Quality Safety Protocols', 'Continuous Clinical Supervision', 'Apollo Doctor Consultation'],
        phone: '+919876543213',
        address: 'Lower Parel, Mumbai',
        badgeColor: '#059669',
        isVerified: true,
        badgeText: 'ICU SETUP',
    },
    {
        id: 'p5',
        name: 'HealYos Physiotherapy & Rehab',
        rating: 4.8,
        reviewsCount: '4.1k',
        accreditation: 'Specialty Physiotherapy Network',
        nextSlot: 'Tomorrow, 8:00 AM',
        startingPrice: 599,
        servicesOffered: [
            { name: 'Physiotherapy', category: 'physio', icon: 'activity', price: 599 },
            { name: 'Post-Surgery Rehab', category: 'physio', icon: 'shield-check', price: 699 },
            { name: 'Sports Injury Care', category: 'physio', icon: 'crosshair', price: 799 },
        ],
        features: ['Certified MPT Therapists', 'Laser & Electrotherapy Kits', 'Exercise App Integration'],
        phone: '+919876543214',
        address: 'Juhu, Mumbai',
        badgeColor: '#D97706',
        isVerified: true,
    },
];

export const OFFERS_DATA = [
    {
        id: 'o1',
        title: 'Flat 20% OFF • Physio visits',
        desc: 'Book expert physiotherapists at home. Relief from back, joint, & neck pain.',
        code: 'PORTPHY20',
        colors: ['#F472B6', '#EC4899', '#E11D48'],
        tag: 'SPECIAL OFFER',
    },
    {
        id: 'o2',
        title: 'Free ICU Setup Consultation',
        desc: 'Critical care ICU setups at home. Certified nurses & 24/7 doctor supervision.',
        code: 'ICUFREE',
        colors: ['#38BDF8', '#0EA5E9', '#0284C7'],
        tag: 'CRITICAL CARE',
    },
    {
        id: 'o3',
        title: 'Buy 10 Nursing Shifts, Get 1 Free',
        desc: 'Professional nursing care for post-surgery recovery, wound care, and IV infusions.',
        code: 'NURSEFREE',
        colors: ['#34D399', '#059669', '#047857'],
        tag: 'NURSING CARE',
    },
];

/* ================= MAIN COMPONENT ================= */

export default function HomeCareListScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    /* ---------------- Filtering Logic ---------------- */

    const filteredProviders = useMemo(() => {
        let result = PROVIDERS_DATA;

        // Filter by category selection
        if (selectedCategory !== 'all') {
            result = result.filter((prov) =>
                prov.servicesOffered.some((srv) => srv.category === selectedCategory)
            );
        }

        // Filter by search query
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (prov) =>
                    prov.name.toLowerCase().includes(q) ||
                    prov.address.toLowerCase().includes(q) ||
                    prov.accreditation.toLowerCase().includes(q) ||
                    prov.servicesOffered.some((s) => s.name.toLowerCase().includes(q))
            );
        }

        return result;
    }, [selectedCategory, searchQuery]);

    const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all';

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
    };

    const callNumber = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
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
                    <Text style={styles.headerTitle}>Home Care & Nursing</Text>
                    <View style={styles.locationRow}>
                        <AppIcon name="map-pin" size={12} color="#EC4899" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            Home Visit • Bandra West, Mumbai
                        </Text>
                    </View>
                </View>
            </View>

            {/* ---------- Search Box ---------- */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        placeholder="Search providers, nursing, physiotherapy, elder care..."
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
            </View>

            {/* ---------- Service Category Chips ---------- */}
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

            {/* ---------- Main Content Scroll ---------- */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Promo Ads & Offers Carousel */}
                <View style={styles.promoCarouselContainer}>
                    <FlatList
                        data={OFFERS_DATA}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        snapToInterval={SCREEN_WIDTH - 32}
                        decelerationRate="fast"
                        renderItem={({ item }) => (
                            <LinearGradient
                                colors={item.colors as any}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.promoCard}
                            >
                                <View style={styles.promoHeader}>
                                    <View style={styles.promoTagBadge}>
                                        <Text style={styles.promoTagText}>{item.tag}</Text>
                                    </View>
                                    <View style={styles.promoCodeBadge}>
                                        <Text style={styles.promoCodeText}>CODE: {item.code}</Text>
                                    </View>
                                </View>
                                <Text style={styles.promoTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.promoDesc} numberOfLines={2}>{item.desc}</Text>
                            </LinearGradient>
                        )}
                    />
                </View>

                <View style={styles.subHeaderBar}>
                    <Text style={styles.resultsCountText}>Verified Home Care Providers ({filteredProviders.length})</Text>
                </View>

                {/* HOME CARE PROVIDERS LIST */}
                <View style={styles.listSection}>
                    {filteredProviders.map((item) => (
                        <View key={item.id} style={styles.serviceCard}>
                            {/* Top Meta Row */}
                            <View style={styles.cardTopMetaRow}>
                                <View style={styles.verifiedMetaBadge}>
                                    <AppIcon name="shield-check" size={12} color="#059669" />
                                    <Text style={styles.verifiedMetaText}>Verified Partner</Text>
                                </View>

                                {item.badgeText && (
                                    <View style={styles.badgeRibbon}>
                                        <Text style={styles.badgeRibbonText}>{item.badgeText}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Main Service Header */}
                            <TouchableOpacity
                                activeOpacity={0.9}
                                style={styles.cardHeaderRow}
                                onPress={() => navigation.navigate('HomeCareDetail', { providerId: item.id })}
                            >
                                <View style={styles.iconAvatar}>
                                    <AppIcon name="home" size={24} color="#EC4899" />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.serviceTitle} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
                                    
                                    <View style={styles.metaRow}>
                                        <AppIcon name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.ratingText}>{item.rating}</Text>
                                        <Text style={styles.reviewText}>({item.reviewsCount})</Text>
                                        <Text style={styles.dotSeparator}>•</Text>
                                        <Text style={styles.accreditationText} numberOfLines={1} ellipsizeMode="tail">{item.accreditation}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Key Highlights */}
                            <View style={styles.highlightsWrapper}>
                                <View style={styles.highlightsGrid}>
                                    {item.features.slice(0, 2).map((feat, idx) => (
                                        <View key={idx} style={styles.highlightItem}>
                                            <Text style={styles.highlightCheck}>✓</Text>
                                            <Text style={styles.highlightText} numberOfLines={1} ellipsizeMode="tail">{feat}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.cardDivider} />

                            {/* Card Footer Pricing & Actions */}
                            <View style={styles.cardFooter}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.shiftTypeText}>Starting from</Text>
                                    <Text style={styles.cardPrice}>₹{item.startingPrice} <Text style={styles.cardPriceUnit}>/ visit</Text></Text>
                                </View>

                                <View style={styles.actionsGroup}>
                                    <TouchableOpacity
                                        style={styles.bookVisitButton}
                                        onPress={() => navigation.navigate('HomeCareDetail', { providerId: item.id })}
                                        activeOpacity={0.85}
                                    >
                                        <LinearGradient
                                            colors={['#F472B6', '#EC4899']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.bookVisitGradient}
                                        >
                                            <Text style={styles.bookVisitText} numberOfLines={1}>View Services</Text>
                                            <AppIcon name="chevron-right" size={14} color="#FFFFFF" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* GRAPHIC EMPTY STATE */}
                {filteredProviders.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <View style={styles.illustrationWrapper}>
                            <LinearGradient
                                colors={['#FDF2F8', '#FCE7F3', '#FBCFE8']}
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
                                ? 'No Providers Found'
                                : selectedCategory !== 'all'
                                ? `No Providers for ${selectedCategory.toUpperCase()}`
                                : "No Providers Available"}
                        </Text>

                        <Text style={styles.emptySubtitle}>
                            {searchQuery.trim() !== ''
                                ? `We couldn't find any home care providers matching "${searchQuery}". Check for typos or search for different specialties.`
                                : 'No verified agencies offer services under this category in your area right now. Try resetting filters.'}
                        </Text>

                        {hasActiveFilters && (
                            <View style={styles.emptyActionsRow}>
                                <TouchableOpacity style={styles.resetFilterButton} onPress={resetAllFilters} activeOpacity={0.8}>
                                    <LinearGradient colors={['#F472B6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.resetFilterGradient}>
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
    searchBarContainer: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchBox: {
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
        backgroundColor: '#EC4899',
        borderColor: '#EC4899',
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
    scrollContent: {
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    promoCarouselContainer: {
        marginBottom: 16,
    },
    promoCard: {
        width: SCREEN_WIDTH - 32,
        borderRadius: 20,
        padding: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    promoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    promoTagBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    promoTagText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    promoCodeBadge: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    promoCodeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    promoTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    promoDesc: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 12,
        lineHeight: 18,
    },
    subHeaderBar: {
        marginBottom: 10,
    },
    resultsCountText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    listSection: {
        gap: 14,
    },
    serviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTopMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    verifiedMetaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    verifiedMetaText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    badgeRibbon: {
        backgroundColor: '#EC4899',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeRibbonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 12,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 12,
        alignItems: 'center',
    },
    iconAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
    },
    reviewText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    dotSeparator: {
        color: '#94A3B8',
        marginHorizontal: 2,
    },
    accreditationText: {
        fontSize: 12,
        color: '#64748B',
        flex: 1,
    },
    durationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        maxWidth: '100%',
    },
    durationText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#EC4899',
        flexShrink: 1,
    },
    featuresWrapper: {
        marginBottom: 10,
    },
    featuresLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        maxWidth: '100%',
    },
    featurePillActive: {
        backgroundColor: '#EC4899',
        borderColor: '#EC4899',
    },
    featurePillText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
        flexShrink: 1,
    },
    featurePillTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    highlightsWrapper: {
        marginBottom: 10,
        marginTop: 4,
    },
    highlightsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    highlightItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
    },
    highlightCheck: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    highlightText: {
        fontSize: 11,
        color: '#64748B',
        flexShrink: 1,
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
    cardPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
    },
    cardPriceUnit: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    shiftTypeText: {
        fontSize: 11,
        color: '#64748B',
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
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    bookVisitButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    bookVisitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    bookVisitText: {
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
});
