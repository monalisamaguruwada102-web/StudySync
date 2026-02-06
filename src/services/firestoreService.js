import api from "./api";

const createCollectionService = (collectionName) => {
    return {
        getAll: (callback) => {
            api.get(`/${collectionName}`).then(res => callback(res.data));
            // Return empty cleanup for local
            return () => { };
        },
        getById: async (id) => {
            const res = await api.get(`/${collectionName}/${id}`);
            return res.data;
        },
        getByField: async (fieldName, value, callback) => {
            const res = await api.get(`/${collectionName}`);
            const filtered = res.data.filter(item => item[fieldName] === value);
            callback(filtered);
            return () => { };
        },
        add: async (item) => {
            const res = await api.post(`/${collectionName}`, item);
            window.dispatchEvent(new CustomEvent('study-sync-update', { detail: { collection: collectionName } }));
            return res.data;
        },
        update: async (id, item) => {
            const res = await api.put(`/${collectionName}/${id}`, item);
            window.dispatchEvent(new CustomEvent('study-sync-update', { detail: { collection: collectionName } }));
            return res.data;
        },
        delete: async (id) => {
            await api.delete(`/${collectionName}/${id}`);
            window.dispatchEvent(new CustomEvent('study-sync-update', { detail: { collection: collectionName } }));
        }
    };
};

export const moduleService = createCollectionService('modules');
export const studyLogService = createCollectionService('studyLogs');
export const taskService = createCollectionService('tasks');
export const noteService = createCollectionService('notes');
export const gradeService = createCollectionService('grades');
export const flashcardDeckService = createCollectionService('flashcardDecks');
export const flashcardService = createCollectionService('flashcards');
export const calendarService = createCollectionService('calendarEvents');
export const pomodoroService = createCollectionService('pomodoroSessions');
export const tutorialService = createCollectionService('tutorials');

export const getAnalyticsData = async () => {
    try {
        const [logsRes, modulesRes] = await Promise.all([
            api.get('/studyLogs'),
            api.get('/modules')
        ]);
        return {
            logs: logsRes.data,
            modules: modulesRes.data
        };
    } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        return { logs: [], modules: [] };
    }
};
