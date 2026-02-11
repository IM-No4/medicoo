import { SearchApiResponse } from '@/src/services/api/search.api';
import { SearchResult } from './search.types';

export function normalizeSearchResponse(
  data: SearchApiResponse
): SearchResult[] {
  const results: SearchResult[] = [];

  /* ---------- Doctors ---------- */
  data.doctors?.forEach((d) => {
    results.push({
      id: d.id,
      domain: 'doctor',
      title: d.name,
      subtitle: d.specialty,
      meta: {
        id: d.id,
        name: d.name,
        specialty: d.specialty,
      },
      action: {
        key: 'OPEN_DOCTOR_DETAIL',
        params: { doctorId: d.id },
      },
    });
  });

  /* ---------- Medicines (ONE pharmacy per result) ---------- */
  data.medicines?.forEach((m) => {
    results.push({
      id: `${m.id}_${m.pharmacyId}`, // 🔒 unique per pharmacy
      domain: 'medicine',
      title: m.name,
      subtitle: m.form ?? m.manufacturer ?? '',
      meta: {
        id: m.id,
        name: m.name,
        sku: m.sku,
        form: m.form ?? '',
        manufacturer: m.manufacturer,
        pharmacyId: m.pharmacyId,
        pharmacyName: m.pharmacyName,
        unitsAvailable: m.unitsAvailable,
        isOpen: m.isOpen,
        storeRating: m.storeRating,
        storeImageUrl: m.storeImageUrl,
        price: m.price,
        discountPrice: m.discountPrice,
        images: m.images,
        composition: m.composition,
        prescriptionRequired: m.prescriptionStatus,
        batchNum: m.batchNum,
        expiryDate: m.expiryDate,
      },
      action: {
        key: 'OPEN_PHARMACY',
        params: {
          pharmacyId: m.pharmacyId,
          medicineId: m.id,
        },
      },
    });
  });

  return results;
}
