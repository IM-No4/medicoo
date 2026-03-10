import { SearchResult } from '@/src/search/search.types';

export type PharmacyGroup = {
  pharmacyId: string;
  pharmacyName: string;
  rating: number;
  isOpen: boolean;
  storeImageUrl?: string | null;
  todayOpenHours?: any;
  totalDeliveryTime?: number;
  storeStatus?: string;
  medicines: SearchResult[];
};

export function groupMedicinesByPharmacy(
  medicineResults: SearchResult[]
): PharmacyGroup[] {
  const pharmacyMap = new Map<string, PharmacyGroup>();

  medicineResults.forEach((result) => {
    if (result.domain !== 'medicine' || !result.meta) return;

    const meta = result.meta;
    const pharmacyId = meta.pharmacyId;
    const pharmacyName = meta.pharmacyName;

    if (!pharmacyMap.has(pharmacyId)) {
      pharmacyMap.set(pharmacyId, {
        pharmacyId,
        pharmacyName,
        rating: meta.storeRating ?? 0,
        isOpen: meta.isOpen ?? false,
        storeImageUrl: meta.storeImageUrl,
        todayOpenHours: meta.todayOpenHours,
        totalDeliveryTime: meta.totalDeliveryTime,
        storeStatus: meta.storeStatus,
        medicines: [],
      });
    }

    pharmacyMap.get(pharmacyId)!.medicines.push(result);
  });

  return Array.from(pharmacyMap.values());
}


