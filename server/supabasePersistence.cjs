const { createClient } = require('@supabase/supabase-js');

let supabase = null;

const initSupabase = () => {
    // Read from env on demand to ensure they are loaded
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
        if (!process.env.SILENT_PERSISTENCE) {
            console.warn('⚠️ Supabase credentials not configured - using local storage');
        }
        return null;
    }

    if (!supabase) {
        supabase = createClient(url, key);
        console.log('✅ Supabase client initialized');
    }
    return supabase;
};

// Tutorials
const mapTutorial = (tutorial) => {
    if (!tutorial) return null;
    return {
        id: tutorial.id,
        userId: tutorial.user_id || tutorial.userId,
        title: tutorial.title,
        youtubeUrl: tutorial.youtube_url || tutorial.youtubeUrl || tutorial.url,
        moduleId: tutorial.module_id || tutorial.moduleId,
        topic: tutorial.topic,
        description: tutorial.description,
        createdAt: tutorial.created_at || tutorial.createdAt,
        updatedAt: tutorial.updated_at || tutorial.updatedAt
    };
};

const getTutorials = async (userId) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('tutorials')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tutorials:', error);
        return null;
    }
    return data.map(mapTutorial);
};

const getTutorialById = async (id) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('tutorials')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return mapTutorial(data);
};

const insertTutorial = async (tutorial) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('tutorials')
        .insert([{
            user_id: tutorial.userId,
            title: tutorial.title,
            youtube_url: tutorial.youtubeUrl || tutorial.url || tutorial.youtube_url,
            module_id: tutorial.moduleId,
            topic: tutorial.topic,
            description: tutorial.description
        }])
        .select()
        .single();

    if (error) {
        console.error('Error inserting tutorial:', error);
        return null;
    }
    return mapTutorial(data);
};

const deleteTutorial = async (id) => {
    const client = initSupabase();
    if (!client) return false;

    const { error } = await client
        .from('tutorials')
        .delete()
        .eq('id', id);

    return !error;
};

const mapRow = (row) => {
    if (!row) return null;
    const mapped = {};
    for (const key in row) {
        if (key === 'user_id') mapped.userId = row[key];
        else if (key === 'module_id') mapped.moduleId = row[key];
        else if (key === 'created_at') mapped.createdAt = row[key];
        else if (key === 'updated_at') mapped.updatedAt = row[key];
        else if (key === 'video_id') mapped.videoId = row[key];
        else if (key === 'due_date') mapped.dueDate = row[key];
        else if (key === 'start_time') mapped.startTime = row[key];
        else if (key === 'end_time') mapped.endTime = row[key];
        else if (key === 'last_message') mapped.lastMessage = row[key];
        else if (key === 'last_message_time') mapped.lastMessageTime = row[key];
        else if (key === 'group_id') mapped.groupId = row[key];
        else if (key === 'youtube_url') mapped.youtubeUrl = row[key];
        else if (key === 'resource_link') mapped.resourceLink = row[key];
        else if (key === 'pdf_path') mapped.pdfPath = row[key];
        else if (key === 'deck_id') mapped.deckId = row[key];
        else if (key === 'supabase_id') mapped.supabaseId = row[key];
        else if (key === 'target_hours') mapped.targetHours = row[key];
        else if (key === 'total_hours_studied') mapped.totalHoursStudied = row[key];
        else if (key === 'completed_at') mapped.completedAt = row[key];
        else if (key === 'audio_episodes') mapped.audioEpisodes = row[key];
        else if (key === 'audio_path') mapped.audioPath = row[key];
        else mapped[key] = row[key];
    }
    return mapped;
};

