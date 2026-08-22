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
