import axios from 'axios';
import { getToken } from '../../utils/tokenManagement';
import { API_BASE_URL } from '../../config/env';

export { API_BASE_URL };

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15 * 1000,
  headers: {
    'X-Client-Type': 'customer-app',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // ❌ NO navigation here
    // ❌ NO token removal here
    return Promise.reject(error);
  }
);
