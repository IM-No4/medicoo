import { apiClient } from './client';

export const getUserAddresses = async () => {
  // Try /api/user/addresses if the backend is mounted under /api/user, otherwise adjust to /api/addresses
  const res = await apiClient.get('/api/user/addresses');
  return res.data;
};

export const addUserAddress = async (data: any) => {
  const res = await apiClient.post('/api/user/addresses', data);
  return res.data;
};

export const updateUserAddress = async (addressId: string, data: any) => {
  const res = await apiClient.put(`/api/user/addresses/${addressId}`, data);
  return res.data;
};

export const deleteUserAddress = async (addressId: string) => {
  const res = await apiClient.delete(`/api/user/addresses/${addressId}`);
  return res.data;
};

export const setDefaultAddress = async (addressId: string) => {
  const res = await apiClient.put(`/api/user/addresses/${addressId}/set-default`);
  return res.data;
};
