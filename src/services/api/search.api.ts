import { apiClient } from "./client";

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
    // true when this is not the medicine searched for but another with the same composition
    isAlternative?: boolean;
    batchNum?: string[] | string | number;
    expiryDate?: string[] | string;
  }>;
  // medicine results come a page of pharmacies at a time
  pagination?: { page: number; hasMore: boolean };
  pharmacies?: Array<{
    id: string;
    name: string;
    storeStatus?: string;
    storePhotos?: {
      insidePhoto?: string | null;
      outsidePhoto?: string | null;
    };
    todayOpenHours?: any;
    distanceKm?: number;
    prepTime?: number;
    deliveryTime?: number;
    totalDeliveryTime?: number;
  }>;
};

export type SuggestionApiResponse = {
  suggestions?: Array<{ kind: 'medicine' | 'pharmacy' | 'composition' | 'manufacturer'; id?: string; title: string; subtitle?: string }>;
};

export async function fetchSuggestionList(query: string, pincodeLat?: number, pincodeLng?: number) {
  if (!query || query.trim().length < 2) return [];
  const params: any = { q: query.trim() };
  if (pincodeLat) params.pincodeLat = pincodeLat;
  if (pincodeLng) params.pincodeLng = pincodeLng;
  const res = await apiClient.get<SuggestionApiResponse>("/api/user/search/suggestions", { params });
  return res.data.suggestions || [];
}

export async function searchGlobal(
  query: string,
  category?: string,
  type?: string,
  tags?: string[],
  pincodeLat?: number,
  pincodeLng?: number,
  page?: number,
  extra?: { scope?: string; field?: string; medicineId?: string },
) {
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
  if (tags && tags.length > 0) params.tags = tags.join(",");
  if (pincodeLat) params.pincodeLat = pincodeLat;
  if (pincodeLng) params.pincodeLng = pincodeLng;
  if (page && page > 1) params.page = page;
  if (extra?.scope) params.scope = extra.scope;
  if (extra?.field) params.field = extra.field;
  if (extra?.medicineId) params.medicineId = extra.medicineId;

  const res = await apiClient.get<SearchApiResponse>("/api/user/search", {
    params,
  });

  console.log("Search API Response:", res.data);
  return res.data;
}
