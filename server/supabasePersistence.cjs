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
    // Allow newly_registered and tutorial_completed to sync to users table
    const skipKeys = ['supabaseId', 'supabaseAuthId', 'videoId', 'thumbnail', 'timerState', 'darkMode', 'theme', 'active', 'lastActive'];
    for (const key in item) {
        if (skipKeys.includes(key) || typeof item[key] === 'function') continue;
        mapped[toSnake(key)] = item[key];
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
            console.error(`Error uploading file to ${bucket}:`, error);
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
    // Redirect profiles to users
    const { data, error } = await client.from('users').select('*').order('created_at', { ascending: false });
    return error ? null : data.map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        xp: p.xp || 0,
        level: p.level || 1,
        badges: p.badges || [],
        createdAt: p.created_at
    }));
};

const upsertProfile = async (profile) => {
    const client = initSupabase();
    if (!client) return null;
    // Redirect profiles to users
    const row = mapToTable(profile, 'users');
    const { data, error } = await client.from('users').upsert([row]).select().single();
    return error ? null : mapRow(data, 'users');
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
    getItemByField
};
