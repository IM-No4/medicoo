import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarData } from '../../redux/slices/calendarSlice';

const KEYS = {
    CALENDAR_PREFIX: 'CALENDAR_CACHE_',
    SYNC_QUEUE: 'SYNC_QUEUE_v1',
};

export interface CalendarCacheEntry {
    date: string;
    data: CalendarData;
    lastFetchedAt: number;
}

export type SyncActionType =
    | 'MARK_INTAKE'
    | 'CREATE_MEDICINE'
    | 'UPDATE_MEDICINE'
    | 'DELETE_MEDICINE';

export interface SyncAction {
    id: string;
    type: SyncActionType;
    payload: any;
    status: 'PENDING' | 'FAILED';
    attempts: number;
    createdAt: number;
    lastAttemptAt?: number;
    error?: string;
}

export const StorageService = {
    /**
     * Save calendar data for a specific date (Cache)
     */
    async saveCalendarCache(date: string, data: CalendarData): Promise<void> {
        try {
            const entry: CalendarCacheEntry = {
                date,
                data,
                lastFetchedAt: Date.now(),
            };
            await AsyncStorage.setItem(`${KEYS.CALENDAR_PREFIX}${date}`, JSON.stringify(entry));
        } catch (error) {
            console.error('[Storage] Failed to save calendar cache', error);
        }
    },

    /**
     * Get cached calendar data for a specific date
     */
    async getCalendarCache(date: string): Promise<CalendarCacheEntry | null> {
        try {
            const json = await AsyncStorage.getItem(`${KEYS.CALENDAR_PREFIX}${date}`);
            if (!json) return null;
            return JSON.parse(json) as CalendarCacheEntry;
        } catch (error) {
            console.error('[Storage] Failed to get calendar cache', error);
            return null;
        }
    },

    /**
     * Add an action to the sync queue
     */
    async addToSyncQueue(type: SyncActionType, payload: any): Promise<SyncAction> {
        try {
            const queue = await this.getSyncQueue();
            const action: SyncAction = {
                id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
                type,
                payload,
                status: 'PENDING',
                attempts: 0,
                createdAt: Date.now(),
            };

            queue.push(action);
            await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
            return action;
        } catch (error) {
            console.error('[Storage] Failed to add to sync queue', error);
            throw error;
        }
    },

    /**
     * Get all items in the sync queue
     */
    async getSyncQueue(): Promise<SyncAction[]> {
        try {
            const json = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
            if (!json) return [];
            return JSON.parse(json) as SyncAction[];
        } catch (error) {
            console.error('[Storage] Failed to get sync queue', error);
            return [];
        }
    },

    /**
     * Remove an action from the queue (success / irrecoverable fail)
     */
    async removeFromSyncQueue(id: string): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            const newQueue = queue.filter(item => item.id !== id);
            await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(newQueue));
        } catch (error) {
            console.error('[Storage] Failed to remove from sync queue', error);
        }
    },

    /**
     * Update an action status in the queue (e.g. failed attempt)
     */
    async updateSyncAction(id: string, updates: Partial<SyncAction>): Promise<void> {
        try {
            const queue = await this.getSyncQueue();
            const index = queue.findIndex(item => item.id === id);
            if (index !== -1) {
                queue[index] = { ...queue[index], ...updates };
                await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
            }
        } catch (error) {
            console.error('[Storage] Failed to update sync action', error);
        }
    }
};
