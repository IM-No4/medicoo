import axios from 'axios';
import { getToken, clearToken } from '../../utils/tokenManagement';
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

let handlingUnauthorized = false;

// "Server unreachable" detection. A request that gets no response at all
// (connection refused / DNS / timeout) counts as a failure; any response -
// even a 4xx/5xx - proves the server is up and resets the count. Two
// failures close together are enough to call it (one alone could just be a
// slow request). Whether the device itself is offline is decided elsewhere
// (offlineSync.ts) - this only flags the "internet fine, server not" case.
const UNREACHABLE_FAILURES_REQUIRED = 2;
const UNREACHABLE_WINDOW_MS = 15 * 1000;
let noResponseFailures = 0;
let lastNoResponseAt = 0;

const reportServerReachable = () => {
  noResponseFailures = 0;
  try {
    const { store } = require('../../redux/store');
    const { setServerUnreachable } = require('../../redux/slices/connectivitySlice');
    if (store.getState().connectivity?.serverUnreachable) {
      store.dispatch(setServerUnreachable(false));
    }
  } catch {
    // store not ready yet - nothing to clear
  }
};

const reportNoResponse = () => {
  const now = Date.now();
  noResponseFailures = now - lastNoResponseAt > UNREACHABLE_WINDOW_MS ? 1 : noResponseFailures + 1;
  lastNoResponseAt = now;
  if (noResponseFailures < UNREACHABLE_FAILURES_REQUIRED) return;
  try {
    const { store } = require('../../redux/store');
    const { setServerUnreachable } = require('../../redux/slices/connectivitySlice');
    const state = store.getState().connectivity;
    // Device offline: the offline hub already covers it.
    if (state?.isOnline && !state?.serverUnreachable) {
      store.dispatch(setServerUnreachable(true));
    }
  } catch {
    // store not ready yet
  }
};

apiClient.interceptors.response.use(
  (res) => {
    reportServerReachable();
    return res;
  },
  async (error) => {
    if (error.response) {
      reportServerReachable();
    } else if (error.code !== 'ERR_CANCELED' && !(error.config as any)?.skipReachability) {
      reportNoResponse();
    }

    // "Network Error" (no response at all - DNS/connection/timeout/thrown
    // before the request was ever sent) vs a real HTTP error status is a
    // useful distinction that's otherwise easy to lose by the time an error
    // reaches a screen's catch block.
    if (!error.response) {
      console.log('[apiClient] Request failed with no response:', {
        url: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
        method: error.config?.method,
        code: error.code,
        message: error.message,
      });
    }

    // Only force a logout for a request that was actually sent with a token -
    // pre-login endpoints (send-otp, verify-otp, ...) never attach one, so a
    // 401 there means bad credentials, not a revoked/expired session.
    const wasAuthenticatedRequest = Boolean(error.config?.headers?.Authorization);

    if (error.response?.status === 401 && wasAuthenticatedRequest && !handlingUnauthorized) {
      handlingUnauthorized = true;
      try {
        // Required lazily: a top-level import of the store creates a require
        // cycle (store -> slices -> *.api -> client -> store) that leaves
        // slices like appConfig undefined when the store is first built.
        const { store } = require('../../redux/store');
        const { logout } = require('../../redux/slices/authSlice');
        const { bootSuccess } = require('../../bootstrap/boot.slice');
        const { clearActiveOrder } = require('../../redux/slices/orderSlice');
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
