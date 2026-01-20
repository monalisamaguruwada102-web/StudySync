import AsyncStorage from '@react-native-async-storage/async-storage';
import { Conversation, Message } from '../types';
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from './mockData';
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';

const CONV_KEY = '@chat_conversations';
const MSG_KEY = '@chat_messages';

class ChatService {
    async getConversations(userId: string): Promise<Conversation[]> {
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
        try {
            const stored = await AsyncStorage.getItem(MSG_KEY);
            let messages: Message[] = stored ? JSON.parse(stored) : MOCK_MESSAGES;

            if (!stored) {
                await AsyncStorage.setItem(MSG_KEY, JSON.stringify(MOCK_MESSAGES));
            }

            return messages.filter(m => m.conversationId === conversationId);
        } catch (error) {
            console.error('Failed to get messages:', error);
            return [];
        }
    }

    async getOrCreateConversation(
        currentUserId: string,
        currentUserName: string,
        otherUserId: string,
        otherUserName: string
    ): Promise<Conversation> {
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
