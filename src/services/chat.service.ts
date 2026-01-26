import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Message } from '../types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from './mockData';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';

const CONV_KEY = '@chat_conversations';
const MSG_KEY = '@chat_messages';

class ChatService {
    async getConversations(userId: string): Promise<Conversation[]> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .contains('participant_ids', [userId])
                .order('last_message_time', { ascending: false });

            if (error) throw error;
            return (data || []).map(c => {
                const names = c.participant_names as { [key: string]: string } | null;
                const otherName = names
                    ? (Object.entries(names).find(([id]) => id !== userId)?.[1] as string) || 'User'
                    : 'User';

                return {
                    id: c.id,
                    participantIds: c.participant_ids,
                    participantNames: names || undefined,
                    lastMessage: c.last_message,
                    lastMessageTime: c.last_message_time ? new Date(c.last_message_time).getTime() : Date.now(),
                    otherParticipantName: otherName,
                    unreadCount: 0,
                };
            });
        }

        try {
            const stored = await AsyncStorage.getItem(CONV_KEY);
            let conversations: Conversation[] = stored ? JSON.parse(stored) : MOCK_CONVERSATIONS;

            if (!stored) {
                await AsyncStorage.setItem(CONV_KEY, JSON.stringify(MOCK_CONVERSATIONS));
            }

            // Map conversations to ensure otherParticipantName is correct for the current user
            return conversations
                .filter(c => c.participantIds.includes(userId))
                .map(c => {
                    const otherName = c.participantNames
                        ? Object.entries(c.participantNames).find(([id]) => id !== userId)?.[1]
                        : c.otherParticipantName;

                    return {
                        ...c,
                        otherParticipantName: otherName || c.otherParticipantName
                    };
                });
        } catch (error) {
            console.error('Failed to get conversations:', error);
            return [];
        }
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        // Load from cache first for instant UI
        let cachedMessages: Message[] = [];
        try {
            const stored = await AsyncStorage.getItem(`${MSG_KEY}_${conversationId}`);
            if (stored) {
                cachedMessages = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('[ChatService] Cache read error:', e);
        }

        if (IS_SUPABASE_CONFIGURED) {
            // Return cached data immediately if available, then fetch fresh in background
            // Note: Standard return for now, but UI will benefit from getMessages being called with cache logic
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) {
                if (cachedMessages.length > 0) return cachedMessages;
                throw error;
            }

            const freshMessages = (data || []).map(m => ({
                id: m.id,
                conversationId: m.conversation_id,
                senderId: m.sender_id,
                text: m.text,
                timestamp: new Date(m.created_at).getTime(),
            }));

            // Async update cache
            AsyncStorage.setItem(`${MSG_KEY}_${conversationId}`, JSON.stringify(freshMessages));
            return freshMessages;
        }

        try {
            const stored = await AsyncStorage.getItem(MSG_KEY);
            let messages: Message[] = stored ? JSON.parse(stored) : MOCK_MESSAGES;

            if (!stored) {
                await AsyncStorage.setItem(MSG_KEY, JSON.stringify(MOCK_MESSAGES));
            }

            const filtered = messages.filter(m => m.conversationId === conversationId);
            return filtered;
        } catch (error) {
            console.error('Failed to get messages:', error);
            return cachedMessages;
        }
    }

    async getOrCreateConversation(
        currentUserId: string,
        currentUserName: string,
        otherUserId: string,
        otherUserName: string
    ): Promise<Conversation> {
        const startTime = Date.now();
        if (IS_SUPABASE_CONFIGURED) {
            // Check for existing conversation with these two exact participants
            const { data: existing, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .contains('participant_ids', [currentUserId, otherUserId])
                .single();

            if (existing) {
                console.log(`[ChatService] Found existing conversation in ${Date.now() - startTime}ms`);
                return {
                    id: existing.id,
                    participantIds: existing.participant_ids,
                    participantNames: existing.participant_names,
                    lastMessage: existing.last_message,
                    lastMessageTime: new Date(existing.last_message_time).getTime(),
                    otherParticipantName: otherUserName,
                    unreadCount: 0,
                };
            }

            // Create new conversation
            const { data: created, error: createError } = await supabase
                .from('conversations')
                .insert([{
                    participant_ids: [currentUserId, otherUserId],
                    participant_names: {
                        [currentUserId]: currentUserName,
                        [otherUserId]: otherUserName
                    }
                }])
                .select()
                .single();

            if (createError) throw createError;
            console.log(`[ChatService] Created new conversation in ${Date.now() - startTime}ms`);

            return {
                id: created.id,
                participantIds: created.participant_ids,
                participantNames: created.participant_names,
                lastMessage: '',
                lastMessageTime: Date.now(),
                otherParticipantName: otherUserName,
                unreadCount: 0,
            };
        }

        try {
            const stored = await AsyncStorage.getItem(CONV_KEY);
            let conversations: Conversation[] = stored ? JSON.parse(stored) : MOCK_CONVERSATIONS;

            const existing = conversations.find(c =>
                c.participantIds.includes(currentUserId) &&
                c.participantIds.includes(otherUserId)
            );

            if (existing) {
                return existing;
            }

            const newConversation: Conversation = {
                id: 'conv_' + Math.random().toString(36).substr(2, 9),
                participantIds: [currentUserId, otherUserId],
                participantNames: {
                    [currentUserId]: currentUserName,
                    [otherUserId]: otherUserName
                },
                otherParticipantName: otherUserName, // Default fallback
                lastMessage: '',
                lastMessageTime: Date.now(),
                unreadCount: 0,
            };

            conversations.push(newConversation);
            await AsyncStorage.setItem(CONV_KEY, JSON.stringify(conversations));
            return newConversation;
        } catch (error) {
            console.error('Failed to get or create conversation:', error);
            throw error;
        }
    }

    async sendMessage(conversationId: string, senderId: string, text: string, _senderName: string): Promise<Message> {
        if (IS_SUPABASE_CONFIGURED) {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    conversation_id: conversationId,
                    sender_id: senderId,
                    text: text,
                }])
                .select()
                .single();

            if (error) throw error;
            return {
                id: data.id,
                conversationId: data.conversation_id,
                senderId: data.sender_id,
                text: data.text,
                timestamp: new Date(data.created_at).getTime(),
            };
        }

        try {
            const storedMsgs = await AsyncStorage.getItem(MSG_KEY);
            const messages: Message[] = storedMsgs ? JSON.parse(storedMsgs) : MOCK_MESSAGES;

            const newMessage: Message = {
                id: Math.random().toString(36).substr(2, 9),
                conversationId,
                senderId,
                text,
                timestamp: Date.now(),
            };

            messages.push(newMessage);
            await AsyncStorage.setItem(MSG_KEY, JSON.stringify(messages));

            const storedConvs = await AsyncStorage.getItem(CONV_KEY);
            const conversations: Conversation[] = storedConvs ? JSON.parse(storedConvs) : MOCK_CONVERSATIONS;
            const convIndex = conversations.findIndex(c => c.id === conversationId);

            if (convIndex !== -1) {
                conversations[convIndex].lastMessage = text;
                conversations[convIndex].lastMessageTime = Date.now();
                await AsyncStorage.setItem(CONV_KEY, JSON.stringify(conversations));
            }

            return newMessage;
        } catch (error) {
            console.error('Failed to send message:', error);
            throw error;
        }
    }

    subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
        if (IS_SUPABASE_CONFIGURED) {
            return supabase
                .channel(`room:${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    (payload) => {
                        const newMessage: Message = {
                            id: payload.new.id,
                            conversationId: payload.new.conversation_id,
                            senderId: payload.new.sender_id,
                            text: payload.new.text,
                            timestamp: new Date(payload.new.created_at).getTime(),
                        };
                        callback(newMessage);
                    }
                )
                .subscribe();
        }

        return {
            unsubscribe: () => { }
        };
    }
}

export const chatService = new ChatService();
