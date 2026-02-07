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

const mapRow = (row, table = null) => {
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
        else if (key === 'youtube_url') {
            mapped.youtubeUrl = row[key];
            // Derive videoId for frontend playback
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
            const match = row[key]?.match(regExp);
            if (match && match[2].length === 11) {
                mapped.videoId = match[2];
            }
        }
        else if (key === 'resource_link') mapped.resourceLink = row[key];
        else if (key === 'pdf_path') mapped.pdfPath = row[key];
        else if (key === 'deck_id') mapped.deckId = row[key];
        else if (key === 'supabase_id') mapped.supabaseId = row[key];
        else if (key === 'target_hours') mapped.targetHours = row[key];
        else if (key === 'total_hours_studied') mapped.totalHoursStudied = row[key];
        else if (key === 'completed_at') mapped.completedAt = row[key];
        else if (key === 'audio_episodes') mapped.audioEpisodes = row[key];
        else if (key === 'audio_path') mapped.audioPath = row[key];
        else if (key === 'tutorial_completed') mapped.tutorialCompleted = row[key];
        else if (key === 'activity' && table === 'study_logs') mapped.topic = row[key];
        else mapped[key] = row[key];
    }
    return mapped;
};

const mapToTable = (item, table = null) => {
    if (!item) return null;
    const mapped = {};
    for (const key in item) {
        // Skip internal tracking fields that don't exist in Supabase tables
        if (key === 'supabaseId') continue;
        if (key === 'newly_registered') continue;
        if (key === 'videoId') continue;
        if (key === 'thumbnail') continue;
        if (key === 'tutorialCompleted') continue;
        if (key === 'tutorial_completed') continue;
        if (key === 'initiatorId') continue;
        if (key === 'updatedAt' && table === 'users') continue;
        if (key === 'password' && table === 'users') {
            // Include password for users table as it exists there locally and we sync it
            mapped.password = item[key];
            continue;
        }

        if (key === 'userId') mapped.user_id = item[key];
        else if (key === 'moduleId') mapped.module_id = item[key];
        else if (key === 'createdAt') mapped.created_at = item[key];
        else if (key === 'updatedAt') mapped.updated_at = item[key];
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
        else if (key === 'targetHours') mapped.target_hours = item[key];
        else if (key === 'totalHoursStudied') mapped.total_hours_studied = item[key];
        else if (key === 'completedAt') mapped.completed_at = item[key];
        else if (key === 'audioEpisodes') mapped.audio_episodes = item[key];
        else if (key === 'audioPath') mapped.audio_path = item[key];
        else if (key === 'id') mapped.id = item[key];
        else if (key === 'topic' && table === 'study_logs') mapped.activity = item[key];
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
const fetchAll = async (table) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error fetching all from ${table}:`, error);
        return null;
    }
    return data.map(row => mapRow(row, table));
};

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
    return data.map(row => mapRow(row, table));
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
    return mapRow(data, table);
};

const upsertToCollection = async (table, item) => {
    const client = initSupabase();
    if (!client) return null;

    const row = mapToTable(item, table);
    const { data, error } = await client
        .from(table)
        .upsert([row])
        .select()
        .single();

    if (error) {
        console.error(`Error upserting to ${table}:`, error);
        return null;
    }
    return mapRow(data, table);
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

// Conversations
const getConversations = async (userId) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_time', { ascending: false });

    if (error) {
        console.error('Error fetching conversations:', error);
        return null;
    }
    return data.map(mapConversation);
};

const createConversation = async (conversation) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('conversations')
        .insert([{
            type: conversation.type,
            group_id: conversation.groupId,
            participants: conversation.participants,
            last_message: conversation.lastMessage,
            last_message_time: conversation.lastMessageTime,
            status: conversation.status || 'pending',
            initiator_id: conversation.initiatorId
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        return null;
    }
    return mapConversation(data);
};

const findDirectConversation = async (userId1, userId2) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('conversations')
        .select('*')
        .eq('type', 'direct')
        .contains('participants', [userId1, userId2]);

    if (error || !data || data.length === 0) return null;
    return mapConversation(data[0]);
};

const updateConversation = async (id, updates) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('conversations')
        .update({
            last_message: updates.lastMessage,
            last_message_time: updates.lastMessageTime,
            participants: updates.participants
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return null;
    return mapConversation(data);
};

// Messages
const getMessages = async (conversationId) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return null;
    }
    return data.map(msg => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        senderEmail: msg.sender_email,
        content: msg.content,
        type: msg.type,
        sharedResource: msg.shared_resource,
        read: msg.read,
        timestamp: msg.created_at
    }));
};

const insertMessage = async (message) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('messages')
        .insert([{
            conversation_id: message.conversationId,
            sender_id: message.senderId,
            sender_email: message.senderEmail,
            content: message.content,
            type: message.type || 'text',
            shared_resource: message.sharedResource,
            read: false
        }])
        .select()
        .single();

    if (error) {
        console.error('Error inserting message:', error);
        return null;
    }
    return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        senderEmail: data.sender_email,
        content: data.content,
        type: data.type,
        sharedResource: data.shared_resource,
        read: data.read,
        timestamp: data.created_at
    };
};

const markMessagesAsRead = async (conversationId, userId) => {
    const client = initSupabase();
    if (!client) return null;

    const { error } = await client
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

    if (error) {
        console.error('Error marking messages as read:', error);
        return false;
    }
    return true;
};

// Groups
const mapGroup = (group) => {
    if (!group) return null;
    return {
        id: group.id,
        name: group.name,
        description: group.description,
        createdBy: group.created_by || group.createdBy,
        members: group.members,
        inviteCode: group.invite_code || group.inviteCode,
        createdAt: group.created_at || group.createdAt
    };
};

const createGroup = async (group) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('groups')
        .insert([{
            name: group.name,
            description: group.description,
            created_by: group.createdBy,
            members: group.members,
            invite_code: group.inviteCode
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating group:', error);
        return null;
    }
    return mapGroup(data);
};

const findGroupByInviteCode = async (inviteCode) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

    if (error) return null;
    return mapGroup(data);
};

const updateGroup = async (id, updates) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('groups')
        .update({
            members: updates.members
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return null;
    return mapGroup(data);
};

const getGroups = async () => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching groups:', error);
        return null;
    }
    return data.map(mapGroup);
};

const getGroup = async (id) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('groups')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return mapGroup(data);
};

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
    fetchAll,
    fetchCollection,
    getById,
    upsertToCollection,
    deleteFromCollection
};
