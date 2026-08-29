import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    FlatList,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';

export interface AmbulanceUnit {
    id: string;
    name: string;
    type: 'BLS' | 'ALS' | 'CCU' | 'Transport';
    typeLabel: string;
    eta: string;
    price: number;
    equipments: string[];
    paramedicOnBoard: boolean;
    doctorOnBoard: boolean;
    icon: string;
}

export interface AmbulanceProvider {
    id: string;
    name: string;
    rating: number;
    reviewsCount: number;
    address: string;
    accreditation: string;
    startingPrice: number;
    phone: string;
    typesOffered: string[];
    fleet: AmbulanceUnit[];
}

export const AMBULANCE_PROVIDERS: AmbulanceProvider[] = [
    {
        id: 'prov_amb1',
        name: 'RapidCare Emergency Response Ltd.',
        rating: 4.9,
        reviewsCount: 382,
        address: 'Bandra West Response Hub, Mumbai',
        accreditation: 'ISO 9001 Emergency Care Certified',
        startingPrice: 800,
        phone: '+919876543210',
        typesOffered: ['ALS', 'BLS', 'CCU'],
        fleet: [
            {
                id: 'amb1_als',
                name: 'RapidCare ALS ICU Unit #04',
                type: 'ALS',
                typeLabel: 'Advanced Life Support (ICU)',
                eta: '5–8 mins',
                price: 1500,
                equipments: ['Ventilator', 'Defibrillator', 'Oxygen Cylinder', 'ECG Monitor', 'Syringe Pump'],
                paramedicOnBoard: true,
                doctorOnBoard: true,
                icon: 'briefcase-medical',
            },
            {
                id: 'amb1_ccu',
                name: 'RapidCare Cardiac Rescue #01',
                type: 'CCU',
                typeLabel: 'Cardiac Care Unit (CCU)',
                eta: '8–10 mins',
                price: 2200,
                equipments: ['Cardiac Monitor', 'Defibrillator', 'Suction Machine', 'Emergency Meds', 'Oxygen'],
                paramedicOnBoard: true,
                doctorOnBoard: true,
                icon: 'heart',
            },
            {
                id: 'amb1_bls',
                name: 'RapidCare BLS Transport #12',
                type: 'BLS',
                typeLabel: 'Basic Life Support (BLS)',
                eta: '10–12 mins',
                price: 800,
                equipments: ['Medical Oxygen', 'Foldable Stretcher', 'First Aid Kit', 'Blood Pressure Monitor'],
                paramedicOnBoard: true,
                doctorOnBoard: false,
                icon: 'shield-check',
            }
        ]
    },
    {
        id: 'prov_amb2',
        name: 'Apollo Hospital Emergency Services',
        rating: 4.8,
        reviewsCount: 540,
        address: 'Apollo Medical Center, Bandra East, Mumbai',
        accreditation: 'JCI Accredited Hospital Fleet',
        startingPrice: 1000,
        phone: '+919876543211',
        typesOffered: ['ALS', 'CCU', 'Transport'],
        fleet: [
            {
                id: 'amb2_ccu',
                name: 'Apollo Cardiac ICU ambulance',
                type: 'CCU',
                typeLabel: 'Cardiac Care Unit (CCU)',
                eta: '7–9 mins',
                price: 2400,
                equipments: ['Defibrillator', 'External Pacemaker', 'Oxygen', 'Cardiac Monitor'],
                paramedicOnBoard: true,
                doctorOnBoard: true,
                icon: 'heart',
            },
            {
                id: 'amb2_als',
                name: 'Apollo Advanced ICU Support',
                type: 'ALS',
                typeLabel: 'Advanced Life Support (ICU)',
                eta: '8–12 mins',
                price: 1800,
                equipments: ['Ventilator', 'Emergency Drugs Kit', 'Multipara Monitor'],
                paramedicOnBoard: true,
                doctorOnBoard: true,
                icon: 'briefcase-medical',
            },
            {
                id: 'amb2_trans',
                name: 'Apollo Non-Emergency Transfer Unit',
                type: 'Transport',
                typeLabel: 'Patient Transfer',
                eta: '15–20 mins',
                price: 1000,
                equipments: ['Oxygen Cylinder', 'Manual Stretcher', 'Basic First Aid'],
                paramedicOnBoard: false,
                doctorOnBoard: false,
                icon: 'route',
            }
        ]
    },
    {
        id: 'prov_amb3',
        name: 'Medicare Express Rescue Association',
        rating: 4.7,
        reviewsCount: 195,
        address: 'Hill Road Station Yard, Bandra West, Mumbai',
        accreditation: 'Local Civic Response Partner',
        startingPrice: 600,
        phone: '+919876543212',
        typesOffered: ['BLS', 'Transport'],
        fleet: [
            {
                id: 'amb3_bls',
                name: 'Medicare Basic BLS unit',
                type: 'BLS',
                typeLabel: 'Basic Life Support (BLS)',
                eta: '9–12 mins',
                price: 800,
                equipments: ['Oxygen Support', 'Splints', 'Stretcher Board', 'BP Monitor'],
                paramedicOnBoard: true,
                doctorOnBoard: false,
                icon: 'shield-check',
            },
            {
                id: 'amb3_trans',
                name: 'Medicare Dialysis Patient Transfer',
                type: 'Transport',
                typeLabel: 'Patient Transfer',
                eta: '12–15 mins',
                price: 600,
                equipments: ['Wheelchair Ramp', 'Stretcher', 'Basic Supplies'],
                paramedicOnBoard: false,
                doctorOnBoard: false,
                icon: 'route',
            }
        ]
    }
];

