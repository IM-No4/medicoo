import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ================= TYPES & MOCK DATA ================= */

type TabType = 'fleet' | 'hospital' | 'scheduled';

interface AmbulanceUnit {
    id: string;
    name: string;
    type: 'BLS' | 'ALS' | 'CCU' | 'Transport';
    typeLabel: string;
    provider: string;
    vehicleNo: string;
    eta: string;
    distanceText: string;
    distanceKm: number;
    baseFare: number;
    equipments: string[];
    paramedicOnBoard: boolean;
    doctorOnBoard: boolean;
    rating: number;
    phone: string;
    isAvailable: boolean;
}

const AMBULANCE_TYPES = [
    { id: 'all', label: 'All Fleet', icon: 'ambulance' },
    { id: 'BLS', label: 'Basic Support (BLS)', icon: 'shield-check' },
    { id: 'ALS', label: 'Advanced ICU (ALS)', icon: 'briefcase-medical' },
    { id: 'CCU', label: 'Cardiac Care (CCU)', icon: 'heart' },
    { id: 'Transport', label: 'Patient Transfer', icon: 'route' },
];

const FLEET_DATA: AmbulanceUnit[] = [
    {
        id: 'amb1',
        name: 'RapidCare ALS ICU Unit #04',
        type: 'ALS',
        typeLabel: 'Advanced Life Support (ICU)',
        provider: 'City Emergency Response',
        vehicleNo: 'MH-02-EQ-4102',
        eta: '5–8 mins',
        distanceText: '1.2 km away',
        distanceKm: 1.2,
        baseFare: 1500,
        equipments: ['Ventilator', 'Defibrillator', 'Oxygen Cylinder', 'ECG Monitor', 'Syringe Pump'],
        paramedicOnBoard: true,
        doctorOnBoard: true,
        rating: 4.9,
        phone: '+919876543210',
        isAvailable: true,
    },
    {
        id: 'amb2',
        name: 'Apollo Hospital Cardiac Unit #01',
        type: 'CCU',
        typeLabel: 'Cardiac Care Unit (CCU)',
        provider: 'Apollo Emergency Services',
        vehicleNo: 'MH-01-CR-8821',
        eta: '8–10 mins',
        distanceText: '2.4 km away',
        distanceKm: 2.4,
        baseFare: 2200,
        equipments: ['Cardiac Monitor', 'Defibrillator', 'Suction Machine', 'Emergency Meds', 'Oxygen'],
        paramedicOnBoard: true,
        doctorOnBoard: true,
        rating: 4.9,
        phone: '+919876543211',
        isAvailable: true,
    },
    {
        id: 'amb3',
        name: 'Medicare Basic Ambulance #12',
        type: 'BLS',
        typeLabel: 'Basic Life Support (BLS)',
        provider: 'Medicare Express',
        vehicleNo: 'MH-04-AB-1904',
        eta: '10–12 mins',
        distanceText: '3.1 km away',
        distanceKm: 3.1,
        baseFare: 800,
        equipments: ['Medical Oxygen', 'Foldable Stretcher', 'First Aid Kit', 'Blood Pressure Monitor'],
        paramedicOnBoard: true,
        doctorOnBoard: false,
        rating: 4.7,
        phone: '+919876543212',
        isAvailable: true,
    },
    {
        id: 'amb4',
        name: 'Fortis Trauma & ALS Response',
        type: 'ALS',
        typeLabel: 'Advanced Life Support (ICU)',
        provider: 'Fortis Healthcare',
        vehicleNo: 'MH-02-FT-9910',
        eta: '12–15 mins',
        distanceText: '4.2 km away',
        distanceKm: 4.2,
        baseFare: 1800,
        equipments: ['Portable Ventilator', 'Nebulizer', 'Infusion Pump', 'Oxygen', 'Multipara Monitor'],
        paramedicOnBoard: true,
        doctorOnBoard: true,
        rating: 4.8,
        phone: '+919876543213',
        isAvailable: true,
    },
    {
        id: 'amb5',
        name: 'GreenCross Patient Transport',
        type: 'Transport',
        typeLabel: 'Non-Emergency Transfer',
        provider: 'GreenCross Logistics',
        vehicleNo: 'MH-03-GC-5541',
        eta: '15–20 mins',
        distanceText: '5.5 km away',
        distanceKm: 5.5,
        baseFare: 600,
        equipments: ['Wheelchair Ramp', 'Stretcher', 'Basic First Aid', 'Oxygen Tank'],
        paramedicOnBoard: false,
        doctorOnBoard: false,
        rating: 4.6,
        phone: '+919876543214',
        isAvailable: true,
    },
];

