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

type TabType = 'packages' | 'tests' | 'labs';

interface LabPackageItem {
    id: string;
    title: string;
    category: string;
    labName: string;
    price: number;
    originalPrice: number;
    discount: string;
    tat: string;
    fasting: string;
    accreditation: string;
    testCount: number;
    includes: string[];
    isBestseller?: boolean;
}

interface IndividualTestItem {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice: number;
    discount: string;
    tat: string;
    fasting: string;
    labName: string;
    sampleType: string;
}

interface DiagnosticLabItem {
    id: string;
    name: string;
    rating: number;
    reviewsCount: string;
    testsAvailable: string;
    accreditation: string;
    nextSlot: string;
    badgeColor: string;
    address: string;
}

const CATEGORIES = [
    { id: 'all', label: 'All', icon: 'flask' },
    { id: 'full_body', label: 'Full Body', icon: 'shield-check' },
    { id: 'diabetes', label: 'Diabetes', icon: 'droplet' },
    { id: 'heart', label: 'Heart Care', icon: 'heart' },
    { id: 'thyroid', label: 'Thyroid', icon: 'sun' },
    { id: 'vitamins', label: 'Vitamins', icon: 'pill' },
    { id: 'fever', label: 'Fever Panel', icon: 'thermometer' },
    { id: 'women', label: "Women's Health", icon: 'smile' },
    { id: 'labs', label: 'Path Labs', icon: 'hospital' },
];

const PROMO_BANNERS = [
    {
        id: 'b1',
        title: 'Full Body Health Shield',
        subtitle: '75 Essential Health Parameters Included',
        badge: 'FLAT 72% OFF',
        price: 799,
        originalPrice: 2800,
        gradient: ['#1E3A8A', '#2563EB', '#3B82F6'],
        tag: 'Most Popular',
    },
    {
        id: 'b2',
        title: 'Advanced Diabetes & Cardiac Panel',
        subtitle: 'HbA1c + Lipid Profile + Kidney Function',
        badge: 'FAST 12HR REPORT',
        price: 499,
        originalPrice: 1650,
        gradient: ['#065F46', '#059669', '#10B981'],
        tag: 'Fast Results',
    },
    {
        id: 'b3',
        title: 'Active Vitamin D3 & B12 Panel',
        subtitle: 'Complete Bone & Nerve Vitality Check',
        badge: 'FREE HOME PICKUP',
        price: 599,
        originalPrice: 1990,
        gradient: ['#6B21A8', '#7C3AED', '#8B5CF6'],
        tag: 'Best Value',
    },
];

