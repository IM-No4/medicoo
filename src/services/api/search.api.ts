import { apiClient } from './client';

export type SearchApiResponse = {
  doctors?: Array<{
    id: string;
    name: string;
    specialty: string;
  }>;
  medicines?: Array<{
    id: string;
    name: string;
    sku?: number;
    form?: string;
    manufacturer?: string;
    pharmacyId: string;
    pharmacyName: string;
    isOpen: boolean;
    unitsAvailable: number;
    storeImageUrl?: string | null;
    storeRating?: number;
    price?: number;
    discountPrice?: number;
    images?: string[];
    composition?: string;
    prescriptionStatus?: boolean;
    batchNum?: string[] | string | number;
    expiryDate?: string[] | string;
  }>;
  pharmacies?: Array<{
    id: string;
    name: string;
  }>;
};

export async function searchGlobal(query: string, category?: string, type?: string) {
  if (!query || query.length < 2) {
    return {
      doctors: [],
      medicines: [],
      pharmacies: [],
    };
  }

  const params: any = { q: query };
  if (category) params.category = category;
  if (type) params.type = type;

  const res = await apiClient.get<SearchApiResponse>(
    '/api/user/search',
    { params }
  );

  return res.data;
}
