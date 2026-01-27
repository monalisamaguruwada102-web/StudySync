import api from "./api";

const createCollectionService = (collectionName) => {
    return {
        add: async (data) => {
            const response = await api.post(`/${collectionName}`, data);
            return response.data;
        },
        update: async (id, data) => {
            const response = await api.put(`/${collectionName}/${id}`, data);
            return response.data;
        },
        delete: async (id) => {
            await api.delete(`/${collectionName}/${id}`);
        },
        // For local API, we'll use polling or simple refreshes instead of snapshots
        // To maintain compatibility with the existing hook, we'll return a fetcher
        getAll: async (callback) => {
            try {
                const response = await api.get(`/${collectionName}`);
                callback(response.data);
                return () => { }; // return empty unsubscribe
            } catch (error) {
                console.error(error);
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
