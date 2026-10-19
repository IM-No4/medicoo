import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from '../../components/ThemedStatusBar';
import { ChevronLeft } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';

export default function HospitalDetailScreen() {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const route = useRoute<any>();

    const { hospitalId } = route.params || {};

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('hospital_overview')}</Text>
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
                            <Text style={styles.accreditationText}>{t('nabh_jci_accredited')}</Text>
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
                        <Text style={styles.highlightSubtitle}>{t('capacity')}</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="ambulance" size={20} color="#DC2626" />
                        <Text style={styles.highlightTitle}>24/7 ICU</Text>
                        <Text style={styles.highlightSubtitle}>{t('emergency')}</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="shield-check" size={20} color="#059669" />
                        <Text style={styles.highlightTitle}>{t('cashless')}</Text>
                        <Text style={styles.highlightSubtitle}>{t('mediclaim')}</Text>
                    </View>

                    <View style={styles.highlightCard}>
                        <AppIcon name="map-pin" size={20} color="#7C3AED" />
                        <Text style={styles.highlightTitle}>1.8 km</Text>
                        <Text style={styles.highlightSubtitle}>{t('distance')}</Text>
                    </View>
                </View>

                {/* Key Departments */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>{t('key_departments_specialties')}</Text>

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
                    <Text style={styles.sectionTitle}>{t('cashless_insurance_partners')}</Text>
                    <Text style={styles.insuranceSubtitle}>{t('over_35_insurance_tpas_accepted_for_in')}</Text>

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
                    <Text style={styles.sectionTitle}>{t('hospital_facilities_amenities')}</Text>

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
                    <Text style={styles.callHelplineText}>{t('emergency_call')}</Text>
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
                        <Text style={styles.bookText}>{t('book_appointment')}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/* ================= STYLES ================= */

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
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
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: c.border,
    },
    highlightTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: c.text,
        marginTop: 6,
    },
    highlightSubtitle: {
        fontSize: 10,
        color: c.textSecondary,
        marginTop: 2,
    },
    sectionCard: {
        backgroundColor: c.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: c.border,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
        marginBottom: 14,
    },
    deptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.borderLight,
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
        color: c.text,
    },
    deptDesc: {
        fontSize: 12,
        color: c.textSecondary,
        marginTop: 2,
    },
    insuranceSubtitle: {
        fontSize: 12,
        color: c.textSecondary,
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
        backgroundColor: c.successBg,
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
        backgroundColor: c.card,
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: c.border,
    },
    callHelplineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: c.errorBg,
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
