import api from "./api";
import { dataCache } from "../utils/dataCache";

const createCollectionService = (collectionName) => {
    return {
        add: async (data) => {
            const response = await api.post(`/${collectionName}`, data);
            // Invalidate cache after mutation
            dataCache.remove(collectionName);
            return response.data;
        },
        update: async (id, data) => {
            const response = await api.put(`/${collectionName}/${id}`, data);
            // Invalidate cache after mutation
            dataCache.remove(collectionName);
            return response.data;
        },
        delete: async (id) => {
            await api.delete(`/${collectionName}/${id}`);
            // Invalidate cache after mutation
            dataCache.remove(collectionName);
        },
        // For local API, we'll use polling or simple refreshes instead of snapshots
        // To maintain compatibility with the existing hook, we'll return a fetcher
        getAll: async (callback) => {
            try {
                // Try to fetch from server
                const response = await api.get(`/${collectionName}`);
                const data = response.data;

                // Update cache with fresh data
                dataCache.set(collectionName, data);

                callback(data);
                return () => { }; // return empty unsubscribe
            } catch (error) {
                console.error(`Error fetching ${collectionName}:`, error);

                // Try to use cached data as fallback
                const cachedData = dataCache.get(collectionName);
                if (cachedData) {
                    console.log(`📦 Using cached ${collectionName} data`);
                    callback(cachedData);
                } else {
                    console.warn(`⚠️ No cached data available for ${collectionName}`);
                    callback([]);
                }

                return () => { };
            }
        },
        getByField: async (fieldName, value, callback) => {
            try {
                const response = await api.get(`/${collectionName}`);
                const filtered = response.data.filter(item => item[fieldName] === value);
                callback(filtered);
                return () => { };
            } catch (error) {
                console.error(error);

                // Try cached data
                const cachedData = dataCache.get(collectionName);
                if (cachedData) {
                    const filtered = cachedData.filter(item => item[fieldName] === value);
                    callback(filtered);
                } else {
                    callback([]);
                }

                return () => { };
            }
        }
    };
};

export const moduleService = createCollectionService("modules");
export const studyLogService = createCollectionService("studyLogs");
export const taskService = createCollectionService("tasks");
export const noteService = createCollectionService("notes");
export const gradeService = createCollectionService("grades");
export const flashcardDeckService = createCollectionService("flashcardDecks");
export const flashcardService = createCollectionService("flashcards");
export const calendarService = createCollectionService("calendarEvents");
export const pomodoroService = createCollectionService("pomodoroSessions");

export const getAnalyticsData = async () => {
    const [logs, modules] = await Promise.all([
        api.get('/studyLogs'),
        api.get('/modules')
    ]);

    return {
        logs: logs.data,
        modules: modules.data
    };
};
