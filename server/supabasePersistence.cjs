const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client for server-side
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

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
    return data;
};

const insertTutorial = async (tutorial) => {
    const client = initSupabase();
    if (!client) return null;

    const { data, error } = await client
        .from('tutorials')
        .insert([{
            user_id: tutorial.userId,
            title: tutorial.title,
            youtube_url: tutorial.youtubeUrl,
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
    return data;
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
    return data;
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
    return data;
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
    return data[0];
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
    return data;
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
    return data;
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
    return data;
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
    return data;
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
    return data;
};

module.exports = {
    initSupabase,
    // Tutorials
    getTutorials,
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
