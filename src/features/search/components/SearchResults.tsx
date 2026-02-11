import { executeAction } from '@/src/actions/ActionExecutor';
import { SearchResult } from '@/src/search/search.types';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { groupMedicinesByPharmacy } from '../utils/groupMedicinesByPharmacy';
import { saveRecentSearch } from '../utils/recentSearches';

import DoctorResultCard from './DoctorResultCard';
import FeaturedMedicineCard from './FeaturedMedicineCard';
import LabTestListingCard from './LabTestListingCard';
import PharmacyListingCard from './PharmacyListingCard';

type Props = {
  results: SearchResult[];
};

export default function SearchResults({ results }: Props) {
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

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {/* Featured Medicines Section */}
      {medicines.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEATURED MEDICINES</Text>
          <FlatList
            data={medicines.slice(0, 5)}
            renderItem={({ item }) => {
              const meta = item.meta;
              return (
                <FeaturedMedicineCard
                  medicine={{
                    id: meta.id,
                    sku: meta.sku,
                    name: meta.name,
                    manufacturer: meta.manufacturer,
                    pharmacy: {
                      pharmacyName: meta.pharmacyName,
                      rating: meta.storeRating ?? 0,
                      isOpen: meta.isOpen ?? false,
                      storeImageUrl: meta.storeImageUrl,
                    },
                  }}
                  onPress={() => handleResultPress(item)}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Pharmacies with Medicines */}
      {pharmacyGroups.map((group) => (
        <PharmacyListingCard
          key={group.pharmacyId}
          pharmacy={{
            id: group.pharmacyId,
            name: group.pharmacyName,
            rating: group.rating,
            isOpen: group.isOpen,
            deliveryTime: group.isOpen ? '30-35 mins' : undefined,
            storeImageUrl: group.storeImageUrl,
            medicines: group.medicines.map((item) => {
              const meta = item.meta;
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
                  pharmacyId: meta.pharmacyId,
                  pharmacyName: meta.pharmacyName,
                  rating: meta.storeRating ?? 0,
                  unitsAvailable: meta.unitsAvailable ?? 0,
                  isOpen: meta.isOpen ?? false,
                  storeImageUrl: meta.storeImageUrl,
                },
              };
            }),
          }}
          onPress={() => handlePharmacyPress(group.pharmacyId)}
          onMedicinePress={handleMedicinePress}
        />
      ))}

      {/* Doctors Section */}
      {doctors.length > 0 && (
        <View style={styles.section}>
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
        </View>
      )}

      {/* Lab Tests Section */}
      {labTests.length > 0 && (
        <View style={styles.section}>
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
        </View>
      )}

      {/* Pharmacies Section */}
      {pharmacies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PHARMACIES</Text>
          {pharmacies.map((item) => {
            if (!item.meta) return null;
            const meta = item.meta;
            return (
              <PharmacyListingCard
                key={item.id}
                pharmacy={{
                  id: meta.id,
                  name: meta.name,
                  rating: 0,
                  isOpen: true,
                  medicines: [],
                }}
                onPress={() => handleResultPress(item)}
                onMedicinePress={() => {}}
              />
            );
          })}
        </View>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#FFFFFF',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  bottomSpacer: {
    height: 24,
  },
});
