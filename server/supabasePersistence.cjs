const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let activeKey = null;

const initSupabase = () => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (!process.env.SILENT_PERSISTENCE) {
            console.warn('⚠️ Supabase credentials not configured');
        }
        return null;
    }

    if (!supabase || activeKey !== key) {
        supabase = createClient(url, key);
        activeKey = key;
        const isServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && key === process.env.SUPABASE_SERVICE_ROLE_KEY;
        console.log(`✅ Supabase initialized ${isServiceKey ? '(Admin Mode)' : '(Anon Mode)'}`);
    }
    return supabase;
};

// --- MAPPING ---
const toCamel = (str) => str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
const toSnake = (str) => str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const mapRow = (row, table = null) => {
    if (!row) return null;
    const mapped = {};
    for (const key in row) {
        mapped[toCamel(key)] = row[key];
    }
    if (mapped.youtubeUrl) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = String(mapped.youtubeUrl).match(regExp);
        if (match && match[2].length === 11) mapped.videoId = match[2];
    }
    if (row.supabase_id) mapped.supabaseId = row.supabase_id;
    return mapped;
};

const mapToTable = (item, table = null) => {
    if (!item) return null;
    const mapped = {};

    // Keys to skip by default or based on table
    const skipKeys = [
        'supabaseId', 'supabaseAuthId', 'videoId', 'thumbnail', 'active', 'lastActive',
        'password', 'syncCoins'
    ];

    // profiles table is strict about metadata; some fields live only in users (legacy)
    if (table === 'profiles') {
        // These are already in the global skipKeys now, but keeping this for historical context or if specific table logic changes
        // skipKeys.push('timerState', 'timer_state', 'darkMode', 'dark_mode', 'theme', 'password');
    }

    for (const key in item) {
        if (skipKeys.includes(key) || typeof item[key] === 'function') continue;
        mapped[toSnake(key)] = item[key];
    }

    // Safeguard for study_logs hours NOT NULL constraint
    if (table === 'study_logs' && (mapped.hours === undefined || mapped.hours === null)) {
        mapped.hours = 0;
    }

    return mapped;
};

// --- GENERIC CRUD ---
const fetchAll = async (table) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.from(table).select('*');
    if (error) {
        console.error(`Error fetching all from ${table}:`, error);
        return null;
    }
    return data.map(row => mapRow(row, table));
};

const getItemByField = async (table, field, value) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.from(table).select('*').eq(field, value).single();
    if (error) {
        if (error.code !== 'PGRST116') console.error(`Error getItemByField ${table}:`, error);
        return null;
    }
    return mapRow(data, table);
};
const fetchCollection = async (table, userId) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.from(table).select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) {
        console.error(`Error fetching ${table}:`, error);
        return null;
    }
    return data.map(row => mapRow(row, table));
};

const getById = async (table, id) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.from(table).select('*').eq('id', id).single();
    if (error) {
        if (error.code !== 'PGRST116') console.error(`Error getById ${table}:`, error);
        return null;
    }
    return mapRow(data, table);
};

const upsertToCollection = async (table, item) => {
    const client = initSupabase();
    if (!client) return null;
    if (table === 'users' && !item.email) return null;
    const row = mapToTable(item, table);
    const { data, error } = await client.from(table).upsert([row]).select().single();
    if (error) {
        console.error(`Error upserting to ${table}:`, error);
        return null;
    }
    return mapRow(data, table);
};

const deleteFromCollection = async (table, id) => {
    const client = initSupabase();
    if (!client) return false;
    const { error } = await client.from(table).delete().eq('id', id);
    return !error;
};

// --- SPECIALIZED HELPERS ---
const createConversation = async (conv) => upsertToCollection('conversations', conv);
const updateConversation = async (id, updates) => {
    const client = initSupabase();
    if (!client) return null;
    const row = mapToTable(updates, 'conversations');
    const { data, error } = await client.from('conversations').update(row).eq('id', id).select().single();
    return error ? null : mapRow(data, 'conversations');
};

const getConversations = async (userId) => {
    const client = initSupabase();
    if (!client) return null;
    // Filter conversations where participants (JSONB array) contains userId
    const { data, error } = await client
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        return null;
    }
    return data.map(row => mapRow(row, 'conversations'));
};

