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
  console.log('📡 POST /api/user/store-details:', { storeId, lat, long });
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
  console.log('📡 GET /api/user/list-store-medicines:', { storeId, page, limit });
  const response = await apiClient.get('/api/user/list-store-medicines', {
    params: {
      storeId,
      page,
      limit,
    },
  });

  return response.data?.data ?? response.data?.medicines ?? response.data;
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

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Add pharmacy to favorites
 */
export const addFavoritePharmacy = async (storeId: string) => {
  try {
    const response = await apiClient.post('/api/user/add-favorite-store', {
      storeId,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const stored = await AsyncStorage.getItem('favorite_pharmacies');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.includes(storeId)) {
          list.push(storeId);
          await AsyncStorage.setItem('favorite_pharmacies', JSON.stringify(list));
        }
      } catch (storageError) {
        console.error('Failed to save favorite in storage', storageError);
      }
    } else {
      console.warn('Failed to add favorite:', error.message);
    }
    return null;
  }
};

/**
 * Remove pharmacy from favorites
 */
export const removeFavoritePharmacy = async (storeId: string) => {
  try {
    const response = await apiClient.post('/api/user/remove-favorite-store', {
      storeId,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const stored = await AsyncStorage.getItem('favorite_pharmacies');
        const list = stored ? JSON.parse(stored) : [];
        const updated = list.filter((id: string) => id !== storeId);
        await AsyncStorage.setItem('favorite_pharmacies', JSON.stringify(updated));
      } catch (storageError) {
        console.error('Failed to remove favorite in storage', storageError);
      }
    } else {
      console.warn('Failed to remove favorite:', error.message);
    }
    return null;
  }
};

/**
 * Check if pharmacy is in favorites
 */
export const checkFavoritePharmacy = async (storeId: string) => {
  try {
    const response = await apiClient.get('/api/user/check-favorite-store', {
      params: { storeId },
    });
    return response.data?.isFavorite ?? false;
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const stored = await AsyncStorage.getItem('favorite_pharmacies');
        const list = stored ? JSON.parse(stored) : [];
        return list.includes(storeId);
      } catch {
        return false;
      }
    }
    return false;
  }
};

/**
 * Get all favorite pharmacies
 */
export const getFavoritePharmacies = async () => {
  try {
    const response = await apiClient.get('/api/user/favorite-stores');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      try {
        const stored = await AsyncStorage.getItem('favorite_pharmacies');
        const list = stored ? JSON.parse(stored) : [];
        return list.map((id: string) => ({ storeId: id, id }));
      } catch {
        return [];
      }
    }
    return [];
  }
};