import { supabase } from "./supabase";
import { dataCache } from "../utils/dataCache";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pocuggehxeuheqzgixsx.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvY3VnZ2VoeGV1aGVxemdpeHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDU1MzQsImV4cCI6MjA4NTI4MTUzNH0.QjIFMzJ4xf3PNnUbMSUMg8mIyPLis7yI_PuPNZT5CMg';
const USE_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

const mapFromSupabase = (item) => {
    if (!item) return item;
    const newItem = { ...item };
    if (newItem.module_id) { newItem.moduleId = newItem.module_id; delete newItem.module_id; }
    if (newItem.deck_id) { newItem.deckId = newItem.deck_id; delete newItem.deck_id; }
    if (newItem.target_hours) { newItem.targetHours = newItem.target_hours; delete newItem.target_hours; }
    if (newItem.resource_link) { newItem.resourceLink = newItem.resource_link; delete newItem.resource_link; }
    if (newItem.pdf_path) { newItem.pdfPath = newItem.pdf_path; delete newItem.pdf_path; }
    if (newItem.audio_path) { newItem.audioPath = newItem.audio_path; delete newItem.audio_path; }
    if (newItem.audio_episodes) { newItem.audioEpisodes = newItem.audio_episodes; delete newItem.audio_episodes; }
    if (newItem.due_date) { newItem.dueDate = newItem.due_date; delete newItem.due_date; }
    if (newItem.start_time) { newItem.startTime = newItem.start_time; delete newItem.start_time; }
    if (newItem.end_time) { newItem.endTime = newItem.end_time; delete newItem.end_time; }
    if (newItem.completed_at) { newItem.completedAt = newItem.completed_at; delete newItem.completed_at; }
    if (newItem.created_at) { newItem.createdAt = newItem.created_at; delete newItem.created_at; }
    if (newItem.updated_at) { newItem.updatedAt = newItem.updated_at; delete newItem.updated_at; }
    if (newItem.activity) { newItem.topic = newItem.activity; delete newItem.activity; }
    return newItem;
};

const mapToSupabase = (item) => {
    if (!item) return item;
    const newItem = { ...item };
    if ('moduleId' in newItem) { newItem.module_id = newItem.moduleId; delete newItem.moduleId; }
    if ('deckId' in newItem) { newItem.deck_id = newItem.deckId; delete newItem.deckId; }
    if ('targetHours' in newItem) { newItem.target_hours = newItem.targetHours; delete newItem.targetHours; }
    if ('resourceLink' in newItem) { newItem.resource_link = newItem.resourceLink; delete newItem.resourceLink; }
    if ('pdfPath' in newItem) { newItem.pdf_path = newItem.pdfPath; delete newItem.pdfPath; }
    if ('audioPath' in newItem) { newItem.audio_path = newItem.audioPath; delete newItem.audioPath; }
    if ('audioEpisodes' in newItem) { newItem.audio_episodes = newItem.audioEpisodes; delete newItem.audioEpisodes; }
    if ('dueDate' in newItem) { newItem.due_date = newItem.dueDate; delete newItem.dueDate; }
    if ('startTime' in newItem) { newItem.start_time = newItem.startTime; delete newItem.startTime; }
    if ('endTime' in newItem) { newItem.end_time = newItem.endTime; delete newItem.endTime; }
    if ('completedAt' in newItem) { newItem.completed_at = newItem.completedAt; delete newItem.completedAt; }
    if ('createdAt' in newItem) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
    if ('updatedAt' in newItem) { newItem.updated_at = newItem.updatedAt; delete newItem.updated_at; }
    if ('topic' in newItem) { newItem.activity = newItem.topic; delete newItem.topic; }
    return newItem;
};

const getUserId = () => {
    try {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        const user = JSON.parse(userStr);
        return user?.id || null;
    } catch (e) {
        return null;
    }
};

