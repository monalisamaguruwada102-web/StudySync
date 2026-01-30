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
    if (newItem.moduleId) { newItem.module_id = newItem.moduleId; delete newItem.moduleId; }
    if (newItem.deckId) { newItem.deck_id = newItem.deckId; delete newItem.deckId; }
    if (newItem.targetHours) { newItem.target_hours = newItem.targetHours; delete newItem.targetHours; }
    if (newItem.resourceLink) { newItem.resource_link = newItem.resourceLink; delete newItem.resourceLink; }
    if (newItem.pdfPath) { newItem.pdf_path = newItem.pdfPath; delete newItem.pdfPath; }
    if (newItem.dueDate) { newItem.due_date = newItem.dueDate; delete newItem.dueDate; }
    if (newItem.startTime) { newItem.start_time = newItem.startTime; delete newItem.startTime; }
    if (newItem.endTime) { newItem.end_time = newItem.endTime; delete newItem.endTime; }
    if (newItem.completedAt) { newItem.completed_at = newItem.completedAt; delete newItem.completedAt; }
    if (newItem.createdAt) { newItem.created_at = newItem.createdAt; delete newItem.createdAt; }
    if (newItem.updatedAt) { newItem.updated_at = newItem.updatedAt; delete newItem.updated_at; }
    if (newItem.topic) { newItem.activity = newItem.topic; delete newItem.topic; }
    return newItem;
};

const createCollectionService = (collectionName) => {
    return {
        add: async (data) => {
            if (USE_SUPABASE) {
                const { data: result, error } = await supabase
                    .from(collectionName)
                    .insert([mapToSupabase(data)])
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return mapFromSupabase(result);
            } else {
                // Fallback to local API logic (handled by rest of implementation if needed)
                // For now, we'll focus on Supabase implementation
                throw new Error('Supabase not configured for cloud persistence');
            }
        },
        update: async (id, data) => {
            if (USE_SUPABASE) {
                const { data: result, error } = await supabase
                    .from(collectionName)
                    .update(mapToSupabase(data))
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return mapFromSupabase(result);
            }
        },
        delete: async (id) => {
            if (USE_SUPABASE) {
                const { error } = await supabase
                    .from(collectionName)
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                dataCache.remove(collectionName);
            }
        },
        getAll: async (callback) => {
            if (USE_SUPABASE) {
                try {
                    const { data, error } = await supabase
                        .from(collectionName)
                        .select('*');

                    if (error) throw error;

                    const mappedData = data.map(mapFromSupabase);
                    dataCache.set(collectionName, mappedData);
                    callback(mappedData);

                    // Setup real-time subscription for "snapshot" feel
                    const channel = supabase
                        .channel(`public:${collectionName}`)
                        .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, (payload) => {
                            console.log('Change received!', payload);
                            // Simple way: re-fetch everything on change for now
                            // Optimization: update state locally
                            supabase.from(collectionName).select('*').then(({ data: refreshData }) => {
                                callback((refreshData || []).map(mapFromSupabase));
                            });
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
                    const { data, error } = await supabase
                        .from(collectionName)
                        .select('*')
                        .eq(fieldName, value);

                    if (error) throw error;
                    callback(data);

                    const channel = supabase
                        .channel(`field:${collectionName}:${value}`)
                        .on('postgres_changes', {
                            event: '*',
                            schema: 'public',
                            table: collectionName,
                            filter: `${fieldName}=eq.${value}`
                        }, () => {
                            supabase.from(collectionName).select('*').eq(fieldName, value).then(({ data: refreshData }) => {
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
        const [logsRes, modulesRes] = await Promise.all([
            supabase.from('study_logs').select('*'),
            supabase.from('modules').select('*')
        ]);

        return {
            logs: (logsRes.data || []).map(mapFromSupabase),
            modules: (modulesRes.data || []).map(mapFromSupabase)
        };
    }
    return { logs: [], modules: [] };
};
