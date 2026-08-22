import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { runNativeStepsSync } from './nativeStepsSyncService';

export const NATIVE_STEPS_TASK_NAME = 'medicoo-native-steps-sync';

// Must run as an unconditional module-scope side effect, on every JS bundle
// load - not just when the app is foregrounded. A background execution of
// this task loads the bundle fresh and invokes this callback directly, it
// never goes through App.tsx's boot effect (same reasoning as this
// codebase's existing FCM background handler registration in index.js).
TaskManager.defineTask(NATIVE_STEPS_TASK_NAME, async () => {
    const result = await runNativeStepsSync();
    return result === 'success'
        ? BackgroundTask.BackgroundTaskResult.Success
        : BackgroundTask.BackgroundTaskResult.Failed;
});

// Idempotent - safe to call every time write-tracking is granted, and
// defensively on every app boot in case registration was ever lost.
export async function ensureNativeStepsBackgroundTaskRegistered(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
        const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(NATIVE_STEPS_TASK_NAME);
        if (!alreadyRegistered) {
            await BackgroundTask.registerTaskAsync(NATIVE_STEPS_TASK_NAME, { minimumInterval: 15 });
        }
    } catch (error) {
        console.warn('[nativeStepsBackgroundTask] Failed to register background task', error);
    }
}

export async function unregisterNativeStepsBackgroundTask(): Promise<void> {
    try {
        const registered = await TaskManager.isTaskRegisteredAsync(NATIVE_STEPS_TASK_NAME);
        if (registered) {
            await BackgroundTask.unregisterTaskAsync(NATIVE_STEPS_TASK_NAME);
        }
    } catch (error) {
        console.warn('[nativeStepsBackgroundTask] Failed to unregister background task', error);
    }
}
