import MedicooStepCounterModule from './MedicooStepCounterModule';

// One-shot read of Android's TYPE_STEP_COUNTER hardware sensor - a raw,
// cumulative-since-last-boot step count. null on any platform where the
// native module isn't registered (iOS/web - this module is Android-only),
// or if the device has no step-counter sensor, or if the read timed out.
export async function readRawStepCounter(): Promise<number | null> {
  if (!MedicooStepCounterModule) return null;
  try {
    return await MedicooStepCounterModule.readRawStepCounter();
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to read step counter sensor', error);
    return null;
  }
}

// A timestamped reading of the running step total: [time in ms, total].
export type StepSample = { t: number; c: number };

// True when this build of the app has the background sampler (older builds do not - callers then fall back to one reading per sync).
export const hasStepSampler = !!(MedicooStepCounterModule && MedicooStepCounterModule.readStepSamples);

// Turns on the native 15-minute sampling alarm (safe to call repeatedly; it re-arms the alarm if it was lost).
export function startStepSampling(): boolean {
  try {
    return !!(MedicooStepCounterModule && MedicooStepCounterModule.startStepSampling && MedicooStepCounterModule.startStepSampling());
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to start step sampling', error);
    return false;
  }
}

export function stopStepSampling(): void {
  try {
    MedicooStepCounterModule?.stopStepSampling?.();
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to stop step sampling', error);
  }
}

// Reads the sensor now and stores it with the other samples.
export async function takeStepSample(): Promise<number | null> {
  try {
    return (await MedicooStepCounterModule?.takeStepSample?.()) ?? null;
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to take a step sample', error);
    return null;
  }
}

// Every stored sample, oldest first.
export function readStepSamples(): StepSample[] {
  try {
    const rows = MedicooStepCounterModule?.readStepSamples?.() ?? [];
    return rows.map(([t, c]) => ({ t, c }));
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to read step samples', error);
    return [];
  }
}

export function clearStepSamplesUpTo(timeMs: number): void {
  try {
    MedicooStepCounterModule?.clearStepSamplesUpTo?.(timeMs);
  } catch (error) {
    console.warn('[medicoo-step-counter] Failed to clear step samples', error);
  }
}