const PACKAGES_DATA: LabPackageItem[] = [
    {
        id: 'pkg1',
        title: 'Full Body Health Shield (75 Tests)',
        category: 'full_body',
        labName: 'Thyrocare Diagnostics',
        price: 799,
        originalPrice: 2800,
        discount: '72% OFF',
        tat: '12-24 Hrs',
        fasting: '10-12 Hrs Fasting Required',
        accreditation: 'NABL & CAP Certified',
        testCount: 75,
        includes: ['CBC (24)', 'Lipid Profile (8)', 'Liver Function (11)', 'Kidney Function (10)', 'Thyroid (3)', 'Fasting Blood Sugar', 'HbA1c'],
        isBestseller: true,
    },
    {
        id: 'pkg2',
        title: 'Diabetes & Metabolic Health Panel',
        category: 'diabetes',
        labName: 'Dr. Lal PathLabs',
        price: 399,
        originalPrice: 1200,
        discount: '67% OFF',
        tat: '12 Hrs',
        fasting: '8-10 Hrs Fasting Required',
        accreditation: 'NABL Certified',
        testCount: 18,
        includes: ['Fasting Blood Sugar', 'Post Prandial Sugar', 'HbA1c Average Glucose', 'Serum Insulin', 'Kidney Screen'],
        isBestseller: true,
    },
    {
        id: 'pkg3',
        title: 'Advanced Cardiac & Heart Care',
        category: 'heart',
        labName: 'Metropolis Healthcare',
        price: 899,
        originalPrice: 2500,
        discount: '64% OFF',
        tat: '24 Hrs',
        fasting: '12 Hrs Fasting Required',
        accreditation: 'NABL & ISO Certified',
        testCount: 22,
        includes: ['hs-CRP', 'Lipid Profile Max', 'Apolipoprotein A1 & B', 'Homocysteine', 'Serum Calcium'],
    },
    {
        id: 'pkg4',
        title: 'Active Vitamin D3 & B12 Vitality Package',
        category: 'vitamins',
        labName: 'Apollo Diagnostics',
        price: 599,
        originalPrice: 1990,
        discount: '70% OFF',
        tat: '18 Hrs',
        fasting: 'No Fasting Required',
        accreditation: 'NABL Certified',
        testCount: 12,
        includes: ['Vitamin D (25-OH)', 'Vitamin B12 (Cyanocobalamin)', 'Calcium', 'Iron Profile', 'Total Anemia Care'],
        isBestseller: true,
    },
    {
        id: 'pkg5',
        title: 'Thyroid Function Ultra Panel',
        category: 'thyroid',
        labName: 'Thyrocare Diagnostics',
        price: 349,
        originalPrice: 950,
        discount: '63% OFF',
        tat: '12 Hrs',
        fasting: 'No Fasting Required',
        accreditation: 'NABL & CAP Certified',
        testCount: 6,
        includes: ['T3 (Triiodothyronine)', 'T4 (Thyroxine)', 'TSH (Thyroid Stimulating)', 'Anti-TPO Antibodies'],
    },
    {
        id: 'pkg6',
        title: 'Comprehensive Fever & Dengue Panel',
        category: 'fever',
        labName: 'SRL Diagnostics',
        price: 499,
        originalPrice: 1450,
        discount: '65% OFF',
        tat: '6-12 Hrs',
        fasting: 'No Fasting Required',
        accreditation: 'NABL Certified',
        testCount: 16,
        includes: ['Complete Blood Count (CBC)', 'Dengue NS1 Antigen', 'Dengue IgG/IgM', 'Typhoid Widal Test', 'Malarial Parasite'],
    },
    {
        id: 'pkg7',
        title: "Women's Complete Health Care",
        category: 'women',
        labName: 'Redcliffe Labs',
        price: 999,
        originalPrice: 3200,
        discount: '69% OFF',
        tat: '24 Hrs',
        fasting: '10-12 Hrs Fasting Required',
        accreditation: 'NABL & CAP Certified',
        testCount: 45,
        includes: ['Hormone Panel (FSH, LH, Prolactin)', 'Thyroid', 'Iron Profile', 'Calcium', 'CBC', 'Kidney & Liver Function'],
    },
];

const TESTS_DATA: IndividualTestItem[] = [
    {
        id: 'test1',
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'diabetes',
        price: 249,
        originalPrice: 600,
        discount: '58% OFF',
        tat: '8 Hrs',
        fasting: 'No Fasting Required',
        labName: 'Dr. Lal PathLabs',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test2',
        name: 'Lipid Profile (Complete Cholesterol)',
        category: 'heart',
        price: 329,
        originalPrice: 850,
        discount: '61% OFF',
        tat: '12 Hrs',
        fasting: '12 Hrs Fasting Required',
        labName: 'Thyrocare Diagnostics',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test3',
        name: 'Thyroid Stimulating Hormone (TSH)',
        category: 'thyroid',
        price: 199,
        originalPrice: 450,
        discount: '55% OFF',
        tat: '8 Hrs',
        fasting: 'No Fasting Required',
        labName: 'Thyrocare Diagnostics',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test4',
        name: 'Complete Blood Count (CBC with ESR)',
        category: 'full_body',
        price: 249,
        originalPrice: 550,
        discount: '54% OFF',
        tat: '6 Hrs',
        fasting: 'No Fasting Required',
        labName: 'Metropolis Healthcare',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test5',
        name: 'Vitamin D 25-Hydroxy',
        category: 'vitamins',
        price: 399,
        originalPrice: 1200,
        discount: '66% OFF',
        tat: '18 Hrs',
        fasting: 'No Fasting Required',
        labName: 'Apollo Diagnostics',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test6',
        name: 'Liver Function Test (LFT Panel)',
        category: 'full_body',
        price: 379,
        originalPrice: 950,
        discount: '60% OFF',
        tat: '12 Hrs',
        fasting: '8 Hrs Fasting Required',
        labName: 'Dr. Lal PathLabs',
        sampleType: 'Blood Sample',
    },
    {
        id: 'test7',
        name: 'Kidney Function Test (KFT / RFT)',
        category: 'full_body',
        price: 349,
        originalPrice: 890,
        discount: '60% OFF',
        tat: '12 Hrs',
        fasting: 'No Fasting Required',
        labName: 'Redcliffe Labs',
        sampleType: 'Blood Sample',
    },
];

