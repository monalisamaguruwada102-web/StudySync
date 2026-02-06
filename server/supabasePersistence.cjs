const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for server-side
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

const initSupabase = () => {
    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase credentials not configured - using local storage');
        return null;
    }

    if (!supabase) {
        supabase = createClient(supabaseUrl, supabaseKey);
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

// Conversations
const mapConversation = (conv) => {
    if (!conv) return null;
    return {
        id: conv.id,
        type: conv.type,
        groupId: conv.group_id || conv.groupId,
        participants: conv.participants,
        lastMessage: conv.last_message || conv.lastMessage,
        lastMessageTime: conv.last_message_time || conv.lastMessageTime,
        createdAt: conv.created_at || conv.createdAt
    };
};

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
            last_message_time: conversation.lastMessageTime
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
    // Groups
    createGroup,
    findGroupByInviteCode,
    updateGroup,
    getGroup
};
