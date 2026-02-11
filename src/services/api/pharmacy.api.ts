import { apiClient } from './client';

/**
 * Fetch pharmacy (store) details
 * Backend expects POST with storeId + lat + long
 */
export const getStoreDetails = async ({
  storeId,
  lat,
  long,
}: {
  storeId: string;
  lat: number;
  long: number;
}) => {
    // console url
  const response = await apiClient.post('/api/user/store-details', {
    storeId,
    lat,
    long,
  });

  // backend returns { message, data }
  return response.data?.data;
};

/**
 * Fetch medicines list for a store
 * Backend returns raw array
 */
export const getStoreMedicines = async ({
  storeId,
  page = 1,
  limit = 50,
}: {
  storeId: string;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.get('/api/user/list-store-medicines', {
    params: {
      storeId,
      page,
      limit,
    },
  });

  // backend returns array directly
  return response.data;
};

/**
 * Fetch medicine prescriptions for user
 */
export const getMedicinePrescriptions = async ({
  id,
}: {
  id?: string;
}) => {
  const response = await apiClient.get('/get-medicine-prescription', {
    params: id ? { id } : {},
  });

  return response.data;
};

export const getNearbyPharmacies = async ({
  lat,
  long,
  page = 1,
  limit = 50,
}: {
  lat: number;
  long: number;
  page?: number;
  limit?: number;
}) => {
  const response = await apiClient.post('/api/user/nearby', {
    lat,
    long,
    page,
    limit,
  });

  return response.data;
};

/**
 * Add pharmacy to favorites
 */
export const addFavoritePharmacy = async (storeId: string) => {
  const response = await apiClient.post('/api/user/add-favorite-store', {
    storeId,
  });
  return response.data;
};

/**
 * Remove pharmacy from favorites
 */
export const removeFavoritePharmacy = async (storeId: string) => {
  const response = await apiClient.post('/api/user/remove-favorite-store', {
    storeId,
  });
  return response.data;
};

/**
 * Check if pharmacy is in favorites
 */
export const checkFavoritePharmacy = async (storeId: string) => {
  const response = await apiClient.get('/api/user/check-favorite-store', {
    params: { storeId },
  });
  return response.data?.isFavorite ?? false;
};

/**
 * Get all favorite pharmacies
 */
export const getFavoritePharmacies = async () => {
  const response = await apiClient.get('/api/user/favorite-stores');
  return response.data;
};