export default function AmbulanceListScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, premium, budget

    const filteredProviders = useMemo(() => {
        return AMBULANCE_PROVIDERS.filter((prov) => {
            const matchesSearch = prov.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                prov.address.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (selectedFilter === 'premium') {
                return matchesSearch && prov.rating >= 4.8;
            }
            if (selectedFilter === 'budget') {
                return matchesSearch && prov.startingPrice <= 800;
            }
            return matchesSearch;
        });
    }, [searchQuery, selectedFilter]);

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* ---------- Header ---------- */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color="#111827" />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Ambulance Providers</Text>
                    <View style={styles.locationRow}>
                        <AppIcon name="locate-fixed" size={12} color="#DC2626" />
                        <Text style={styles.locationText} numberOfLines={1}>
                            Bandra West Emergency Response Hub
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.sosHeaderButton} onPress={() => Linking.openURL('tel:108')}>
                    <AppIcon name="phone" size={18} color="#FFFFFF" />
                    <Text style={styles.sosHeaderText}>108 SOS</Text>
                </TouchableOpacity>
            </View>

            {/* ---------- Search Box ---------- */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBox}>
                    <AppIcon name="search" size={18} color="#8E8E93" />
                    <TextInput
                        placeholder="Search local ambulance service providers..."
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

            {/* ---------- Quick Filters Row ---------- */}
            <View style={styles.filtersBar}>
                <TouchableOpacity
                    style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text style={[styles.filterChipText, selectedFilter === 'all' && styles.filterChipTextActive]}>
                        All Providers
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, selectedFilter === 'premium' && styles.filterChipActive]}
                    onPress={() => setSelectedFilter('premium')}
                >
                    <AppIcon name="star" size={12} color={selectedFilter === 'premium' ? '#FFFFFF' : '#475569'} />
                    <Text style={[styles.filterChipText, selectedFilter === 'premium' && styles.filterChipTextActive]}>
                        Top Rated (4.8+)
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterChip, selectedFilter === 'budget' && styles.filterChipActive]}
                    onPress={() => setSelectedFilter('budget')}
                >
                    <Text style={[styles.filterChipText, selectedFilter === 'budget' && styles.filterChipTextActive]}>
                        Starts under ₹800
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ---------- List of Service Providers ---------- */}
            <FlatList
                data={filteredProviders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.providerCard}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate('AmbulanceDetail', { providerId: item.id })}
                    >
                        <View style={styles.providerInfoRow}>
                            <View style={styles.providerDetails}>
                                <Text style={styles.providerName}>{item.name}</Text>
                                <Text style={styles.providerAccreditation}>{item.accreditation}</Text>
                                <Text style={styles.providerAddress}>📍 {item.address}</Text>

                                <View style={styles.badgesRow}>
                                    <View style={styles.ratingBadge}>
                                        <AppIcon name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.ratingText}>{item.rating} ({item.reviewsCount} reviews)</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.priceSection}>
                                <Text style={styles.startsLabel}>STARTS AT</Text>
                                <Text style={styles.startsPrice}>₹{item.startingPrice}</Text>
                                <Text style={styles.perVisit}>/ visit</Text>
                            </View>
                        </View>

                        <View style={styles.dividerLine} />

                        <View style={styles.cardFooter}>
                            <Text style={styles.availableTypes}>
                                Fleet: {item.typesOffered.join(' • ')}
                            </Text>

                            <TouchableOpacity
                                style={styles.viewFleetButton}
                                onPress={() => navigation.navigate('AmbulanceDetail', { providerId: item.id })}
                            >
                                <Text style={styles.viewFleetText}>View Fleet</Text>
                                <AppIcon name="chevron-right" size={14} color="#DC2626" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <AppIcon name="search" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No Ambulance Service Providers Found</Text>
                        <Text style={styles.emptySub}>Try adjusting search query or clearing filters.</Text>
                    </View>
                }
            />
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
    sosHeaderButton: {
        backgroundColor: '#DC2626',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    sosHeaderText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
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
    filtersBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 4,
    },
    filterChipActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    providerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    providerInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    providerDetails: {
        flex: 1,
        marginRight: 8,
    },
    providerName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    providerAccreditation: {
        fontSize: 10,
        fontWeight: '700',
        color: '#DC2626',
        marginTop: 2,
    },
    providerAddress: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 4,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    startsLabel: {
        fontSize: 8,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    startsPrice: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginTop: 2,
    },
    perVisit: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '500',
    },
    dividerLine: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    availableTypes: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
    },
    viewFleetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    viewFleetText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#DC2626',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 12,
    },
    emptySub: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
});
