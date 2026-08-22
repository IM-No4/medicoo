import { apiClient } from './client';

// "Notify me when back in stock" for a specific medicine at a specific
// store. See backend routes/customerRoute.js's /stock-alerts endpoints.

export const subscribeStockAlert = async (
  medicineId: string,
  storeId: string,
): Promise<{ subscribed: boolean }> => {
  const response = await apiClient.post('/api/user/stock-alerts', {
    medicineId,
    storeId,
  });
  return response.data;
};

export const unsubscribeStockAlert = async (
  medicineId: string,
  storeId: string,
): Promise<{ subscribed: boolean }> => {
  const response = await apiClient.delete('/api/user/stock-alerts', {
    data: { medicineId, storeId },
  });
  return response.data;
};

export const getStockAlertStatus = async (
  medicineId: string,
  storeId: string,
): Promise<{ subscribed: boolean }> => {
  const response = await apiClient.get('/api/user/stock-alerts/status', {
    params: { medicineId, storeId },
  });
  return response.data;
};