const mapToTable = (item) => {
    if (!item) return null;
    const mapped = {};
    for (const key in item) {
        if (key === 'userId') mapped.user_id = item[key];
        else if (key === 'moduleId') mapped.module_id = item[key];
        else if (key === 'createdAt') mapped.created_at = item[key];
        else if (key === 'updated_at') mapped.updated_at = item[key];
        else if (key === 'videoId') mapped.video_id = item[key];
        else if (key === 'dueDate') mapped.due_date = item[key];
        else if (key === 'startTime') mapped.start_time = item[key];
        else if (key === 'endTime') mapped.end_time = item[key];
        else if (key === 'lastMessage') mapped.last_message = item[key];
        else if (key === 'lastMessageTime') mapped.last_message_time = item[key];
        else if (key === 'groupId') mapped.group_id = item[key];
        else if (key === 'youtubeUrl' || key === 'url') mapped.youtube_url = item[key];
        else if (key === 'resourceLink') mapped.resource_link = item[key];
        else if (key === 'pdfPath') mapped.pdf_path = item[key];
        else if (key === 'deckId') mapped.deck_id = item[key];
        else if (key === 'supabaseId') mapped.supabase_id = item[key];
        else if (key === 'targetHours') mapped.target_hours = item[key];
        else if (key === 'totalHoursStudied') mapped.total_hours_studied = item[key];
        else if (key === 'completedAt') mapped.completed_at = item[key];
        else if (key === 'audioEpisodes') mapped.audio_episodes = item[key];
        else if (key === 'audioPath') mapped.audio_path = item[key];
        else if (key === 'id') mapped.id = item[key];
        else if (key === 'topic') mapped.activity = item[key];
        else mapped[key] = item[key];
    }
    return mapped;
};

const mapConversation = (conv) => {
    if (!conv) return null;
    return {
        id: conv.id,
        type: conv.type,
        groupId: conv.group_id || conv.groupId,
        participants: conv.participants,
        lastMessage: conv.last_message || conv.lastMessage,
        lastMessageTime: conv.last_message_time || conv.lastMessageTime,
        createdAt: conv.created_at || conv.createdAt,
        status: conv.status || 'active', // Default to active for existing chats
        initiatorId: conv.initiator_id || conv.initiatorId
    };
};

const mapMessage = (msg) => {
    if (!msg) return null;
    return {
        id: msg.id,
        conversationId: msg.conversation_id || msg.conversationId,
        senderId: msg.sender_id || msg.senderId,
        senderEmail: msg.sender_email || msg.senderEmail,
        content: msg.content,
        type: msg.type || 'text',
        sharedResource: msg.shared_resource || msg.sharedResource,
        timestamp: msg.timestamp || msg.created_at || msg.createdAt
    };
};


// Generic Collection Helpers
const fetchCollection = async (table, userId) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error fetching from ${table}:`, error);
        return null;
    }
    return data.map(mapRow);
};

const getById = async (table, id) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        // Don't log error for 404s (expected for private/non-existent items)
        if (error.code !== 'PGRST116') {
            console.error(`Error fetching by id from ${table}:`, error);
        }
        return null;
    }
    return mapRow(data);
};

const upsertToCollection = async (table, item) => {
    const client = initSupabase();
    if (!client) return null;

    const row = mapToTable(item);
    const { data, error } = await client
        .from(table)
        .upsert([row])
        .select()
        .single();

    if (error) {
        console.error(`Error upserting to ${table}:`, error);
        return null;
    }
    return mapRow(data);
};

const deleteFromCollection = async (table, id) => {
    const client = initSupabase();
    if (!client) return false;

    const { error } = await client
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting from ${table}:`, error);
        return false;
    }
    return true;
};

// ... (other exports)

module.exports = {
    initSupabase,
    // Tutorials
    getTutorials,
    getTutorialById,
    insertTutorial,
    deleteTutorial,
    // Conversations
    getConversations,
    createConversation,
    findDirectConversation,
    updateConversation,
    // Messages
    getMessages,
    insertMessage,
    markMessagesAsRead,
    // Groups
    createGroup,
    findGroupByInviteCode,
    updateGroup,
    getGroup,
    getGroups,
    // Generic
    fetchCollection,
    getById,
    upsertToCollection,
    deleteFromCollection
};
