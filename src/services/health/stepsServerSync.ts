import { apiClient } from '../api/client';

/**
 * Tells the server today's step count so the steps goal (and what friends see of it) is current. Safe to call from the headless
 * background task: it needs nothing but the stored login. Failures are swallowed - the count is already safe in Health Connect, and
 * the next run (or opening the app) sends it again.
 */
export async function pushTodayStepsToServer(steps: number | null | undefined): Promise<boolean> {
  if (steps == null || !Number.isFinite(steps) || steps < 0) return false;
  try {
    await apiClient.post('/api/user/goals/steps-sync', { steps: Math.round(steps) });
    return true;
  } catch (error) {
    console.warn('[stepsServerSync] Could not send today\'s steps', error);
    return false;
  }
}
