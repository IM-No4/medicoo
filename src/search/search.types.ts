import { ActionKey } from '@/src/actions/action.types';

/* ---------- DOMAIN ---------- */

export type SearchDomain =
  | 'doctor'
  | 'medicine'
  | 'lab_test'
  | 'pharmacy';

/* ---------- META TYPES ---------- */

export type DoctorSearchMeta = {
  id: string;
  name: string;
  specialty: string;
};

// One line of the search box's suggestions. Choosing it runs a search for exactly that kind of thing.
export type SearchSuggestion = {
  kind: 'medicine' | 'pharmacy' | 'composition' | 'manufacturer';
  id?: string;
  title: string;
  subtitle?: string;
};

// How a search was started, beyond its words: a home screen medicine card (`medicineId`), or a chosen suggestion (`scope`, `field`).
export type SearchExtra = {
  scope?: 'pharmacy' | 'medicine';
  field?: 'name' | 'composition' | 'manufacturer';
  medicineId?: string;
};

export type MedicineSearchMeta = {
  id: string;
  name: string;
  sku?: number;
  form?: string;
  manufacturer?: string;
  pharmacyId: string;
  pharmacyName: string;
  unitsAvailable?: number;
  isOpen?: boolean;
  storeRating?: number;
  storeImageUrl?: string | null;
  price?: number;
  discountPrice?: number;
  images?: string[];
  composition?: string;
  prescriptionRequired?: boolean;
  // another medicine with the same composition as the one searched for
  isAlternative?: boolean;
  batchNum?: string[] | string | number;
  expiryDate?: string[] | string;
};

export type PharmacySearchMeta = {
  id: string;
  name: string;
  rating?: number;
  isOpen?: boolean;
  deliveryTime?: string;
  storeImageUrl?: string | null;
  distanceKm?: number;
  totalDeliveryTime?: number;
  apiDeliveryTime?: number;
  prepTime?: number;
  todayOpenHours?: any;
  storeStatus?: string;
};

export type LabTestSearchMeta = {
  id: string;
  name: string;
};

/* ---------- RESULT ---------- */

export type SearchResult =
  | {
    id: string;
    domain: 'doctor';
    title: string;
    subtitle?: string;
    meta: DoctorSearchMeta;
    action: {
      key: ActionKey;
      params?: { doctorId: string };
    };
  }
  | {
    id: string;
    domain: 'medicine';
    title: string;
    subtitle?: string;
    meta: MedicineSearchMeta;
    action: {
      key: ActionKey;
      params?: {
        pharmacyId: string;
        medicineId: string;
      };
    };
  }
  | {
    id: string;
    domain: 'pharmacy';
    title: string;
    subtitle?: string;
    meta: PharmacySearchMeta;
    action: {
      key: ActionKey;
      params?: { pharmacyId: string };
    };
  }
  | {
    id: string;
    domain: 'lab_test';
    title: string;
    subtitle?: string;
    meta: LabTestSearchMeta;
    action: {
      key: ActionKey;
      params?: { testId: string };
    };
  };
