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
    batchNum?: string[] | string | number;
    expiryDate?: string[] | string;
  }>;
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

export async function searchGlobal(
  query: string,
  category?: string,
  type?: string,
  tags?: string[],
  pincodeLat?: number,
  pincodeLng?: number,
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

  const res = await apiClient.get<SearchApiResponse>("/api/user/search", {
    params,
  });

  console.log("Search API Response:", res.data);
  return res.data;
}
