import { executeAction } from '@/src/actions/ActionExecutor';
import { RootState } from '@/src/redux/store';
import { getStoreDetails } from '@/src/services/api/pharmacy.api';
import { SearchResult } from '@/src/search/search.types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSelector } from 'react-redux';
import { SearchTab } from '../SearchScreen';
import { anyFilterOn, FAST_DELIVERY_MINS, SearchFilters, TOP_RATED_MIN } from '../searchFilters';
import { groupMedicinesByPharmacy } from '../utils/groupMedicinesByPharmacy';
import { saveRecentSearch } from '../utils/recentSearches';

import DoctorResultCard from './DoctorResultCard';
import LabTestListingCard from './LabTestListingCard';
import PharmacyListingCard from './PharmacyListingCard';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';
import { useLanguage } from '../../../i18n/LanguageContext';

type Props = {
  results: SearchResult[];
  activeTab: SearchTab;
  filters?: SearchFilters;
  // the Rx switch in the search bar: only medicines that need a prescription
  prescriptionOnly?: boolean;
  onClearFilters?: () => void;
};

const NO_FILTERS: SearchFilters = { sort: 'relevance', fastDelivery: false, topRated: false, offers: false };

export default function SearchResults({ results, activeTab, filters = NO_FILTERS, prescriptionOnly = false, onClearFilters }: Props) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const medicines = useMemo(
    () => results.filter((r) => r.domain === 'medicine' && (!prescriptionOnly || !!(r.meta as any)?.prescriptionRequired)),
    [results, prescriptionOnly]
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

  // Real per-store distance/ETA - same source (getStoreDetails) and ETA
  // formula CartScreen.tsx uses, rather than the hardcoded "25-30 mins" /
  // "2.5 km" fallbacks these cards used to show whenever the search
  // response itself didn't carry distance/delivery-time (which is every
  // medicine-domain result - only direct pharmacy-name matches get that
  // from the backend).
  const selectedAddress = useSelector((state: RootState) => state.address.selectedAddress);
  const currentLocation = useSelector((state: RootState) => state.location.currentLocation);
  const lat = selectedAddress?.latitude ?? currentLocation?.latitude;
  const long = selectedAddress?.longitude ?? currentLocation?.longitude;

  const [storeLiveInfo, setStoreLiveInfo] = useState<
    Record<string, { distanceKm: number; deliveryEtaMins: number }>
  >({});

  const visiblePharmacyIds = useMemo(() => {
    const ids =
      activeTab === 'Medicines'
        ? mergedPharmacyGroups.map((g) => g.pharmacyId)
        : pharmacies.map((p) => p.id);
    return Array.from(new Set(ids.filter(Boolean)));
  }, [activeTab, mergedPharmacyGroups, pharmacies]);

  useEffect(() => {
    if (!lat || !long || visiblePharmacyIds.length === 0) return;
    let active = true;

    (async () => {
      const settled = await Promise.all(
        visiblePharmacyIds.map(async (storeId) => {
          try {
            const details = await getStoreDetails({ storeId, lat, long });
            const distanceKm =
              details?.distance !== undefined ? parseFloat(details.distance) : NaN;
            if (isNaN(distanceKm)) return null;
            // Same formula as CartScreen.tsx's deliveryEtaMins.
            const deliveryEtaMins = Math.round(20 + distanceKm * 3);
            return [storeId, { distanceKm, deliveryEtaMins }] as const;
          } catch {
            return null;
          }
        })
      );

      if (!active) return;
      setStoreLiveInfo((prev) => {
        const next = { ...prev };
        settled.forEach((entry) => {
          if (entry) next[entry[0]] = entry[1];
        });
        return next;
      });
    })();

    return () => {
      active = false;
    };
  }, [visiblePharmacyIds, lat, long]);

  // The chips: which pharmacies stay, in what order. Delivery time and distance come from storeLiveInfo (loaded per store); a store whose
  // figures have not arrived yet is not dropped by the delivery filter. "Offers" keeps only medicines with a discount, and only the
  // pharmacies that have one (a pharmacy found by name alone has no medicines to judge, so the offers chip does not filter it).
  const hasOffer = (m: SearchResult) => Number((m.meta as any)?.discountPrice) > 0 && Number((m.meta as any)?.price) > 0;
  const passes = (id: string, rating: number) => {
    const live = storeLiveInfo[id];
    if (filters.topRated && !(Number(rating) >= TOP_RATED_MIN)) return false;
    if (filters.fastDelivery && live && live.deliveryEtaMins > FAST_DELIVERY_MINS) return false;
    return true;
  };
  const sortRows = <T extends { id: string; rating: number }>(rows: T[]): T[] => {
    if (filters.sort === 'relevance') return rows;
    const copy = [...rows];
    if (filters.sort === 'rating') return copy.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    const distance = (id: string) => storeLiveInfo[id]?.distanceKm ?? Number.POSITIVE_INFINITY;
    return copy.sort((a, b) => distance(a.id) - distance(b.id));
  };

  const shownGroups = useMemo(() => {
    const kept = mergedPharmacyGroups
      .map((g) => ({ original: g, shown: filters.offers && g.medicines.length > 0 ? { ...g, medicines: g.medicines.filter(hasOffer) } : g }))
      .filter(({ original, shown }) => !(filters.offers && original.medicines.length > 0 && shown.medicines.length === 0))
      .map(({ shown }) => shown)
      // with Rx on, a pharmacy matched only by its name has no prescription medicine to show
      .filter((g) => !(prescriptionOnly && g.medicines.length === 0))
      .filter((g) => passes(g.pharmacyId, g.rating));
    return sortRows(kept.map((g) => ({ ...g, id: g.pharmacyId })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergedPharmacyGroups, filters, storeLiveInfo, prescriptionOnly]);

  const shownPharmacies = useMemo(() => {
    const kept = pharmacies.filter((p) => passes(p.id, (p.meta as any)?.rating ?? 4.2));
    return sortRows(kept.map((p) => ({ ...p, rating: (p.meta as any)?.rating ?? 4.2 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacies, filters, storeLiveInfo]);

  const nothingMatches = (anyFilterOn(filters) || prescriptionOnly) && (activeTab === 'Medicines' ? shownGroups.length === 0 : shownPharmacies.length === 0);

  const renderMedicineTab = () => (
    <>
      {shownGroups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionFeaturedTitle}>{t('featured_pharmacies')}</Text>
            <View style={styles.headerLine} />
          </View>
          <View style={styles.pharmacyListContainer}>
            {shownGroups.map((group, index) => {
              const live = storeLiveInfo[group.pharmacyId];
              return (
                <PharmacyListingCard
                  key={`${group.pharmacyId}-${index}`}
                  pharmacy={{
                    id: group.pharmacyId,
                    name: group.pharmacyName,
                    rating: group.rating,
                    isOpen: group.isOpen,
                    deliveryTime: live ? `${live.deliveryEtaMins} mins` : undefined,
                    storeImageUrl: group.storeImageUrl,
                    distanceKm: live?.distanceKm,
                    todayOpenHours: (group as any).todayOpenHours,
                    totalDeliveryTime: (group as any).totalDeliveryTime,
                    storeStatus: (group as any).storeStatus,
                    medicines: group.medicines.map(mapSearchResultToMedicineItem),
                  }}
                  onPress={() => handlePharmacyPress(group.pharmacyId)}
                  onMedicinePress={handleMedicinePress}
                  isLast={index === shownGroups.length - 1}
                />
              );
            })}
          </View>
        </View>
      )}
    </>
  );

  const renderPharmacyTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionFeaturedTitle}>{t('pharmacies_near_you')}</Text>
        <View style={styles.headerLine} />
      </View>

      <View>
        {shownPharmacies.map((item, index) => {
          if (item.domain !== 'pharmacy') return null;
          const meta = item.meta;
          const live = storeLiveInfo[item.id];
          return (
            <PharmacyListingCard
              key={item.id}
              pharmacy={{
                id: meta.id,
                name: meta.name,
                rating: meta.rating ?? 4.2,
                isOpen: meta.isOpen ?? true,
                deliveryTime: live ? `${live.deliveryEtaMins} mins` : undefined,
                storeImageUrl: meta.storeImageUrl,
                distanceKm: live?.distanceKm,
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
              isLast={index === shownPharmacies.length - 1}
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
      {nothingMatches ? (
        <View style={styles.noMatch}>
          <Text style={styles.noMatchTitle}>No results match these filters</Text>
          {onClearFilters ? (
            <TouchableOpacity onPress={onClearFilters} activeOpacity={0.7}>
              <Text style={styles.noMatchAction}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : activeTab === 'Medicines' ? renderMedicineTab() : renderPharmacyTab()}

      {/* Others Section (Doctors/Labs) if applicable */}
      {(doctors.length > 0 || labTests.length > 0) && (
        <View style={styles.section}>
          {doctors.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('doctors')}</Text>
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
              <Text style={styles.sectionTitle}>{t('lab_tests_2')}</Text>
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
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
  sectionFeaturedTitle: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '800',
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.cardSecondary,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '800',
    color: c.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pharmacyListContainer: {
    backgroundColor: c.card,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.borderLight,
    paddingTop: 8,
  },
  noMatch: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  noMatchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
  },
  noMatchAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007C69',
  },
  bottomSpacer: {
    // Tall enough to clear the floating MultiStoreCartBar (SearchScreen.tsx)
    // that now overlays the bottom of this screen once there are cart items.
    height: 140,
  },
});
