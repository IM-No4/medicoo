import { Platform } from 'react-native';
import { APP_VERSION } from '../../utils/appVersion';
import { apiClient } from './client';

export interface EnabledServices {
  pharmacy: boolean;
  consultations: boolean;
  labTests: boolean;
  homeCare: boolean;
  bloodDonation: boolean;
  ambulance: boolean;
  doctorPrescriptions: boolean;
  // Whether "Apply as Doctor" is shown to regular (non-doctor) users -
  // separate from `consultations` (which controls whether patients can
  // book/see consultations) since doctor onboarding stays hidden even
  // once consultations itself is live.
  doctorOnboarding: boolean;
}

// Null when the backend couldn't resolve the installed version it was
// sent (shouldn't happen since this app always sends one) - every caller
// must treat null the same as "no update known", never as "update required".
export interface AppUpdateInfo {
  latestVersion: string;
  minimumSupportedVersion: string;
  storeUrl: string | null;
  updateRequired: boolean;
  updateAvailable: boolean;
}

export interface MaintenanceInfo {
  enabled: boolean;
  title: string;
  message: string;
  services: {
    pharmacy: 'available' | 'maintenance';
    consultation: 'available' | 'maintenance';
  };
}

// GET /api/app/config - public, no auth required. Sends this app's own
// identity/platform/installed version so the backend can compute `update`
// (mandatory/optional-update status) - see getDoctorProfile's doctor-app
// equivalent for the same pattern. The rest of the payload
// (theme/splash/appIcon/heroBanner) is server-driven config this app
// doesn't read beyond enabledServices yet.
export const getAppConfig = async (): Promise<{
  enabledServices: EnabledServices;
  update: AppUpdateInfo | null;
  maintenance: MaintenanceInfo | null;
}> => {
  const response = await apiClient.get('/api/app/config', {
    params: { app: 'consumer', platform: Platform.OS, appVersion: APP_VERSION },
    timeout: 8000,
  });
  return response.data?.data ?? { enabledServices: null, update: null, maintenance: null };
};

// Authenticated, dual-role endpoint (same JWT the rest of this app already
// sends) - advisory only, see maintenanceGate.js on the backend for the
// actual enforcement. Only ever called when maintenance is already known
// to be enabled, and only when logged in.
export const getMaintenanceJourneyStatus = async (): Promise<{ hasActiveJourney: boolean }> => {
  const response = await apiClient.get('/api/user/maintenance-status', { timeout: 8000 });
  return response.data?.data ?? { hasActiveJourney: true };
};