const getMessages = async (convId) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.from('messages').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    return error ? null : data.map(row => mapRow(row, 'messages'));
};

const insertMessage = async (msg) => upsertToCollection('messages', msg);
const markMessagesAsRead = async (convId, userId) => {
    const client = initSupabase();
    if (!client) return false;
    const { error } = await client.from('messages').update({ read: true }).eq('conversation_id', convId).neq('sender_id', userId);
    if (error) {
        console.error('❌ Supabase MarkRead Error:', error);
    }
    return !error;
};

const createGroup = async (group) => upsertToCollection('groups', group);
const getGroups = async () => fetchAll('groups');

const findDirectConversation = async (userId1, userId2) => {
    const client = initSupabase();
    if (!client) return null;
    // Find a 'direct' conversation where participants contains BOTH user IDs
    const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('type', 'direct')
        .contains('participants', [userId1])
        .contains('participants', [userId2])
        .limit(1);

    if (error) {
        console.error('Error finding direct conversation:', error);
        return null;
    }
    return data && data.length > 0 ? mapRow(data[0], 'conversations') : null;
};

const uploadFile = async (bucket, fileName, buffer, mimeType) => {
    const client = initSupabase();
    if (!client) return null;
    try {
        const { data, error } = await client.storage
            .from(bucket)
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            console.error(`❌ Supabase Storage Error [Bucket: ${bucket}]:`, {
                message: error.message,
                status: error.status,
                name: error.name,
                fileName: fileName
            });
            return null;
        }

        const { data: urlData } = client.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return urlData?.publicUrl || null;
    } catch (err) {
        console.error('Upload error:', err);
        return null;
    }
};

// --- AUTH ---
const signUpUser = async (email, password) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
        console.error('Error signing up user in Supabase Auth:', error.message);
        return { error: error.message };
    }
    return data.user;
};

const signInUser = async (email, password) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
        return { error: error.message };
    }
    return data.user;
};

const getAllProfiles = async () => {
    const client = initSupabase();
    if (!client) return null;

    // Attempt to fetch from profiles table first (Primary)
    const { data: profileData, error: profileError } = await client.from('profiles').select('*').order('created_at', { ascending: false });

    // Also fetch from users table for legacy/backup (Secondary)
    const { data: userData, error: userError } = await client.from('users').select('*').order('created_at', { ascending: false });

    if (profileError && userError) {
        console.error('Error fetching all profiles/users:', profileError, userError);
        return null;
    }

    // Merge and deduplicate by email/id
    const userMap = new Map();

    (userData || []).forEach(u => {
        if (u.email) userMap.set(u.email.toLowerCase(), {
            id: u.id,
            email: u.email,
            name: u.name,
            xp: u.xp || 0,
            level: u.level || 1,
            badges: u.badges || [],
            createdAt: u.created_at,
            source: 'users_table'
        });
    });

    (profileData || []).forEach(p => {
        if (p.email) {
            userMap.set(p.email.toLowerCase(), {
                ...(userMap.get(p.email.toLowerCase()) || {}),
                id: p.id,
                email: p.email,
                name: p.name,
                xp: p.xp || 0,
                level: p.level || 1,
                badges: p.badges || [],
                createdAt: p.created_at,
                source: 'profiles_table'
            });
        }
    });

    return Array.from(userMap.values());
};

const upsertProfile = async (profile) => {
    try {
        const client = initSupabase();
        if (!client) throw new Error('Supabase not initialized');

        // Identify if it's a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profile.id);

        if (isUUID) {
            // Sync to profiles table
            const row = mapToTable(profile, 'profiles');
            console.log('📝 Upserting to profiles table:', JSON.stringify(row));
            const { error: profError } = await client.from('profiles').upsert([row]);
            if (profError) {
                console.error('❌ Supabase profiles upsert error:', profError.message);
                // Don't throw yet, try users table too
            }
        }

        // Always sync to users table
        const userRow = mapToTable(profile, 'users');
        console.log('📝 Upserting to users table:', JSON.stringify(userRow));
        const { data, error } = await client.from('users').upsert([userRow]).select().single();

        if (error) {
            console.error('❌ Supabase users upsert error:', error.message);
            throw error;
        }
        return data ? mapRow(data, 'users') : null;
    } catch (error) {
        console.error('Error in upsertProfile:', error.message);
        throw error;
    }
};