const LABS_DATA: DiagnosticLabItem[] = [
    {
        id: 'lab1',
        name: 'Thyrocare Diagnostics',
        rating: 4.8,
        reviewsCount: '12.4k',
        testsAvailable: '2500+ Tests',
        accreditation: 'NABL & CAP Accredited',
        nextSlot: 'Tomorrow, 6:00 AM',
        badgeColor: '#7C3AED',
        address: 'Central Diagnostic Hub • Free Home Pickup',
    },
    {
        id: 'lab2',
        name: 'Dr. Lal PathLabs',
        rating: 4.7,
        reviewsCount: '18.9k',
        testsAvailable: '3000+ Tests',
        accreditation: 'NABL Accredited',
        nextSlot: 'Today, 5:30 PM',
        badgeColor: '#1C6ED5',
        address: 'Regional Reference Lab • 30 Mins Slot',
    },
    {
        id: 'lab3',
        name: 'Metropolis Healthcare',
        rating: 4.8,
        reviewsCount: '9.2k',
        testsAvailable: '2200+ Tests',
        accreditation: 'NABL & ISO Certified',
        nextSlot: 'Tomorrow, 7:00 AM',
        badgeColor: '#059669',
        address: 'Global Diagnostics Network • Express Reports',
    },
    {
        id: 'lab4',
        name: 'Apollo Diagnostics',
        rating: 4.9,
        reviewsCount: '15.1k',
        testsAvailable: '2800+ Tests',
        accreditation: 'NABL & CAP Certified',
        nextSlot: 'Today, 6:00 PM',
        badgeColor: '#D97706',
        address: 'Hospital Backed Quality • Automated Lab',
    },
    {
        id: 'lab5',
        name: 'Redcliffe Labs',
        rating: 4.6,
        reviewsCount: '7.8k',
        testsAvailable: '1800+ Tests',
        accreditation: 'NABL Certified',
        nextSlot: 'Tomorrow, 6:30 AM',
        badgeColor: '#E11D48',
        address: 'Smart Diagnostic Center • Temperature Controlled',
    },
];

/* ================= MAIN COMPONENT ================= */

