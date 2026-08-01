import axios from 'axios';
import { getToken, clearToken } from '../../utils/tokenManagement';
import { API_BASE_URL } from '../../config/env';
import { store } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import { bootSuccess } from '../../bootstrap/boot.slice';
import { clearActiveOrder } from '../../redux/slices/orderSlice';

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

let handlingUnauthorized = false;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Only force a logout for a request that was actually sent with a token -
    // pre-login endpoints (send-otp, verify-otp, ...) never attach one, so a
    // 401 there means bad credentials, not a revoked/expired session.
    const wasAuthenticatedRequest = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && wasAuthenticatedRequest && !handlingUnauthorized) {
      handlingUnauthorized = true;
      try {
        await clearToken('access_token');
        store.dispatch(clearActiveOrder());
        store.dispatch(logout());
        store.dispatch(bootSuccess({ isAuthenticated: false, onboardingCompleted: false }));
      } finally {
        handlingUnauthorized = false;
      }
    }

    return Promise.reject(error);
  }
);
