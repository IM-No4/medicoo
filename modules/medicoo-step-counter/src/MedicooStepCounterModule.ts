import { NativeModule, requireOptionalNativeModule } from 'expo';

import { MedicooStepCounterModuleEvents } from './MedicooStepCounter.types';

declare class MedicooStepCounterModule extends NativeModule<MedicooStepCounterModuleEvents> {
  // Raw, cumulative-since-last-boot value from Android's TYPE_STEP_COUNTER
  // hardware sensor - null if the sensor doesn't exist on this device or
  // never delivered a reading within the native module's read timeout.
  readRawStepCounter(): Promise<number | null>;
  // Background sampling (native alarm every 15 minutes, works with the app closed). Missing on app builds made before it was added.
  startStepSampling?(): boolean;
  stopStepSampling?(): void;
  takeStepSample?(): Promise<number | null>;
  readStepSamples?(): number[][];
  clearStepSamplesUpTo?(timeMs: number): void;
}

// There is no iOS/web platform declared for this module (see
// expo-module.config.json) - requireOptionalNativeModule (unlike
// requireNativeModule) returns null instead of throwing when the module
// isn't registered, so this file is safe to import unconditionally on any
// platform.
export default requireOptionalNativeModule<MedicooStepCounterModule>('MedicooStepCounter');
