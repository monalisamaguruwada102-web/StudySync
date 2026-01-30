import { supabase } from "./supabase";
import { dataCache } from "../utils/dataCache";

const USE_SUPABASE = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

const createCollectionService = (collectionName) => {
    return {
        add: async (data) => {
            if (USE_SUPABASE) {
                const { data: result, error } = await supabase
                    .from(collectionName)
                    .insert([data])
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return result;
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
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                dataCache.remove(collectionName);
                return result;
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

                    dataCache.set(collectionName, data);
                    callback(data);

                    // Setup real-time subscription for "snapshot" feel
                    const channel = supabase
                        .channel(`public:${collectionName}`)
                        .on('postgres_changes', { event: '*', schema: 'public', table: collectionName }, (payload) => {
                            console.log('Change received!', payload);
                            // Simple way: re-fetch everything on change for now
                            // Optimization: update state locally
                            supabase.from(collectionName).select('*').then(({ data: refreshData }) => {
                                callback(refreshData);
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
                                callback(refreshData);
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
            logs: logsRes.data || [],
            modules: modulesRes.data || []
        };
    }
    return { logs: [], modules: [] };
};
