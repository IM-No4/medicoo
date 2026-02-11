import axios from 'axios';
import { getToken } from '../../utils/tokenManagement';

// const API_BASE_URL = 'http://10.5.48.109:5000'; 
// const API_BASE_URL = 'http://172.20.10.3:5000'; 
export const API_BASE_URL = 'http://localhost:5000';
// use this for Android emulator
// change later via env

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
