import { executeAction } from '@/src/actions/ActionExecutor';
import { SearchResult } from '@/src/search/search.types';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SearchTab } from '../SearchScreen';
import { groupMedicinesByPharmacy } from '../utils/groupMedicinesByPharmacy';
import { saveRecentSearch } from '../utils/recentSearches';

import DoctorResultCard from './DoctorResultCard';
import FeaturedMedicineCard from './FeaturedMedicineCard';
import LabTestListingCard from './LabTestListingCard';
import PharmacyListingCard from './PharmacyListingCard';

type Props = {
  results: SearchResult[];
  activeTab: SearchTab;
};

export default function SearchResults({ results, activeTab }: Props) {
  const medicines = useMemo(
    () => results.filter((r) => r.domain === 'medicine'),
    [results]
  );
  const doctors = useMemo(
    () => results.filter((r) => r.domain === 'doctor'),
    [results]
  );
  const labTests = useMemo(
    () => results.filter((r) => r.domain === 'lab_test'),
    [results]
  );
  const pharmacies = useMemo(
    () => results.filter((r) => r.domain === 'pharmacy'),
    [results]
  );

  const pharmacyGroups = useMemo(
    () => groupMedicinesByPharmacy(medicines),
    [medicines]
  );

  const handleResultPress = useCallback((res: SearchResult) => {
    if (res.title) {
      saveRecentSearch(res.title);
    }
    executeAction(res.action.key, res.action.params);
  }, []);

  const handleMedicinePress = useCallback((medicine: any) => {
    executeAction('OPEN_PHARMACY', {
      pharmacyId: medicine.pharmacy.pharmacyId,
      medicineId: medicine.id,
    });
  }, []);

  const handlePharmacyPress = useCallback((pharmacyId: string) => {
    executeAction('OPEN_PHARMACY', { pharmacyId });
  }, []);

  const mapSearchResultToMedicineItem = useCallback((item: SearchResult) => {
    const meta = item.meta as any;
    return {
      id: meta.id,
      sku: meta.sku,
      name: meta.name,
      form: meta.form ?? '',
      price: meta.price,
      discountPrice: meta.discountPrice,
      images: meta.images,
      composition: meta.composition,
      prescriptionRequired: meta.prescriptionRequired,
      batchNum: meta.batchNum,
      expiryDate: meta.expiryDate,
      manufacturer: meta.manufacturer,
      pharmacy: {
        pharmacyId: meta.pharmacyId || 'p1',
        pharmacyName: meta.pharmacyName || 'Pharmacy',
        rating: meta.storeRating ?? meta.rating ?? 0,
        unitsAvailable: meta.unitsAvailable ?? 0,
        isOpen: meta.isOpen ?? false,
        storeImageUrl: meta.storeImageUrl,
      },
    };
  }, []);

  // Mock data for prominent carousel
  const featuredMedicines = useMemo(() => [
    {
      id: 'f1',
      name: 'Amoxicillin 500mg',
      pharmacy: {
        pharmacyId: 'p1',
        pharmacyName: 'Apollo Pharmacy',
        rating: 4.8,
        isOpen: true,
        deliveryTime: '15-20 mins',
        storeImageUrl: 'https://images.unsplash.com/photo-1583324113626-70df0f43aa2b?q=80&w=100&auto=format&fit=crop',
      }
    },
    {
      id: 'f2',
      name: 'Dolo 650',
      pharmacy: {
        pharmacyId: 'p2',
        pharmacyName: 'MedPlus',
        rating: 4.5,
        isOpen: true,
        deliveryTime: '20-25 mins',
        storeImageUrl: 'https://images.unsplash.com/photo-1471864190281-ad5f9f81ce4a?q=80&w=600&auto=format&fit=crop',
      }
    }
  ], []);

  // Mock medicines to show when a pharmacy is matched but no specific products are returned
  const mockPharmacyMedicines = useMemo(() => [
    {
      id: 'm1',
      title: 'Crocin Advance 650mg',
      domain: 'medicine' as const,
      meta: {
        id: 'm1',
        name: 'Crocin Advance 650mg',
        price: 58,
        discountPrice: 49,
        isOpen: true,
        storeRating: 4.5,
        pharmacyId: 'p1',
        pharmacyName: 'Pharmacy',
      },
      action: { key: 'OPEN_PHARMACY' as any, params: { pharmacyId: 'p1', medicineId: 'm1' } }
    },
    {
      id: 'm2',
      title: 'Vicks Vaporub 25g',
      domain: 'medicine' as const,
      meta: {
        id: 'm2',
        name: 'Vicks Vaporub 25g',
        price: 95,
        discountPrice: 85,
        isOpen: true,
        storeRating: 4.7,
        pharmacyId: 'p1',
        pharmacyName: 'Pharmacy',
      },
      action: { key: 'OPEN_PHARMACY' as any, params: { pharmacyId: 'p1', medicineId: 'm2' } }
    },
    {
      id: 'm3',
      title: 'Dolo 650mg Tablet',
      domain: 'medicine' as const,
      meta: {
        id: 'm3',
        name: 'Dolo 650mg Tablet',
        price: 30,
        discountPrice: 28,
        isOpen: true,
        storeRating: 4.8,
        pharmacyId: 'p1',
        pharmacyName: 'Pharmacy',
      },
      action: { key: 'OPEN_PHARMACY' as any, params: { pharmacyId: 'p1', medicineId: 'm3' } }
    }
  ], []);

  // Merged groups: real medicine matches + direct pharmacy matches
  const mergedPharmacyGroups = useMemo(() => {
    const groups = pharmacyGroups.map(g => ({ ...g, distanceKm: undefined as number | undefined }));

    pharmacies.forEach((p) => {
      const meta = p.meta as any;
      const existingKey = groups.findIndex(g => g.pharmacyId === p.id);
      
      if (existingKey >= 0) {
        groups[existingKey].distanceKm = meta?.distanceKm;
        groups[existingKey].storeImageUrl = meta?.storeImageUrl || groups[existingKey].storeImageUrl;
        groups[existingKey].isOpen = meta?.isOpen ?? groups[existingKey].isOpen;
      } else {
        groups.push({
          pharmacyId: p.id,
          pharmacyName: p.title,
          rating: meta?.rating ?? 4.2,
          isOpen: meta?.isOpen ?? true,
          storeImageUrl: meta?.storeImageUrl,
          medicines: [], // Remove mock products
          distanceKm: meta?.distanceKm,
          todayOpenHours: meta?.todayOpenHours,
          totalDeliveryTime: meta?.totalDeliveryTime,
          storeStatus: meta?.storeStatus,
        } as any);
      }
    });

    return groups;
  }, [pharmacyGroups, pharmacies]);

  // Mock data for previous orders
  const previousOrders = useMemo(() => [
    {
      id: 'o1',
      pharmacyName: "Wellness Forever",
      deliveryTime: "25-30 mins",
      itemName: "Crocin Advance 650mg",
      price: 58,
      pharmacyLogo: "https://images.unsplash.com/photo-1583324113626-70df0f43aa2b?q=80&w=100&auto=format&fit=crop",
    }
  ], []);

  const renderMedicineTab = () => (
    <>
      {/* Prominent Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          horizontal
          data={featuredMedicines}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <FeaturedMedicineCard
              medicine={item as any}
              onPress={() => executeAction('OPEN_PHARMACY', {
                pharmacyId: (item as any).pharmacy?.pharmacyId || 'p1',
                medicineId: item.id
              })}
            />
          )}
        />
      </View>

      {/* Previous Orders Section */}
      {/* <View style={styles.section}>
        <Text style={styles.sectionMainTitle}>Your previous orders</Text>
        {previousOrders.map(order => (
          <PreviousOrderCard
            key={order.id}
            order={order}
            onPress={() => executeAction('OPEN_PHARMACY', { pharmacyId: 'p1' })}
          />
        ))}
      </View> */}

      {/* {medicines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionMainTitle}>Individual results</Text>
          {medicines.slice(0, 5).map((item) => {
            if (item.domain !== 'medicine') return null;
            const meta = item.meta;
            return (
              <MedicineResultCard
                key={item.id}
                medicine={{
                  id: meta.id,
                  sku: meta.sku,
                  name: meta.name,
                  form: meta.form ?? '',
                  price: meta.price,
                  discountPrice: meta.discountPrice,
                  images: meta.images,
                  composition: meta.composition,
                  prescriptionRequired: meta.prescriptionRequired,
                  batchNum: meta.batchNum,
                  expiryDate: meta.expiryDate,
                  manufacturer: meta.manufacturer,
                  pharmacy: {
                    pharmacyId: meta.pharmacyId,
                    pharmacyName: meta.pharmacyName,
                    rating: meta.storeRating ?? 0,
                    unitsAvailable: meta.unitsAvailable ?? 0,
                    isOpen: meta.isOpen ?? false,
                    storeImageUrl: meta.storeImageUrl,
                  },
                }}
                onPress={() => handleResultPress(item)}
              />
            );
          })}
        </View>
      )} */}

      {mergedPharmacyGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionFeaturedTitle}>FEATURED PHARMACIES</Text>
            <View style={styles.headerLine} />
          </View>
          <View style={styles.pharmacyListContainer}>
            {mergedPharmacyGroups.map((group, index) => (
              <PharmacyListingCard
                key={group.pharmacyId}
                pharmacy={{
                  id: group.pharmacyId,
                  name: group.pharmacyName,
                  rating: group.rating,
                  isOpen: group.isOpen,
                  deliveryTime: group.totalDeliveryTime ? `${group.totalDeliveryTime}-${group.totalDeliveryTime + 5} mins` : (group.isOpen ? '30-35 mins' : undefined),
                  storeImageUrl: group.storeImageUrl,
                  distanceKm: (group as any).distanceKm,
                  todayOpenHours: (group as any).todayOpenHours,
                  totalDeliveryTime: (group as any).totalDeliveryTime,
                  storeStatus: (group as any).storeStatus,
                  medicines: group.medicines.map(mapSearchResultToMedicineItem),
                }}
                onPress={() => handlePharmacyPress(group.pharmacyId)}
                onMedicinePress={handleMedicinePress}
                isLast={index === mergedPharmacyGroups.length - 1}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );

  const renderPharmacyTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionFeaturedTitle}>PHARMACIES NEAR YOU</Text>
        <View style={styles.headerLine} />
      </View>

      <View>
        {pharmacies.map((item, index) => {
          if (item.domain !== 'pharmacy') return null;
          const meta = item.meta;
          return (
            <PharmacyListingCard
              key={item.id}
              pharmacy={{
                id: meta.id,
                name: meta.name,
                rating: meta.rating ?? 4.2,
                isOpen: meta.isOpen ?? true,
                deliveryTime: meta.totalDeliveryTime ? `${meta.totalDeliveryTime}-${meta.totalDeliveryTime + 5} mins` : (meta.deliveryTime ?? '15-20 mins'),
                storeImageUrl: meta.storeImageUrl,
                distanceKm: meta.distanceKm,
                todayOpenHours: meta.todayOpenHours,
                totalDeliveryTime: meta.totalDeliveryTime,
                storeStatus: meta.storeStatus,
                medicines: [],
              }}
              onPress={() =>
                executeAction('OPEN_PHARMACY', { pharmacyId: item.id })
              }
              onMedicinePress={handleMedicinePress}
              variant="hero"
              isLast={index === pharmacies.length - 1}
            />
          );
        })}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {activeTab === 'Medicines' ? renderMedicineTab() : renderPharmacyTab()}

      {/* Others Section (Doctors/Labs) if applicable */}
      {(doctors.length > 0 || labTests.length > 0) && (
        <View style={styles.section}>
          {doctors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>DOCTORS</Text>
              {doctors.map((item) => {
                if (!item.meta) return null;
                const meta = item.meta;
                return (
                  <DoctorResultCard
                    key={item.id}
                    doctor={{
                      id: meta.id,
                      name: meta.name,
                      specialty: meta.specialty,
                      experience: 0,
                      rating: 0,
                    }}
                    onPress={() => handleResultPress(item)}
                  />
                );
              })}
            </>
          )}

          {labTests.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>LAB TESTS</Text>
              {labTests.map((item) => {
                if (!item.meta) return null;
                const meta = item.meta;
                return (
                  <LabTestListingCard
                    key={item.id}
                    labTest={{
                      id: meta.id,
                      name: meta.name,
                    }}
                    onPress={() => handleResultPress(item)}
                  />
                );
              })}
            </>
          )}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  carouselContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  section: {
    marginTop: 8,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
  },
  sectionMainTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  sectionFeaturedTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pharmacyListContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingTop: 8,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