const createCollectionService = (collectionName) => {
    return {
        add: async (data) => {
            if (USE_SUPABASE) {
                const userId = getUserId();
                if (!userId) throw new Error("User not authenticated");

                const payload = { ...mapToSupabase(data), user_id: userId };

                const { data: result, error } = await supabase
                    .from(collectionName)
                    .insert([payload])
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return mapFromSupabase(result);
            } else {
                throw new Error('Supabase not configured for cloud persistence');
            }
        },
        update: async (id, data) => {
            if (USE_SUPABASE) {
                const userId = getUserId();
                if (!userId) throw new Error("User not authenticated");

                const { data: result, error } = await supabase
                    .from(collectionName)
                    .update(mapToSupabase(data))
                    .eq('id', id)
                    .eq('user_id', userId) // Ensure ownership
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return mapFromSupabase(result);
            }
        },
        delete: async (id) => {
            if (USE_SUPABASE) {
                const userId = getUserId();
                if (!userId) throw new Error("User not authenticated");

                const { error } = await supabase
                    .from(collectionName)
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId); // Ensure ownership

                if (error) throw error;
                dataCache.remove(collectionName);
            }
        },
        getAll: async (callback) => {
            if (USE_SUPABASE) {
                try {
                    const userId = getUserId();
                    if (!userId) {
                        callback([]);
                        return () => { };
                    }

                    const { data, error } = await supabase
                        .from(collectionName)
                        .select('*')
                        .eq('user_id', userId);

                    if (error) throw error;

                    const mappedData = data.map(mapFromSupabase);
                    dataCache.set(collectionName, mappedData);
                    callback(mappedData);

                    // Keep a copy of the data for local updates
                    let currentData = [...mappedData];

                    // Setup real-time subscription for "snapshot" feel
                    const channel = supabase
                        .channel(`public:${collectionName}:${userId}`)
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: collectionName,
                            filter: `user_id=eq.${userId}`
                        }, (payload) => {
                            const { eventType, new: newRecord, old: oldRecord } = payload;

                            if (eventType === 'INSERT') {
                                const mapped = mapFromSupabase(newRecord);
                                currentData = [...currentData, mapped];
                            } else if (eventType === 'UPDATE') {
                                const mapped = mapFromSupabase(newRecord);
                                currentData = currentData.map(item => item.id == mapped.id ? mapped : item);
                            } else if (eventType === 'DELETE') {
                                currentData = currentData.filter(item => item.id != oldRecord.id);
                            }

                            dataCache.set(collectionName, currentData);
                            callback(currentData);
                        })
                        .subscribe();

                    return () => {
                        supabase.removeChannel(channel);
                    };
                } catch (error) {
                    console.error(`Error fetching ${collectionName} from Supabase:`, error);
                    const cached = dataCache.get(collectionName);
                    callback(cached || []);
                    return () => { };
                }
            } else {
                callback([]);
                return () => { };
            }
        },
        getByField: async (fieldName, value, callback) => {
            if (USE_SUPABASE) {
                try {
                    const userId = getUserId();
                    if (!userId) {
                        callback([]);
                        return () => { };
                    }

                    const { data, error } = await supabase
                        .from(collectionName)
                        .select('*')
                        .eq(fieldName, value)
                        .eq('user_id', userId);

                    if (error) throw error;
                    callback(data);

                    const channel = supabase
                        .channel(`field:${collectionName}:${value}:${userId}`)
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: collectionName,
                            filter: `${fieldName}=eq.${value}` // We can't easily chain filters in realtime subscription config safely without multiple params, relying on manual re-fetch
                        }, () => {
                            supabase.from(collectionName)
                                .select('*')
                                .eq(fieldName, value)
                                .eq('user_id', userId)
                                .then(({ data: refreshData }) => {
                                    callback((refreshData || []).map(mapFromSupabase));
                                });
                        })
                        .subscribe();

                    return () => supabase.removeChannel(channel);
                } catch (error) {
                    console.error(error);
                    callback([]);
                    return () => { };
                }
            }
        }
    };
};

export const moduleService = createCollectionService("modules");
export const studyLogService = createCollectionService("study_logs"); // snake_case is standard for DB
export const taskService = createCollectionService("tasks");
export const noteService = createCollectionService("notes");
export const gradeService = createCollectionService("grades");
export const flashcardDeckService = createCollectionService("flashcard_decks");
export const flashcardService = createCollectionService("flashcards");
export const calendarService = createCollectionService("calendar_events");
export const pomodoroService = createCollectionService("pomodoro_sessions");

export const getAnalyticsData = async () => {
    if (USE_SUPABASE) {
        const userId = getUserId();
        if (!userId) return { logs: [], modules: [] };

        const [logsRes, modulesRes] = await Promise.all([
            supabase.from('study_logs').select('*').eq('user_id', userId),
            supabase.from('modules').select('*').eq('user_id', userId)
        ]);

        return {
            logs: (logsRes.data || []).map(mapFromSupabase),
            modules: (modulesRes.data || []).map(mapFromSupabase)
        };
    }
    return { logs: [], modules: [] };
};