export default function LabListScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState<TabType>('packages');
    const [selectedCart, setSelectedCart] = useState<any[]>([]);

    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortModalVisible, setSortModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high' | 'discount'>('popularity');

    /* ---------------- Filtering & Search Logic ---------------- */

    const filteredPackages = useMemo(() => {
        let result = PACKAGES_DATA;

        if (selectedCategory !== 'all' && selectedCategory !== 'labs') {
            result = result.filter((item) => item.category === selectedCategory);
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.title.toLowerCase().includes(q) ||
                    item.labName.toLowerCase().includes(q) ||
                    item.includes.some((inc) => inc.toLowerCase().includes(q))
            );
        }

        if (sortBy === 'price_low') result = [...result].sort((a, b) => a.price - b.price);
        if (sortBy === 'price_high') result = [...result].sort((a, b) => b.price - a.price);
        if (sortBy === 'discount') result = [...result].sort((a, b) => b.originalPrice - b.price - (a.originalPrice - a.price));

        return result;
    }, [selectedCategory, searchQuery, sortBy]);

    const filteredTests = useMemo(() => {
        let result = TESTS_DATA;

        if (selectedCategory !== 'all' && selectedCategory !== 'labs') {
            result = result.filter((item) => item.category === selectedCategory);
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(q) ||
                    item.labName.toLowerCase().includes(q)
            );
        }

        if (sortBy === 'price_low') result = [...result].sort((a, b) => a.price - b.price);
        if (sortBy === 'price_high') result = [...result].sort((a, b) => b.price - a.price);

        return result;
    }, [selectedCategory, searchQuery, sortBy]);

    const filteredLabs = useMemo(() => {
        let result = LABS_DATA;

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter((item) => item.name.toLowerCase().includes(q) || item.address.toLowerCase().includes(q));
        }

        return result;
    }, [searchQuery]);

    /* ---------------- Cart Management ---------------- */

    const toggleCartItem = (item: any) => {
        const exists = selectedCart.some((c) => c.id === item.id);
        if (exists) {
            setSelectedCart(selectedCart.filter((c) => c.id !== item.id));
        } else {
            setSelectedCart([...selectedCart, item]);
        }
    };

    const cartTotalPrice = useMemo(() => {
        return selectedCart.reduce((sum, item) => sum + (item.price || 0), 0);
    }, [selectedCart]);

    const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || sortBy !== 'popularity';

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSortBy('popularity');
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'price_low': return 'Price: Low to High';
            case 'price_high': return 'Price: High to Low';
            case 'discount': return 'Highest Discount';
            default: return 'Popularity';
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
                    <Text style={styles.headerTitle}>Lab Tests & Packages</Text>
                    <View style={styles.locationRow}>
                        <AppIcon name="map-pin" size={12} color="#7C3AED" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            Home Sample Pick-up • 400001
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.cartHeaderButton}
                    onPress={() => {
                        if (selectedCart.length > 0) {
                            navigation.navigate('LabDetail', { labId: 'lab1' });
                        }
                    }}
                >
                    <AppIcon name="shopping-bag" size={22} color="#1C1C1E" />
                    {selectedCart.length > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{selectedCart.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* ---------- Search Box ---------- */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        placeholder="Search 1000+ tests, full body packages, labs..."
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
                                onPress={() => {
                                    setSelectedCategory(cat.id);
                                    if (cat.id === 'labs') setActiveTab('labs');
                                    else if (activeTab === 'labs') setActiveTab('packages');
                                }}
                            >
                                <AppIcon
                                    name={cat.icon as any}
                                    size={14}
                                    color={isSelected ? '#FFFFFF' : '#6B7280'}
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
                    style={[styles.tabButton, activeTab === 'packages' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('packages')}
                >
                    <Text style={[styles.tabText, activeTab === 'packages' && styles.tabTextActive]}>
                        Health Packages ({filteredPackages.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'tests' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('tests')}
                >
                    <Text style={[styles.tabText, activeTab === 'tests' && styles.tabTextActive]}>
                        Single Tests ({filteredTests.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'labs' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('labs')}
                >
                    <Text style={[styles.tabText, activeTab === 'labs' && styles.tabTextActive]}>
                        Path Labs ({filteredLabs.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ---------- Main Content Scroll ---------- */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Promo Banner Carousel */}
                {searchQuery === '' && selectedCategory === 'all' && activeTab === 'packages' && (
                    <View style={styles.promoSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={SCREEN_WIDTH * 0.85 + 12} decelerationRate="fast" contentContainerStyle={styles.bannerRow}>
                            {PROMO_BANNERS.map((banner) => (
                                <LinearGradient
                                    key={banner.id}
                                    colors={banner.gradient as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.bannerCard}
                                >
                                    <View style={styles.bannerBadgeRow}>
                                        <View style={styles.bannerTagBadge}>
                                            <Text style={styles.bannerTagText}>{banner.tag}</Text>
                                        </View>
                                        <Text style={styles.bannerDiscountBadge}>{banner.badge}</Text>
                                    </View>

                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>

                                    <View style={styles.bannerFooter}>
                                        <View style={styles.bannerPriceRow}>
                                            <Text style={styles.bannerPrice}>₹{banner.price}</Text>
                                            <Text style={styles.bannerOriginalPrice}>₹{banner.originalPrice}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.bannerButton}
                                            onPress={() => toggleCartItem({ id: banner.id, title: banner.title, price: banner.price })}
                                        >
                                            <Text style={styles.bannerButtonText}>
                                                {selectedCart.some((c) => c.id === banner.id) ? 'Added ✓' : 'Book Package'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Sub-header Filter & Sort row */}
                <View style={styles.subHeaderBar}>
                    <Text style={styles.resultsCountText}>
                        Showing {activeTab === 'packages' ? filteredPackages.length : activeTab === 'tests' ? filteredTests.length : filteredLabs.length} Results
                    </Text>
                    <TouchableOpacity style={styles.sortTrigger} onPress={() => setSortModalVisible(true)}>
                        <Text style={styles.sortTriggerText}>{getSortLabel()}</Text>
                        <AppIcon name="chevron-down" size={14} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* TAB 1: HEALTH PACKAGES */}
                {activeTab === 'packages' && (
                    <View style={styles.listSection}>
                        {filteredPackages.map((item) => {
                            const isAdded = selectedCart.some((c) => c.id === item.id);
                            return (
                                <View key={item.id} style={styles.packageCard}>
                                    {item.isBestseller && (
                                        <View style={styles.bestsellerRibbon}>
                                            <AppIcon name="star" size={10} color="#FFFFFF" />
                                            <Text style={styles.bestsellerText}>BESTSELLER</Text>
                                        </View>
                                    )}

                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.labBadge}>
                                            <AppIcon name="flask" size={14} color="#7C3AED" />
                                            <Text style={styles.labBadgeText}>{item.labName}</Text>
                                        </View>
                                        <View style={styles.tatBadge}>
                                            <AppIcon name="clock" size={12} color="#059669" />
                                            <Text style={styles.tatBadgeText}>{item.tat}</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => navigation.navigate('LabDetail', { labId: item.id })}
                                    >
                                        <Text style={styles.packageTitle}>{item.title}</Text>
                                        <Text style={styles.packageFasting}>{item.fasting}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.includesPillWrapper}>
                                        <Text style={styles.includesLabel}>Included ({item.testCount} Tests):</Text>
                                        <View style={styles.includesGrid}>
                                            {item.includes.slice(0, 4).map((inc, i) => (
                                                <View key={i} style={styles.includeChip}>
                                                    <Text style={styles.includeChipText}>{inc}</Text>
                                                </View>
                                            ))}
                                            {item.includes.length > 4 && (
                                                <View style={styles.moreChip}>
                                                    <Text style={styles.moreChipText}>+{item.includes.length - 4} more</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    <View style={styles.cardDivider} />

                                    <View style={styles.cardFooter}>
                                        <View>
                                            <View style={styles.priceRow}>
                                                <Text style={styles.cardPrice}>₹{item.price}</Text>
                                                <Text style={styles.cardOriginalPrice}>₹{item.originalPrice}</Text>
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountBadgeText}>{item.discount}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.accreditationText}>{item.accreditation}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.addCartButton, isAdded && styles.addCartButtonActive]}
                                            onPress={() => toggleCartItem(item)}
                                            activeOpacity={0.8}
                                        >
                                            {isAdded ? (
                                                <Text style={styles.addCartTextActive}>Added ✓</Text>
                                            ) : (
                                                <>
                                                    <AppIcon name="plus" size={14} color="#FFFFFF" />
                                                    <Text style={styles.addCartText}>Add Test</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* TAB 2: INDIVIDUAL TESTS */}
                {activeTab === 'tests' && (
                    <View style={styles.listSection}>
                        {filteredTests.map((item) => {
                            const isAdded = selectedCart.some((c) => c.id === item.id);
                            return (
                                <View key={item.id} style={styles.testCard}>
                                    <View style={styles.testMain}>
                                        <View style={styles.testIconWrapper}>
                                            <AppIcon name="test-tube" size={20} color="#2563EB" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.testName}>{item.name}</Text>
                                            <Text style={styles.testSubinfo}>{item.sampleType} • {item.fasting}</Text>
                                            <View style={styles.testTagsRow}>
                                                <View style={styles.tagPill}>
                                                    <AppIcon name="clock" size={10} color="#059669" />
                                                    <Text style={styles.tagPillText}>Report in {item.tat}</Text>
                                                </View>
                                                <Text style={styles.testLabText}>by {item.labName}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.testFooter}>
                                        <View style={styles.priceRow}>
                                            <Text style={styles.cardPrice}>₹{item.price}</Text>
                                            <Text style={styles.cardOriginalPrice}>₹{item.originalPrice}</Text>
                                            <Text style={styles.testDiscountText}>{item.discount}</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={[styles.addCartButtonSmall, isAdded && styles.addCartButtonActive]}
                                            onPress={() => toggleCartItem(item)}
                                        >
                                            <Text style={[styles.addCartTextSmall, isAdded && styles.addCartTextActive]}>
                                                {isAdded ? 'Added ✓' : '+ Add'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* TAB 3: PATH LAB PROVIDERS */}
                {activeTab === 'labs' && (
                    <View style={styles.listSection}>
                        {filteredLabs.map((lab) => (
                            <TouchableOpacity
                                key={lab.id}
                                style={styles.labCard}
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('LabDetail', { labId: lab.id })}
                            >
                                <View style={styles.labCardHeader}>
                                    <View style={[styles.labAvatar, { backgroundColor: `${lab.badgeColor}15` }]}>
                                        <AppIcon name="hospital" size={24} color={lab.badgeColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Text style={styles.labCardName}>{lab.name}</Text>
                                            <View style={styles.ratingBadge}>
                                                <AppIcon name="star" size={12} color="#F59E0B" />
                                                <Text style={styles.ratingBadgeText}>{lab.rating}</Text>
                                                <Text style={styles.ratingCountText}>({lab.reviewsCount})</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.labCardAddress}>{lab.address}</Text>
                                    </View>
                                </View>

                                <View style={styles.labMetaRow}>
                                    <View style={styles.labMetaChip}>
                                        <AppIcon name="shield-check" size={12} color="#059669" />
                                        <Text style={styles.labMetaText}>{lab.accreditation}</Text>
                                    </View>
                                    <View style={styles.labMetaChip}>
                                        <AppIcon name="flask" size={12} color="#7C3AED" />
                                        <Text style={styles.labMetaText}>{lab.testsAvailable}</Text>
                                    </View>
                                </View>

                                <View style={styles.labCardFooter}>
                                    <View style={styles.slotRow}>
                                        <AppIcon name="clock" size={12} color="#6B7280" />
                                        <Text style={styles.slotText}>Next Pickup: {lab.nextSlot}</Text>
                                    </View>
                                    <View style={styles.browseLabButton}>
                                        <Text style={styles.browseLabText}>View Tests</Text>
                                        <AppIcon name="chevron-right" size={14} color="#1C6ED5" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* GRAPHIC EMPTY STATE */}
                {((activeTab === 'packages' && filteredPackages.length === 0) ||
                    (activeTab === 'tests' && filteredTests.length === 0) ||
                    (activeTab === 'labs' && filteredLabs.length === 0)) && (
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
                                ? 'No Lab Tests Found'
                                : selectedCategory !== 'all'
                                ? `No ${selectedCategory.toUpperCase()} Tests`
                                : "We couldn't find any lab tests"}
                        </Text>

                        <Text style={styles.emptySubtitle}>
                            {searchQuery.trim() !== ''
                                ? `We couldn't find any tests matching "${searchQuery}". Try checking for typos or search for packages.`
                                : selectedCategory !== 'all'
                                ? `No tests available under this category right now. Try clearing filters to see all available tests.`
                                : 'We couldn\'t find any lab tests matching your active criteria. Try resetting your search and filters.'}
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

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ---------- STICKY CART BAR ---------- */}
            {selectedCart.length > 0 && (
                <View style={[styles.stickyCartBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
                    <LinearGradient colors={['#1C6ED5', '#1557B0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.stickyCartGradient}>
                        <View style={styles.cartInfoSection}>
                            <View style={styles.cartCountBadge}>
                                <Text style={styles.cartCountText}>{selectedCart.length}</Text>
                            </View>
                            <View>
                                <Text style={styles.cartSummaryTitle}>
                                    {selectedCart.length} Test{selectedCart.length !== 1 ? 's' : ''} Selected
                                </Text>
                                <Text style={styles.cartSummaryPrice}>₹{cartTotalPrice.toLocaleString()}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={() => navigation.navigate('LabDetail', { labId: selectedCart[0]?.id || 'lab1' })}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.checkoutText}>Proceed to Book</Text>
                            <AppIcon name="arrow-right" size={16} color="#1C6ED5" />
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            )}

            {/* ---------- SORT MODAL ---------- */}
            <Modal visible={sortModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setSortModalVisible(false)}>
                        <View style={styles.modalBackdrop} />
                    </TouchableWithoutFeedback>

                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
                        <Text style={styles.modalTitle}>Sort Tests By</Text>
                        {[
                            { id: 'popularity', label: 'Popularity' },
                            { id: 'price_low', label: 'Price: Low to High' },
                            { id: 'price_high', label: 'Price: High to Low' },
                            { id: 'discount', label: 'Highest Discount' },
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
                            <Text style={styles.modalTitle}>Filter Lab Tests</Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <AppIcon name="x" size={22} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterSectionTitle}>Categories</Text>
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
    cartHeaderButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
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
        backgroundColor: '#7C3AED',
        borderColor: '#7C3AED',
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
        borderBottomColor: '#7C3AED',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
    },
    tabTextActive: {
        fontWeight: '700',
        color: '#7C3AED',
    },
    scrollContent: {
        paddingTop: 12,
        paddingHorizontal: 16,
    },
    promoSection: {
        marginBottom: 16,
    },
    bannerRow: {
        gap: 12,
    },
    bannerCard: {
        width: SCREEN_WIDTH * 0.85,
        borderRadius: 20,
        padding: 18,
        justifyContent: 'space-between',
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    bannerBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bannerTagBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bannerTagText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    bannerDiscountBadge: {
        color: '#FDE047',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bannerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    bannerSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        marginBottom: 16,
    },
    bannerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerPriceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    bannerPrice: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    bannerOriginalPrice: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        textDecorationLine: 'line-through',
    },
    bannerButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    bannerButtonText: {
        color: '#1E3A8A',
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
        gap: 12,
    },
    packageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    bestsellerRibbon: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    bestsellerText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    labBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F3FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    labBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#7C3AED',
    },
    tatBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tatBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669',
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    packageFasting: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 10,
    },
    includesPillWrapper: {
        marginBottom: 12,
    },
    includesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 6,
    },
    includesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    includeChip: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    includeChipText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '500',
    },
    moreChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    moreChipText: {
        fontSize: 11,
        color: '#2563EB',
        fontWeight: '600',
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
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardPrice: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    cardOriginalPrice: {
        fontSize: 13,
        color: '#94A3B8',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountBadgeText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
    },
    accreditationText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    addCartButton: {
        backgroundColor: '#7C3AED',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    addCartButtonActive: {
        backgroundColor: '#059669',
    },
    addCartText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    addCartTextActive: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    testCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    testMain: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    testIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    testName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
    },
    testSubinfo: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    testTagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagPillText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#059669',
    },
    testLabText: {
        fontSize: 11,
        color: '#94A3B8',
    },
    testFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    testDiscountText: {
        color: '#EF4444',
        fontSize: 11,
        fontWeight: '700',
    },
    addCartButtonSmall: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    addCartTextSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    labCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    labCardHeader: {
        flexDirection: 'row',
        gap: 12,
    },
    labAvatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    labCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    labCardAddress: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
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
    labMetaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    labMetaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    labMetaText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#475569',
    },
    labCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    slotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    slotText: {
        fontSize: 12,
        color: '#64748B',
    },
    browseLabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    browseLabText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C6ED5',
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
    stickyCartBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    stickyCartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    cartInfoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cartCountBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartCountText: {
        color: '#1C6ED5',
        fontSize: 14,
        fontWeight: '800',
    },
    cartSummaryTitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 11,
        fontWeight: '600',
    },
    cartSummaryPrice: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    checkoutButton: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    checkoutText: {
        color: '#1C6ED5',
        fontSize: 13,
        fontWeight: '800',
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
        backgroundColor: '#7C3AED',
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
        backgroundColor: '#7C3AED',
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