const deleteAllUserData = async (userId) => {
    const client = initSupabase();
    if (!client) return false;

    const tables = [
        'study_logs', 'tasks', 'notes', 'grades', 'flashcard_decks',
        'flashcards', 'calendar_events', 'pomodoro_sessions', 'tutorials', 'modules'
    ];

    try {
        // Delete from standard tables
        for (const table of tables) {
            await client.from(table).delete().eq('user_id', userId);
        }

        // Delete messages
        await client.from('messages').delete().eq('sender_id', userId);

        // Remove from conversations
        // Note: For direct chats, we might delete the conversation entirely. 
        // For groups, we just remove the participant.
        const conversations = await getConversations(userId);
        if (conversations) {
            for (const conv of conversations) {
                if (conv.type === 'direct') {
                    await client.from('conversations').delete().eq('id', conv.id);
                } else {
                    const newParticipants = (conv.participants || []).filter(p => p !== userId);
                    await client.from('conversations').update({ participants: newParticipants }).eq('id', conv.id);
                }
            }
        }

        // Remove from groups
        // If they created the group, maybe delete it or transfer? 
        // For now, let's remove from member arrays and delete if they were the only member.
        const { data: groups } = await client.from('groups').select('*').contains('members', [userId]);
        if (groups) {
            for (const group of groups) {
                const newMembers = (group.members || []).filter(m => m !== userId);
                if (newMembers.length === 0) {
                    await client.from('groups').delete().eq('id', group.id);
                } else {
                    await client.from('groups').update({ members: newMembers }).eq('id', group.id);
                }
            }
        }

        // Finally delete profile and user records
        await client.from('profiles').delete().eq('id', userId);
        await client.from('users').delete().eq('id', userId);

        return true;
    } catch (error) {
        console.error('Error deleting all user data from Supabase:', error);
        return false;
    }
};

const getLeaderboardData = async (limit = 50) => {
    const client = initSupabase();
    if (!client) return null;
    const { data, error } = await client
        .from('profiles')
        .select('id, name, xp, level, badges')
        .order('xp', { ascending: false })
        .limit(limit);
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return null;
    }
    return data.map(row => mapRow(row, 'profiles'));
};

const getActiveUserCount = async () => {
    const client = initSupabase();
    if (!client) return 0;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count, error } = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('last_seen_at', fiveMinutesAgo);
    if (error) {
        console.error('Error fetching active count:', error);
        return 0;
    }
    return count || 0;
};

const updateLastSeen = async (userId) => {
    const client = initSupabase();
    if (!client) return false;
    const { error } = await client
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId);
    if (error) {
        // If profile doesn't exist, ignore (handled by sync normally)
        return false;
    }
    return true;
};

const awardSyncCoins = async (userId, amount) => {
    const client = initSupabase();
    if (!client) return null;

    // Get current coins
    const { data: profile, error: fetchError } = await client
        .from('profiles')
        .select('sync_coins')
        .eq('id', userId)
        .single();

    if (fetchError) {
        console.error('Error fetching coins for award:', fetchError);
        return null;
    }

    const newBalance = (profile.sync_coins || 0) + amount;

    const { data, error } = await client
        .from('profiles')
        .update({ sync_coins: newBalance })
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error awarding coins:', error);
        return null;
    }

    // Also update users table for legacy sync
    await client.from('users').update({ sync_coins: newBalance }).eq('id', userId);

    return mapRow(data, 'profiles');
};

module.exports = {
    initSupabase,
    mapRow,
    mapToTable,
    fetchAll,
    fetchCollection,
    getById,
    upsertToCollection,
    deleteFromCollection,
    deleteAllUserData,
    createConversation,
    getConversations,
    updateConversation,
    getMessages,
    insertMessage,
    markMessagesAsRead,
    createGroup,
    getGroups,
    findDirectConversation,
    uploadFile,
    signUpUser,
    signInUser,
    getAllProfiles,
    upsertProfile,
    getItemByField,
    getActiveUserCount,
    updateLastSeen,
    awardSyncCoins
};

