import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';

export default function HospitalDetailScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();

    const { hospitalId } = route.params || {};

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <AppIcon name="arrow-left" size={20} color="#1C1C1E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Hospital Overview</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <AppIcon name="share" size={20} color="#1C1C1E" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Hospital Hero Banner */}
                <LinearGradient
                    colors={['#1E3A8A', '#1C6ED5', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.accreditationRow}>
                        <View style={styles.accreditationBadge}>
                            <AppIcon name="shield-check" size={12} color="#FFFFFF" />
                            <Text style={styles.accreditationText}>NABH & JCI Accredited</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <AppIcon name="star" size={12} color="#FDE047" />
                            <Text style={styles.ratingText}>4.8 (12.4k)</Text>
                        </View>
                    </View>

                    <Text style={styles.hospitalName}>Apollo Multi-Specialty Hospital</Text>
                    <Text style={styles.hospitalAddress}>Plot 14, Greams Road, Healthcare Corridor • 1.8 km away</Text>

                    <View style={styles.statusRow}>
                        <View style={styles.statusChip}>
                            <AppIcon name="ambulance" size={12} color="#FFFFFF" />
                            <Text style={styles.statusChipText}>24/7 Emergency Active</Text>
                        </View>
                        <View style={styles.statusChip}>
                            <AppIcon name="clock" size={12} color="#FDE047" />
                            <Text style={styles.statusChipText}>18 ICU Beds Ready</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Highlights */}
                <View style={styles.highlightsGrid}>
                    <View style={styles.highlightCard}>
                        <AppIcon name="hospital" size={20} color="#1C6ED5" />
                        <Text style={styles.highlightTitle}>450+ Beds</Text>
                        <Text style={styles.highlightSubtitle}>Capacity</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="ambulance" size={20} color="#DC2626" />
                        <Text style={styles.highlightTitle}>24/7 ICU</Text>
                        <Text style={styles.highlightSubtitle}>Emergency</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="shield-check" size={20} color="#059669" />
                        <Text style={styles.highlightTitle}>Cashless</Text>
                        <Text style={styles.highlightSubtitle}>Mediclaim</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="map-pin" size={20} color="#7C3AED" />
                        <Text style={styles.highlightTitle}>1.8 km</Text>
                        <Text style={styles.highlightSubtitle}>Distance</Text>
                    </View>
                </View>

                {/* Key Departments */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Key Departments & Specialties</Text>

                    {[
                        { title: 'Cardiology & Cardiac Surgery', desc: 'Cath lab 24/7, Angioplasty, Open Heart Surgery', icon: 'heart', color: '#EF4444' },
                        { title: 'Neurology & Brain Spine Unit', desc: 'Stroke emergency unit, Brain Tumor & Spine Surgery', icon: 'brain', color: '#7C3AED' },
                        { title: 'Orthopedics & Joint Replacement', desc: 'Robotic Knee & Hip Replacement, Trauma Center', icon: 'bone', color: '#1C6ED5' },
                        { title: 'Pediatrics & Neonatal Care (NICU)', desc: '24/7 Pediatric ICU, Newborn Care', icon: 'baby', color: '#D97706' },
                        { title: 'Oncology & Radiation Therapy', desc: 'Chemotherapy day care, CyberKnife, Surgical Oncology', icon: 'briefcase-medical', color: '#059669' },
                    ].map((dept, i) => (
                        <View key={i} style={styles.deptRow}>
                            <View style={[styles.deptIconWrapper, { backgroundColor: `${dept.color}15` }]}>
                                <AppIcon name={dept.icon as any} size={20} color={dept.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.deptTitle}>{dept.title}</Text>
                                <Text style={styles.deptDesc}>{dept.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Cashless Insurance Partners */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Cashless Insurance Partners</Text>
                    <Text style={styles.insuranceSubtitle}>Over 35+ insurance TPAs accepted for instant cashless claims</Text>

                    <View style={styles.insuranceGrid}>
                        {['Star Health', 'HDFC ERGO', 'ICICI Lombard', 'Niva Bupa', 'Care Health', 'Bajaj Allianz'].map((provider, index) => (
                            <View key={index} style={styles.insuranceChip}>
                                <AppIcon name="shield-check" size={12} color="#059669" />
                                <Text style={styles.insuranceChipText}>{provider}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Facilities */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Hospital Facilities & Amenities</Text>

                    <View style={styles.facilitiesGrid}>
                        {[
                            '24/7 In-House Pharmacy',
                            '24/7 Blood Bank',
                            'Advanced 3T MRI & CT Scan',
                            'Modular Operation Theaters',
                            'Inpatient Private Rooms',
                            'Valet Parking & Canteen',
                        ].map((facility, idx) => (
                            <View key={idx} style={styles.facilityItem}>
                                <View style={styles.facilityDot} />
                                <Text style={styles.facilityText}>{facility}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Footer */}
            <View style={[styles.footerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
                <TouchableOpacity style={styles.callHelplineButton} activeOpacity={0.8}>
                    <AppIcon name="phone" size={18} color="#DC2626" />
                    <Text style={styles.callHelplineText}>Emergency Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.bookButton}
                    onPress={() => navigation.navigate('DoctorList')}
                >
                    <LinearGradient
                        colors={['#1C6ED5', '#1557B0']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.bookGradient}
                    >
                        <Text style={styles.bookText}>Book Appointment</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 6,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
    },
    content: {
        padding: 16,
    },
    heroCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    accreditationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    accreditationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    accreditationText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    hospitalName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    hospitalAddress: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.85)',
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    statusChipText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    highlightsGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    highlightCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    highlightTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 6,
    },
    highlightSubtitle: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 14,
    },
    deptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    deptIconWrapper: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deptTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    deptDesc: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    insuranceSubtitle: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 12,
        marginTop: -8,
    },
    insuranceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    insuranceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    insuranceChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#047857',
    },
    facilitiesGrid: {
        gap: 10,
    },
    facilityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    facilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#1C6ED5',
    },
    facilityText: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    footerBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    callHelplineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    callHelplineText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '700',
    },
    bookButton: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    bookGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    bookText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
