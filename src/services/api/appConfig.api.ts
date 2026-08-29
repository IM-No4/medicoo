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

// GET /api/app/config - public, no auth required. Only enabledServices is
// consumed today (drives the Profile menu); the rest of the payload
// (theme/splash/appIcon/heroBanner) is server-driven config this app
// doesn't read yet.
export const getAppConfig = async (): Promise<{ enabledServices: EnabledServices }> => {
  const response = await apiClient.get('/api/app/config');
  return response.data?.data ?? { enabledServices: null };
};
