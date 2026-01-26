import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_STORAGE_KEY = '@offline_action_queue';

export type OfflineActionType = 'CREATE_BOOKING' | 'SUBMIT_REVIEW' | 'TOGGLE_BOOKMARK';

export interface OfflineAction {
    id: string;
    type: OfflineActionType;
    payload: any;
    timestamp: number;
}

export const syncService = {
    /**
     * Adds an action to the offline queue
     */
    enqueue: async (type: OfflineActionType, payload: any) => {
        try {
            const queue = await syncService.getQueue();
            const action: OfflineAction = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                payload,
                timestamp: Date.now(),
            };
            queue.push(action);
            await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
            console.log(`[SyncService] Enqueued action: ${type}`, action.id);
            return action;
        } catch (error) {
            console.error('[SyncService] Failed to enqueue action:', error);
            throw error;
        }
    },

    /**
     * Retrieves the current offline queue
     */
    getQueue: async (): Promise<OfflineAction[]> => {
        try {
            const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[SyncService] Failed to get queue:', error);
            return [];
        }
    },

    /**
     * Processes the queue and performs actions when online
     */
    sync: async (processor: (action: OfflineAction) => Promise<void>) => {
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected) return;

        const queue = await syncService.getQueue();
        if (queue.length === 0) return;

        console.log(`[SyncService] Starting sync for ${queue.length} actions`);

        const remainingQueue: OfflineAction[] = [];

        for (const action of queue) {
            try {
                await processor(action);
                console.log(`[SyncService] Synced action: ${action.type}`, action.id);
            } catch (error) {
                console.error(`[SyncService] Action failed: ${action.type}`, action.id, error);
                remainingQueue.push(action);
            }
        }

        await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
    },

    /**
     * Clears the entire queue
     */
    clearQueue: async () => {
        await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    }
};