export default function AmbulanceScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [activeTab, setActiveTab] = useState<TabType>('fleet');

    // Selected Ambulance state
    const [selectedUnitId, setSelectedUnitId] = useState<string>(
        FLEET_DATA[0]?.id || ''
    );

    // Modal Control States
    const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
    const [isRazorpayVisible, setIsRazorpayVisible] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'nb'>('upi');

    const [patientCondition, setPatientCondition] = useState('Accident / Trauma');
    const [pickupAddress, setPickupAddress] = useState('Bandra West, Hill Road, Mumbai - 400050');
    const [isBooked, setIsBooked] = useState(false);

    // Dynamic scroll tracking for sticky header transformation
    const [isSticky, setIsSticky] = useState(false);

    /* ---------------- Filtering Logic ---------------- */

    const filteredFleet = useMemo(() => {
        let result = FLEET_DATA;

        if (selectedType !== 'all') {
            result = result.filter((item) => item.type === selectedType);
        }

        if (activeTab === 'hospital') {
            result = result.filter(
                (item) =>
                    item.provider.toLowerCase().includes('apollo') ||
                    item.provider.toLowerCase().includes('fortis')
            );
        } else if (activeTab === 'scheduled') {
            result = result.filter((item) => item.type === 'Transport' || item.type === 'BLS');
        }

        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.name.toLowerCase().includes(q) ||
                    item.provider.toLowerCase().includes(q) ||
                    item.equipments.some((e) => e.toLowerCase().includes(q))
            );
        }

        return result;
    }, [selectedType, activeTab, searchQuery]);

    const hasActiveFilters = searchQuery.trim() !== '' || selectedType !== 'all';

    const resetAllFilters = () => {
        setSearchQuery('');
        setSelectedType('all');
    };

    const callNumber = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const selectedUnitObj = useMemo(() => {
        return FLEET_DATA.find((unit) => unit.id === selectedUnitId) || FLEET_DATA[0];
    }, [selectedUnitId]);

    const handleAddPress = (unitId: string) => {
        setSelectedUnitId(unitId);
        setIsConfigModalVisible(true);
    };

    const handleConfirmBooking = () => {
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
                            placeholder="Search emergency ambulance fleet..."
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
                    colors={['#FCA5A5', '#EF4444', '#B91C1C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.heroCard, { paddingTop: insets.top + 16 }]}
                >
                    {/* Header Controls Overlay */}
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
                            <Text style={styles.heroBadgeText}>100% Gps Tracked</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <AppIcon name="star" size={12} color="#FDE047" />
                            <Text style={styles.heroBadgeText}>4.9/5 Ambulance Rating</Text>
                        </View>
                    </View>

                    <Text style={styles.providerNameText}>Emergency Ambulance Fleet</Text>
                    <Text style={[styles.providerAddressText, { marginBottom: 16 }]}>📍 Bandra West, Hill Road • Mumbai Response Hub</Text>

                    {/* Integrated Search Bar (Completely Inside Hero Card) */}
                    <View style={styles.searchContainerHero}>
                        <AppIcon name="search" size={18} color="#94A3B8" />
                        <TextInput
                            placeholder="Search emergency ambulance fleet..."
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

                {/* Categories quick filters (Standalone, below heroCard) */}
                <View style={styles.filtersWrapperOutside}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                        {AMBULANCE_TYPES.map((cat) => {
                            const isSelected = selectedType === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.catChip, isSelected && styles.catChipActive]}
                                    onPress={() => setSelectedType(cat.id)}
                                >
                                    <AppIcon
                                        name={cat.icon as any}
                                        size={12}
                                        color={isSelected ? '#DB2777' : '#64748B'}
                                    />
                                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Segmented Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fleet' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('fleet')}
                    >
                        <Text style={[styles.tabText, activeTab === 'fleet' && styles.tabTextActive]}>
                            Nearby Fleet ({filteredFleet.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'hospital' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('hospital')}
                    >
                        <Text style={[styles.tabText, activeTab === 'hospital' && styles.tabTextActive]}>
                            Hospital Fleet
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'scheduled' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('scheduled')}
                    >
                        <Text style={[styles.tabText, activeTab === 'scheduled' && styles.tabTextActive]}>
                            Scheduled
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Ambulance Fleet List Container */}
                <View style={styles.catalogContainer}>
                    <View style={styles.catalogItemsList}>
                        {filteredFleet.map((item) => {
                            const isSelected = selectedUnitId === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.9}
                                    style={styles.catalogItemCard}
                                    onPress={() => handleAddPress(item.id)}
                                >
                                    <View style={styles.itemDetails}>
                                        <View style={styles.titleBadgeRow}>
                                            <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
                                            <View style={styles.etaBadgeSmall}>
                                                <AppIcon name="clock" size={10} color="#059669" />
                                                <Text style={styles.etaBadgeTextSmall}>{item.eta}</Text>
                                            </View>
                                        </View>

                                        <Text style={styles.itemDescription}>
                                            {item.provider} • {item.vehicleNo}
                                        </Text>

                                        <View style={styles.metaRow}>
                                            <AppIcon name="map-pin" size={11} color="#059669" />
                                            <Text style={styles.distanceText}>{item.distanceText}</Text>
                                            <Text style={styles.dotDivider}>•</Text>
                                            <AppIcon name="star" size={11} color="#F59E0B" />
                                            <Text style={styles.ratingText}>{item.rating}</Text>
                                        </View>

                                        {/* Equipments Badges list */}
                                        <View style={styles.equipmentsGrid}>
                                            {item.equipments.slice(0, 3).map((eq, idx) => (
                                                <View key={idx} style={styles.equipmentChip}>
                                                    <Text style={styles.equipmentChipText}>{eq}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    <View style={styles.itemActionColumn}>
                                        <View style={styles.iconPlaceholder}>
                                            <AppIcon name="ambulance" size={32} color="#64748B" />
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.selectButton, isSelected && styles.selectButtonActive]}
                                            onPress={() => handleAddPress(item.id)}
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

                        {filteredFleet.length === 0 && (
                            <View style={styles.emptyState}>
                                <AppIcon name="search" size={32} color="#CBD5E1" />
                                <Text style={styles.emptyStateText}>No available units match search/tabs.</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Sticky Action Footer Bar */}
            <View style={[styles.footerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
                <View style={styles.footerSummary}>
                    <Text style={styles.footerCalculatedPrice}>
                        ₹{selectedUnitObj?.baseFare} <Text style={styles.cardPriceUnit}>base rate</Text>
                    </Text>
                    <Text style={styles.footerCalculatedDetails} numberOfLines={1}>
                        Unit: {selectedUnitObj?.name}
                    </Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.bookButton}
                    onPress={() => setIsConfigModalVisible(true)}
                >
                    <LinearGradient
                        colors={['#EF4444', '#B91C1C']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookGradient}
                    >
                        <Text style={styles.bookText}>Dispatch Config</Text>
                        <AppIcon name="chevron-right" size={16} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* ================= MODAL: DISPATCH BOOKING DETAILS BOTTOM SHEET ================= */}
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
                                <Text style={styles.sheetTitle}>Dispatch Booking</Text>
                                <Text style={styles.sheetSubtitle}>{selectedUnitObj?.name} • Base ₹{selectedUnitObj?.baseFare}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.sheetCloseButton}
                                onPress={() => setIsConfigModalVisible(false)}
                            >
                                <AppIcon name="x" size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {/* Dispatch Fields Form */}
                        <View style={styles.sheetBody}>
                            <Text style={styles.sheetLabel}>Confirm Pickup Address (GPS Fixed)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={pickupAddress}
                                onChangeText={setPickupAddress}
                                placeholder="Enter pickup address..."
                            />

                            <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Patient Emergency Category</Text>
                            <View style={styles.conditionChipGrid}>
                                {['Accident / Trauma', 'Chest Pain', 'Respiratory Arrest', 'General Transfer'].map((cond) => (
                                    <TouchableOpacity
                                        key={cond}
                                        style={[styles.conditionChip, patientCondition === cond && styles.conditionChipSelected]}
                                        onPress={() => setPatientCondition(cond)}
                                    >
                                        <Text style={[styles.conditionChipText, patientCondition === cond && styles.conditionChipTextSelected]}>
                                            {cond}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Summary Box */}
                            <View style={styles.calcSummaryBox}>
                                <Text style={styles.calcSummaryTitle}>Dispatch Bill Breakdown</Text>
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Initial Base Fare (First 5 km)</Text>
                                    <Text style={styles.calcVal}>₹{selectedUnitObj?.baseFare}</Text>
                                </View>
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcLabel}>Fuel & Toll Surcharge</Text>
                                    <Text style={styles.calcVal}>Included</Text>
                                </View>
                                <View style={styles.calcDividerLine} />
                                <View style={styles.calcRow}>
                                    <Text style={styles.calcTotalLabel}>Estimated Total</Text>
                                    <Text style={styles.calcTotalVal}>₹{selectedUnitObj?.baseFare}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Split Action Footer Bar */}
                        <View style={styles.sheetFooterBar}>
                            <View style={styles.sheetFooterSummary}>
                                <Text style={styles.sheetFooterPrice}>₹{selectedUnitObj?.baseFare}</Text>
                                <Text style={styles.sheetFooterDetails}>Base Pay authorization</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.sheetPayButtonSplit}
                                onPress={handleConfirmBooking}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#EF4444', '#B91C1C']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.sheetPayGradient}
                                >
                                    <Text style={styles.sheetPayText}>Confirm & Pay</Text>
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
                                <View style={styles.razorpayAmountBox}>
                                    <Text style={styles.razorpayAmountLabel}>AMBULANCE EMERGENCY DISPATCH</Text>
                                    <Text style={styles.razorpayAmountValue}>₹{selectedUnitObj?.baseFare.toLocaleString('en-IN')}</Text>
                                    <Text style={styles.razorpayServiceDetails}>{selectedUnitObj?.name} • {patientCondition}</Text>
                                </View>

                                <View style={styles.razorpayPaymentOptions}>
                                    <Text style={styles.razorpayMethodHeading}>Select Payment Option</Text>

                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'upi' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('upi')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="phone" size={16} color="#DC2626" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.methodName}>UPI / GPay / PhonePe</Text>
                                            <Text style={styles.methodDesc}>Instant authorization via UPI app</Text>
                                        </View>
                                        <View style={[styles.methodRadio, paymentMethod === 'upi' && styles.methodRadioSelected]}>
                                            {paymentMethod === 'upi' && <View style={styles.methodRadioDot} />}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'card' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('card')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="locate-fixed" size={16} color="#DC2626" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.methodName}>Credit / Debit Cards</Text>
                                            <Text style={styles.methodDesc}>Visa, Mastercard, RuPay, Maestro</Text>
                                        </View>
                                        <View style={[styles.methodRadio, paymentMethod === 'card' && styles.methodRadioSelected]}>
                                            {paymentMethod === 'card' && <View style={styles.methodRadioDot} />}
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.razorpayMethodRow, paymentMethod === 'nb' && styles.razorpayMethodRowSelected]}
                                        onPress={() => setPaymentMethod('nb')}
                                    >
                                        <View style={styles.methodIconWrapperPink}>
                                            <AppIcon name="briefcase-medical" size={16} color="#DC2626" />
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

                                <TouchableOpacity
                                    style={styles.razorpayPayButton}
                                    onPress={handlePayNow}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.razorpayPayText}>Pay Now • ₹{selectedUnitObj?.baseFare}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {paymentStep === 'processing' && (
                            <View style={styles.centerFlow}>
                                <ActivityIndicator size="large" color="#DC2626" />
                                <Text style={styles.processingText}>Securing Bank Authorization...</Text>
                                <Text style={styles.processingSub}>Contacting gateway. Please do not close application.</Text>
                            </View>
                        )}

                        {paymentStep === 'success' && (
                            <View style={styles.centerFlow}>
                                <View style={styles.successCheckCircle}>
                                    <AppIcon name="shield-check" size={48} color="#FFFFFF" />
                                </View>
                                <Text style={styles.successHeading}>Dispatch Confirmed!</Text>
                                <Text style={styles.successSub}>Ambulance vehicle has been dispatched successfully.</Text>
                                
                                <View style={styles.receiptBox}>
                                    <Text style={styles.receiptLabel}>Dispatch Info Summary</Text>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Vehicle ID</Text>
                                        <Text style={styles.receiptVal}>{selectedUnitObj?.vehicleNo}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Provider</Text>
                                        <Text style={styles.receiptVal}>{selectedUnitObj?.provider}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>ETA</Text>
                                        <Text style={styles.receiptVal}>{selectedUnitObj?.eta}</Text>
                                    </View>
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptKey}>Status</Text>
                                        <Text style={styles.receiptValActive}>En Route ⚡</Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.razorpaySuccessClose}
                                    onPress={() => {
                                        setIsRazorpayVisible(false);
                                        navigation.navigate('Tabs', { screen: 'Home' }); // Go to Dashboard/Home
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
    catChipsRow: {
        gap: 8,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    catChipActive: {
        backgroundColor: '#FCE7F3',
        borderColor: '#FBCFE8',
    },
    catChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
    },
    catChipTextActive: {
        color: '#DB2777',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 12,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#DC2626',
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    tabTextActive: {
        color: '#DC2626',
        fontWeight: '700',
    },
    sosCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    sosCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sosLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 6,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#34D399',
    },
    sosLiveText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    etaText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    sosTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    sosSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 18,
        marginBottom: 16,
    },
    sosActionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    sosPrimaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    sosPrimaryText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '800',
    },
    sosCallButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 6,
    },
    sosCallText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
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
    titleBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        flex: 1,
    },
    etaBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    etaBadgeTextSmall: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
    },
    itemDescription: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    distanceText: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '600',
    },
    dotDivider: {
        color: '#CBD5E1',
        fontSize: 10,
    },
    ratingText: {
        fontSize: 11,
        color: '#F59E0B',
        fontWeight: '700',
    },
    equipmentsGrid: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 8,
    },
    equipmentChip: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    equipmentChipText: {
        fontSize: 9,
        color: '#475569',
        fontWeight: '600',
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
        borderColor: '#DC2626',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    selectButtonActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    selectButtonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#DC2626',
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
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 13,
        color: '#0F172A',
        backgroundColor: '#F8FAFC',
    },
    conditionChipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    conditionChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    conditionChipSelected: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FCA5A5',
    },
    conditionChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
    },
    conditionChipTextSelected: {
        color: '#DC2626',
        fontWeight: '700',
    },
    calcSummaryBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 16,
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
    calcDividerLine: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 8,
    },
    calcTotalLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0F172A',
    },
    calcTotalVal: {
        fontSize: 16,
        fontWeight: '900',
        color: '#DC2626',
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
        fontSize: 22,
        fontWeight: '950',
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

    /* ================= RAZORPAY MODAL STYLES ================= */
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
        borderColor: '#FCA5A5',
        backgroundColor: '#FFF5F5',
    },
    methodIconWrapperPink: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
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
        borderColor: '#DC2626',
    },
    methodRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DC2626',
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
    receiptValActive: {
        fontSize: 11,
        color: '#059669',
        fontWeight: '800',
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
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    illustrationWrapper: {
        position: 'relative',
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    illustrationAura: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    emptyGraphicImage: {
        width: 90,
        height: 90,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    resetBtn: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    resetBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
});
