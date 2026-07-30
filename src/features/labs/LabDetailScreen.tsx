import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from '@/src/components/icons/AppIcon';

export default function LabDetailScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();

  const { labId } = route.params || {};

  const [isBooked, setIsBooked] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AppIcon name="arrow-left" size={20} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lab Test Details</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AppIcon name="share" size={20} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Lab Header Hero */}
        <LinearGradient
          colors={['#1E3A8A', '#2563EB', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.accreditationRow}>
            <View style={styles.accreditationBadge}>
              <AppIcon name="shield-check" size={12} color="#FFFFFF" />
              <Text style={styles.accreditationText}>NABL & CAP Certified Lab</Text>
            </View>
            <View style={styles.ratingBadge}>
              <AppIcon name="star" size={12} color="#FDE047" />
              <Text style={styles.ratingText}>4.8 (12.4k)</Text>
            </View>
          </View>

          <Text style={styles.labName}>Full Body Health Shield (75 Tests)</Text>
          <Text style={styles.labProvider}>Provided by Thyrocare Diagnostics</Text>

          <View style={styles.heroPriceRow}>
            <Text style={styles.heroPrice}>₹799</Text>
            <Text style={styles.heroOriginalPrice}>₹2,800</Text>
            <View style={styles.heroDiscountBadge}>
              <Text style={styles.heroDiscountText}>72% OFF</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Highlights */}
        <View style={styles.highlightsGrid}>
          <View style={styles.highlightCard}>
            <AppIcon name="clock" size={20} color="#059669" />
            <Text style={styles.highlightTitle}>12-24 Hrs</Text>
            <Text style={styles.highlightSubtitle}>Report Speed</Text>
          </View>

          <View style={styles.highlightCard}>
            <AppIcon name="home" size={20} color="#7C3AED" />
            <Text style={styles.highlightTitle}>Free Pickup</Text>
            <Text style={styles.highlightSubtitle}>At Your Home</Text>
          </View>

          <View style={styles.highlightCard}>
            <AppIcon name="sun" size={20} color="#D97706" />
            <Text style={styles.highlightTitle}>10-12 Hrs</Text>
            <Text style={styles.highlightSubtitle}>Fasting Req.</Text>
          </View>
        </View>

        {/* Tests Included Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tests Included in Package (75)</Text>

          {[
            { name: 'Complete Blood Count (CBC)', count: '24 Parameters' },
            { name: 'Lipid Profile (Cholesterol Panel)', count: '8 Parameters' },
            { name: 'Liver Function Test (LFT)', count: '11 Parameters' },
            { name: 'Kidney Function Test (KFT)', count: '10 Parameters' },
            { name: 'Thyroid Profile (T3, T4, TSH)', count: '3 Parameters' },
            { name: 'Diabetic Screen (HbA1c & Fasting Glucose)', count: '2 Parameters' },
            { name: 'Urine Routine Examination', count: '17 Parameters' },
          ].map((item, index) => (
            <View key={index} style={styles.testItemRow}>
              <View style={styles.checkIconWrapper}>
                <AppIcon name="check" size={14} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.testItemName}>{item.name}</Text>
                <Text style={styles.testItemCount}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How Home Collection Works */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How Home Sample Collection Works</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Book Slot Online</Text>
              <Text style={styles.stepDescription}>Select your preferred date & time for sample pickup.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Phlebotomist Pick-up</Text>
              <Text style={styles.stepDescription}>Vaccinated professional collects samples safely at home.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Digital Report in 12-24 Hrs</Text>
              <Text style={styles.stepDescription}>Download certified PDF reports directly on your mobile app.</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Booking Bar */}
      <View style={[styles.footerBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        <View>
          <Text style={styles.footerPriceLabel}>Total Amount</Text>
          <Text style={styles.footerPrice}>₹799 <Text style={styles.footerOriginalPrice}>₹2,800</Text></Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.bookButton, isBooked && styles.bookButtonActive]}
          onPress={() => setIsBooked(!isBooked)}
        >
          <LinearGradient
            colors={isBooked ? ['#059669', '#047857'] : ['#1C6ED5', '#1557B0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookGradient}
          >
            <Text style={styles.bookText}>{isBooked ? 'Booked Successfully ✓' : 'Book Lab Test'}</Text>
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
  labName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  labProvider: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroOriginalPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textDecorationLine: 'line-through',
  },
  heroDiscountBadge: {
    backgroundColor: '#FDE047',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  heroDiscountText: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '800',
  },
  highlightsGrid: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 13,
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
  testItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  testItemCount: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C6ED5',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
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
  footerPriceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerOriginalPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  bookButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookButtonActive: {
    opacity: 0.95,
  },
  bookGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  bookText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
