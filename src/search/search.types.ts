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
  batchNum?: string[] | string | number;
  expiryDate?: string[] | string;
};

export type PharmacySearchMeta = {
  id: string;
  name: string;
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
