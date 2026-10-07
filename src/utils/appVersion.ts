import Constants from 'expo-constants';

// Single source of truth for the version shown anywhere in the app -
// reads the real version from app.json (via Expo's config, embedded into
// the build) instead of each screen hardcoding its own literal. Those
// hardcoded copies had already drifted out of sync with each other and
// with the actual shipped version (one screen still said v1.0.0, another
// v2.4.0, while app.json had long since moved to 1.0.1) - this is the fix
// for that class of bug, not just the current mismatch.
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
