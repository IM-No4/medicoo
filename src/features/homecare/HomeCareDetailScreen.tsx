import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';
import { PROVIDERS_DATA } from './HomeCareListScreen';

const DATES_OPTIONS = ['Today', 'Tomorrow', '21 July', '22 July', '23 July'];

const DURATION_OPTIONS = [
    { label: '1 Day', days: 1, discountText: 'Standard', factor: 1.0 },
    { label: '3 Days', days: 3, discountText: 'Save 5%', factor: 0.95 },
    { label: '7 Days', days: 7, discountText: 'Save 10%', factor: 0.90 },
    { label: '14 Days', days: 14, discountText: 'Save 15%', factor: 0.85 },
    { label: '30 Days', days: 30, discountText: 'Save 20%', factor: 0.80 },
];

export default function HomeCareDetailScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();

    const { providerId } = route.params || {};
    const provider = PROVIDERS_DATA.find((p) => p.id === providerId) || PROVIDERS_DATA[0];

    // Swiggy Catalog Search & Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCatalogCat, setSelectedCatalogCat] = useState('all');

    // Selected Service Item
    const [selectedServiceId, setSelectedServiceId] = useState<string>(
        provider.servicesOffered[0]?.name || ''
    );

    // Modal Control States
    const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
    const [isRazorpayVisible, setIsRazorpayVisible] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'nb'>('upi');

    // Booking Parameters (Inside Bottom Sheet)
    const [bookingMode, setBookingMode] = useState<'single' | 'period'>('single');
    const [selectedDate, setSelectedDate] = useState('Today');
    const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[2]); // Default 7 days

    // Dynamic scroll tracking for sticky header transformation
    const [isSticky, setIsSticky] = useState(false);

    // Derived list of services for the Swiggy-style catalog
    const catalogCategories = useMemo(() => {
        const cats = new Set<string>();
        provider.servicesOffered.forEach((s) => cats.add(s.category));
        return ['all', ...Array.from(cats)];
    }, [provider]);

    const filteredServices = useMemo(() => {
        return provider.servicesOffered.filter((srv) => {
            const matchesCat = selectedCatalogCat === 'all' || srv.category === selectedCatalogCat;
            const matchesSearch =
                searchQuery.trim() === '' ||
                srv.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });
    }, [provider, selectedCatalogCat, searchQuery]);

    // Selected service object details
    const selectedServiceObj = useMemo(() => {
        return provider.servicesOffered.find((s) => s.name === selectedServiceId) || provider.servicesOffered[0];
    }, [provider, selectedServiceId]);

    // Live cost calculations
    const liveCalculations = useMemo(() => {
        if (!selectedServiceObj) return { basePrice: 0, totalPrice: 0, days: 1, discountText: '' };
        
        const basePrice = selectedServiceObj.price;
        if (bookingMode === 'single') {
            return {
                basePrice,
                totalPrice: basePrice,
                days: 1,
                discountText: '',
            };
        } else {
            const days = selectedDuration.days;
            const factor = selectedDuration.factor;
            const totalPrice = Math.round(basePrice * days * factor);
            return {
                basePrice,
                totalPrice,
                days,
                discountText: selectedDuration.discountText,
            };
        }
    }, [selectedServiceObj, bookingMode, selectedDuration]);

    const handleAddPress = (serviceName: string) => {
        setSelectedServiceId(serviceName);
        setIsConfigModalVisible(true);
    };

    const handleConfirmSchedule = () => {
        setIsConfigModalVisible(false);
        setPaymentStep('checkout');
        setIsRazorpayVisible(true);
    };

    const handlePayNow = () => {
        setPaymentStep('processing');
        setTimeout(() => {
            setPaymentStep('success');
        }, 1800);
    };

    return (
        <View style={styles.container}>
            <StatusBar style={isSticky ? "dark" : "light"} translucent backgroundColor="transparent" />

            {/* Cloned Sticky Search Bar */}
            {isSticky && (
                <View style={[styles.clonedStickyHeader, { paddingTop: insets.top + 8 }]}>
                    <View style={styles.searchContainerSticky}>
                        <AppIcon name="search" size={18} color="#94A3B8" />
                        <TextInput
                            placeholder={`Search services in ${provider.name}...`}
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <AppIcon name="x" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                scrollEventThrottle={16}
                onScroll={(e) => {
                    const y = e.nativeEvent.contentOffset.y;
                    setIsSticky(y > 180);
                }}
            >
                {/* Hero Profile Card */}
                <LinearGradient
                    colors={['#FB7185', '#EC4899', '#BE123C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroCard, { paddingTop: insets.top + 16 }]}
                >
                    <View style={styles.heroHeaderControls}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingHeaderBtn}>
                            <AppIcon name="arrow-left" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.floatingHeaderBtn}>
                            <AppIcon name="share" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.heroAccreditationRow}>
                        <View style={styles.heroBadge}>
                            <AppIcon name="shield-check" size={12} color="#FFFFFF" />
                            <Text style={styles.heroBadgeText}>100% Verified Care</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <AppIcon name="star" size={12} color="#FDE047" />
                            <Text style={styles.heroBadgeText}>{provider.rating} ({provider.reviewsCount})</Text>
                        </View>
                    </View>

                    <Text style={styles.providerNameText}>{provider.name}</Text>
                    <Text style={[styles.providerAddressText, { marginBottom: 16 }]}>📍 {provider.address} • {provider.accreditation}</Text>

                    {/* Integrated Search Bar inside heroCard */}
                    <View style={styles.searchContainerHero}>
                        <AppIcon name="search" size={18} color="#94A3B8" />
                        <TextInput
                            placeholder={`Search services in ${provider.name}...`}
                            placeholderTextColor="#94A3B8"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery !== '' && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <AppIcon name="x" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                {/* Category quick filters */}
                <View style={styles.filtersWrapperOutside}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                        {catalogCategories.map((cat) => {
                            const isSelected = selectedCatalogCat === cat;
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catChip, isSelected && styles.catChipActive]}
                                    onPress={() => setSelectedCatalogCat(cat)}
                                >
                                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                                        {cat === 'all' ? 'All Services' : cat.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Services Catalog */}
                <View style={styles.catalogContainer}>
                    <View style={styles.catalogItemsList}>
                        {filteredServices.map((srv, index) => {
                            const isSelected = selectedServiceId === srv.name;
                            return (
                                <TouchableOpacity
                                    key={index}
                                    activeOpacity={0.9}
                                    style={styles.catalogItemCard}
                                    onPress={() => handleAddPress(srv.name)}
                                >
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemTitle}>{srv.name}</Text>
                                        <Text style={styles.itemDescription}>
                                            Hospital-quality healthcare support provided in-home by verified staff from {provider.name}.
                                        </Text>
                                        <View style={styles.itemMetaRow}>
                                            <Text style={styles.itemPriceText}>₹{srv.price} <Text style={styles.itemUnitText}>/ visit</Text></Text>
                                            <View style={styles.tagBadge}>
                                                <AppIcon name={srv.icon as any} size={10} color="#EC4899" />
                                                <Text style={styles.tagBadgeText}>{srv.category.toUpperCase()}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.itemActionColumn}>
                                        <View style={styles.iconPlaceholder}>
                                            <AppIcon name={srv.icon as any} size={28} color="#64748B" />
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.selectButton, isSelected && styles.selectButtonActive]}
                                            onPress={() => handleAddPress(srv.name)}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>
                                                {isSelected ? 'ADDED' : 'ADD'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {filteredServices.length === 0 && (
                            <View style={styles.emptyState}>
                                <AppIcon name="search" size={32} color="#CBD5E1" />
                                <Text style={styles.emptyStateText}>No matching services found.</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Action Bar */}
            <View style={[styles.footerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
                <View style={styles.footerSummary}>
                    <Text style={styles.footerCalculatedPrice}>
                        ₹{selectedServiceObj?.price || provider.startingPrice} <Text style={styles.cardPriceUnit}>/ visit</Text>
                    </Text>
                    <Text style={styles.footerCalculatedDetails} numberOfLines={1}>
                        Selected: {selectedServiceObj?.name}
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.bookButton}
                    onPress={() => setIsConfigModalVisible(true)}
                >
                    <LinearGradient
                        colors={['#F472B6', '#EC4899']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookGradient}
                    >
                        <Text style={styles.bookText}>Select Schedule</Text>
                        <AppIcon name="chevron-right" size={16} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ================= MODAL: VISIT SCHEDULER BOTTOM SHEET ================= */}
            <Modal
                visible={isConfigModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsConfigModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setIsConfigModalVisible(false)}
                    />
                    <View style={[styles.modalSheet, { paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }]}>
                        <View style={styles.sheetHeader}>
                            <View>
                                <Text style={styles.sheetTitle}>Configure Schedule</Text>
                                <Text style={styles.sheetSubtitle}>{selectedServiceObj?.name} • ₹{selectedServiceObj?.price} / visit</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.sheetCloseButton}
                                onPress={() => setIsConfigModalVisible(false)}
                            >
                                <AppIcon name="x" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Scheduling Inputs */}
                        <View style={styles.sheetBody}>
                            <Text style={styles.sheetLabel}>Choose Visit Frequency:</Text>
                            <View style={styles.modeTabs}>
                                <TouchableOpacity
                                    style={[styles.modeTabButton, bookingMode === 'single' && styles.modeTabButtonActive]}
                                    onPress={() => setBookingMode('single')}
                                >
                                    <AppIcon name="clock" size={16} color={bookingMode === 'single' ? '#FFFFFF' : '#64748B'} />
                                    <Text style={[styles.modeTabText, bookingMode === 'single' && styles.modeTabTextActive]}>
                                        Single Visit
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modeTabButton, bookingMode === 'period' && styles.modeTabButtonActive]}
                                    onPress={() => setBookingMode('period')}
                                >
                                    <AppIcon name="calendar" size={16} color={bookingMode === 'period' ? '#FFFFFF' : '#64748B'} />
                                    <Text style={[styles.modeTabText, bookingMode === 'period' && styles.modeTabTextActive]}>
                                        Period Care
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {bookingMode === 'single' ? (
                                <View style={styles.pickerSection}>
                                    <Text style={styles.pickerLabel}>Select Visit Date:</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {DATES_OPTIONS.map((date) => (
                                            <TouchableOpacity
                                                key={date}
                                                style={[styles.dateChip, selectedDate === date && styles.dateChipActive]}
                                                onPress={() => setSelectedDate(date)}
                                            >
                                                <Text style={[styles.dateChipText, selectedDate === date && styles.dateChipTextActive]}>
                                                    {date}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            ) : (
                                <View style={styles.pickerSection}>
                                    <Text style={styles.pickerLabel}>Select Duration (Save with multi-day booking):</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                                        {DURATION_OPTIONS.map((opt) => (
                                            <TouchableOpacity
                                                key={opt.days}
                                                style={[styles.durationChip, selectedDuration.days === opt.days && styles.durationChipActive]}
                                                onPress={() => setSelectedDuration(opt)}
                                            >
                                                <Text style={[styles.durationChipText, selectedDuration.days === opt.days && styles.durationChipTextActive]}>
                                                    {opt.label}
                                                </Text>
                                                <View style={[styles.discountPill, selectedDuration.days === opt.days && styles.discountPillActive]}>
                                                    <Text style={[styles.discountPillText, selectedDuration.days === opt.days && styles.discountPillTextActive]}>
                                                        {opt.discountText}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Summary read-out */}
                            <View style={styles.calcSummaryBox}>
                                <Text style={styles.calcSummaryTitle}>Billing Summary</Text>
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Caregiver Base Rate</Text>
                                    <Text style={styles.calcVal}>₹{selectedServiceObj?.price} / visit</Text>
                                </View>
                                {bookingMode === 'period' && (
                                    <View style={styles.calcRow}>
                                        <Text style={styles.calcLabel}>Duration / Days</Text>
                                        <Text style={styles.calcVal}>× {liveCalculations.days} days</Text>
                                    </View>
                                )}
                                {liveCalculations.discountText !== '' && liveCalculations.discountText !== 'Standard' && (
                                    <View style={styles.calcRow}>
                                        <Text style={styles.calcLabelPink}>Package Discount</Text>
                                        <Text style={styles.calcValPink}>{liveCalculations.discountText}</Text>
                                    </View>
                                )}
                                <View style={styles.calcDividerLine} />
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcTotalLabel}>Total Pay Est.</Text>
                                    <Text style={styles.calcTotalVal}>₹{liveCalculations.totalPrice}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Splitted Button White Bottom Nav */}
                        <View style={styles.sheetFooterBar}>
                            <View style={styles.sheetFooterSummary}>
                                <Text style={styles.sheetFooterPrice}>₹{liveCalculations.totalPrice}</Text>
                                <Text style={styles.sheetFooterDetails}>
                                    {bookingMode === 'single' ? '1 Visit' : `${liveCalculations.days} Days Care`}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.sheetPayButtonSplit}
                                onPress={handleConfirmSchedule}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#F472B6', '#EC4899']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sheetPayGradient}
                                >
                                    <Text style={styles.sheetPayText}>Proceed to Pay</Text>
                                    <AppIcon name="chevron-right" size={14} color="#FFFFFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ================= MODAL: RAZORPAY PAYMENT GATEWAY GATE SIMULATOR ================= */}
            <Modal
                visible={isRazorpayVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsRazorpayVisible(false)}
            >
                <View style={styles.razorpayOverlay}>
                    <View style={styles.razorpayWidget}>
                        {/* Razorpay Brand Header */}
                        <View style={styles.razorpayHeader}>
                            <View style={styles.razorpayHeaderLeft}>
                                <View style={styles.razorpayBadgeIcon}>
                                    <AppIcon name="shield-check" size={14} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={styles.razorpayBrandName}>Razorpay Secure</Text>
                                    <Text style={styles.razorpayMerchant}>MEDICOO HEALTHCARE PLATFORM</Text>
                                </View>
                            </View>
                            <View style={styles.razorpayHeaderRight}>
                                <TouchableOpacity onPress={() => setIsRazorpayVisible(false)}>
                                    <AppIcon name="x" size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {paymentStep === 'checkout' && (
                            <View style={{ flex: 1 }}>
                                {/* Amount Details */}
                                <View style={styles.razorpayAmountBox}>
                                    <Text style={styles.razorpayAmountLabel}>PAYING TO MERCHANDISER</Text>
                                    <Text style={styles.razorpayAmountValue}>₹{liveCalculations.totalPrice.toLocaleString('en-IN')}</Text>
                                    <Text style={styles.razorpayServiceDetails}>{selectedServiceObj?.name} ({bookingMode === 'single' ? '1 Session' : `${selectedDuration.days} Days package`})</Text>
                                </View>

                                {/* Method select */}
                                <View style={styles.razorpayPaymentOptions}>
                                    <Text style={styles.razorpayMethodHeading}>Select Payment Option</Text>

                                    {/* UPI method */}
                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'upi' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('upi')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="phone" size={16} color="#EC4899" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.methodName}>UPI / GPay / PhonePe</Text>
                                            <Text style={styles.methodDesc}>Instant authorization via UPI app</Text>
                                        </View>
                                        <View style={[styles.methodRadio, paymentMethod === 'upi' && styles.methodRadioSelected]}>
                                            {paymentMethod === 'upi' && <View style={styles.methodRadioDot} />}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Card method */}
                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'card' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('card')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="locate-fixed" size={16} color="#EC4899" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.methodName}>Credit / Debit Cards</Text>
                                            <Text style={styles.methodDesc}>Visa, Mastercard, RuPay, Maestro</Text>
                                        </View>
                                        <View style={[styles.methodRadio, paymentMethod === 'card' && styles.methodRadioSelected]}>
                                            {paymentMethod === 'card' && <View style={styles.methodRadioDot} />}
                                        </View>
                                    </TouchableOpacity>

                                    {/* Netbanking method */}
                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'nb' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('nb')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="briefcase-medical" size={16} color="#EC4899" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.methodName}>Netbanking</Text>
                                            <Text style={styles.methodDesc}>All major Indian banks supported</Text>
                                        </View>
                                        <View style={[styles.methodRadio, paymentMethod === 'nb' && styles.methodRadioSelected]}>
                                            {paymentMethod === 'nb' && <View style={styles.methodRadioDot} />}
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* Action button */}
                                <TouchableOpacity
                                    style={styles.razorpayPayButton}
                                    onPress={handlePayNow}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.razorpayPayText}>Pay Now • ₹{liveCalculations.totalPrice}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {paymentStep === 'processing' && (
                            <View style={styles.centerFlow}>
                                <ActivityIndicator size="large" color="#0B79E1" />
                                <Text style={styles.processingText}>Authenticating with Bank Gateway...</Text>
                                <Text style={styles.processingSub}>Please do not press back or close the app.</Text>
                            </View>
                        )}

                        {paymentStep === 'success' && (
                            <View style={styles.centerFlow}>
                                <View style={styles.successCheckCircle}>
                                    <AppIcon name="shield-check" size={48} color="#FFFFFF" />
                                </View>
                                <Text style={styles.successHeading}>Booking Successful!</Text>
                                <Text style={styles.successSub}>Your payment has been processed securely.</Text>
                                
                                <View style={styles.receiptBox}>
                                    <Text style={styles.receiptLabel}>Transaction Details</Text>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Transaction ID</Text>
                                        <Text style={styles.receiptVal}>TXN-MED-{Math.floor(Math.random() * 900000) + 100000}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Provider</Text>
                                        <Text style={styles.receiptVal}>{provider.name}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Service</Text>
                                        <Text style={styles.receiptVal}>{selectedServiceObj?.name}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Amount Paid</Text>
                                        <Text style={styles.receiptVal}>₹{liveCalculations.totalPrice}</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.razorpaySuccessClose}
                                    onPress={() => {
                                        setIsRazorpayVisible(false);
                                        setIsBooked(true);
                                    }}
                                >
                                    <Text style={styles.razorpaySuccessCloseText}>Go to Dashboard</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
    clonedStickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        zIndex: 9999,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
    },
    heroCard: {
        padding: 20,
        paddingBottom: 24,
        marginHorizontal: -16,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    heroHeaderControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    floatingHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroAccreditationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    heroBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    providerNameText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    providerAddressText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    searchContainerHero: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchContainerSticky: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 13,
        color: '#0F172A',
    },
    filtersWrapperOutside: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    catalogContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: -16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        marginTop: 4,
        marginBottom: 16,
    },
    catChipsRow: {
        gap: 8,
    },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catChipActive: {
        backgroundColor: '#FCE7F3',
        borderColor: '#FCE7F3',
    },
    catChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    catChipTextActive: {
        color: '#DB2777',
    },
    catalogItemsList: {
        gap: 0,
    },
    catalogItemCard: {
        flexDirection: 'row',
        paddingVertical: 18,
        backgroundColor: '#FFFFFF',
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    catalogItemCardSelected: {},
    itemDetails: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    itemDescription: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
        lineHeight: 16,
    },
    itemMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    itemPriceText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    itemUnitText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#EC4899',
    },
    itemActionColumn: {
        position: 'relative',
        width: 100,
        height: 106,
        alignItems: 'center',
    },
    iconPlaceholder: {
        width: 96,
        height: 90,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    selectButton: {
        position: 'absolute',
        bottom: 0,
        width: 76,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EC4899',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    selectButtonActive: {
        backgroundColor: '#EC4899',
        borderColor: '#EC4899',
    },
    selectButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EC4899',
    },
    selectButtonTextActive: {
        color: '#FFFFFF',
    },
    emptyState: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
    },
    footerBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerSummary: {
        flex: 1,
        marginRight: 8,
    },
    footerCalculatedPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    footerCalculatedDetails: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    bookButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    bookGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 4,
    },
    bookText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    cardPriceUnit: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500',
    },

    /* ================= MODAL BASE SHEET STYLES ================= */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 14,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    sheetSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    sheetCloseButton: {
        padding: 4,
    },
    sheetBody: {
        paddingVertical: 16,
    },
    sheetLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 10,
    },
    modeTabs: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    modeTabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
    },
    modeTabButtonActive: {
        backgroundColor: '#EC4899',
    },
    modeTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    modeTabTextActive: {
        color: '#FFFFFF',
    },
    pickerSection: {
        marginBottom: 16,
    },
    pickerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    chipsRow: {
        gap: 8,
    },
    dateChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dateChipActive: {
        backgroundColor: '#FCE7F3',
        borderColor: '#FBCFE8',
    },
    dateChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    dateChipTextActive: {
        color: '#DB2777',
    },
    durationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    durationChipActive: {
        backgroundColor: '#FCE7F3',
        borderColor: '#FBCFE8',
    },
    durationChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
    },
    durationChipTextActive: {
        color: '#DB2777',
    },
    discountPill: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    discountPillActive: {
        backgroundColor: '#F472B6',
    },
    discountPillText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#475569',
    },
    discountPillTextActive: {
        color: '#FFFFFF',
    },
    calcSummaryBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 8,
    },
    calcSummaryTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
    },
    calcRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    calcLabel: {
        fontSize: 12,
        color: '#64748B',
    },
    calcVal: {
        fontSize: 12,
        color: '#334155',
        fontWeight: '600',
    },
    calcLabelPink: {
        fontSize: 12,
        color: '#EC4899',
        fontWeight: '600',
    },
    calcValPink: {
        fontSize: 12,
        color: '#EC4899',
        fontWeight: '800',
    },
    calcDividerLine: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 8,
    },
    calcTotalLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    calcTotalVal: {
        fontSize: 16,
        fontWeight: '800',
        color: '#EC4899',
    },
    sheetFooterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
        marginTop: 12,
    },
    sheetFooterSummary: {
        flex: 1,
        marginRight: 16,
    },
    sheetFooterPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#0F172A',
    },
    sheetFooterDetails: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    sheetPayButtonSplit: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    sheetPayGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 6,
    },
    sheetPayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },

    /* ================= MODAL: RAZORPAY GATEWAY STYLES ================= */
    razorpayOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    razorpayWidget: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        maxWidth: 360,
        height: 480,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    razorpayHeader: {
        backgroundColor: '#0C182A',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1A2E44',
    },
    razorpayHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    razorpayBadgeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
    },
    razorpayBrandName: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
    razorpayMerchant: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '600',
        marginTop: 1,
    },
    razorpayHeaderRight: {
        padding: 4,
    },
    razorpayAmountBox: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    razorpayAmountLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    razorpayAmountValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 4,
    },
    razorpayServiceDetails: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    razorpayPaymentOptions: {
        flex: 1,
        padding: 16,
    },
    razorpayMethodHeading: {
        fontSize: 11,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    razorpayMethodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 8,
    },
    razorpayMethodRowSelected: {
        borderColor: '#FBCFE8',
        backgroundColor: '#FFF1F2',
    },
    methodIconWrapperPink: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    methodDesc: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 1,
    },
    methodRadio: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodRadioSelected: {
        borderColor: '#EC4899',
    },
    methodRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EC4899',
    },
    razorpayPayButton: {
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        margin: 16,
        borderRadius: 12,
    },
    razorpayPayText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    centerFlow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    processingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 16,
    },
    processingSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
        textAlign: 'center',
    },
    successCheckCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    successSub: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 16,
    },
    receiptBox: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
        width: '100%',
        marginTop: 20,
    },
    receiptLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    receiptRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 3,
    },
    receiptKey: {
        fontSize: 11,
        color: '#64748B',
    },
    receiptVal: {
        fontSize: 11,
        color: '#0F172A',
        fontWeight: '700',
    },
    razorpaySuccessClose: {
        backgroundColor: '#10B981',
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 18,
    },
    razorpaySuccessCloseText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
});
