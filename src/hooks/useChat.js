import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const useChat = () => {
    const { user } = useAuth(); // Get user from AuthContext

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unreadCounts, setUnreadCounts] = useState({});

    // Realtime States
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [availableGroups, setAvailableGroups] = useState([]);
    const typingTimeoutRef = useRef({});

    // Helper to normalize conversation properties
    const mapConversation = useCallback((conv) => ({
        ...conv,
        initiatorId: conv.initiator_id || conv.initiatorId,
        lastMessageTime: conv.last_message_time || conv.lastMessageTime || conv.updated_at,
        lastMessage: conv.last_message || conv.lastMessage,
        otherUser: conv.other_user || conv.otherUser,
        unreadCount: conv.unreadCount || 0
    }), []);

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            const response = await api.get('/conversations');
            const mappedConversations = (response.data || []).map(mapConversation);
            setConversations(mappedConversations);

            // Initial unread counts calculation
            const counts = {};
            mappedConversations.forEach(conv => {
                counts[conv.id] = conv.unreadCount;
            });
            setUnreadCounts(counts);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(err.message);
        }
    }, [mapConversation]);

    // Fetch available groups
    const fetchAvailableGroups = useCallback(async () => {
        try {
            const response = await api.get('/groups');
            setAvailableGroups(response.data);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    }, []);

    // Mark messages as read
    const markAsRead = useCallback(async (conversationId) => {
        try {
            await api.post(`/conversations/${conversationId}/read`);
            // Update local state to reflect read status
            setMessages(prev => prev.map(msg => ({ ...msg, read: true })));

            // Clear unread count locally
            setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));

            // Update conversations list to show last message as read
            setConversations(prev => prev.map(conv =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ));
        } catch (err) {
            // Only log if it's not a standard network error to avoid console spam
            if (err.message !== 'Network Error') {
                console.error('Error marking as read:', err);
            }
        }
    }, []);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        try {
            const response = await api.get(`/messages/${conversationId}`);
            setMessages(response.data);

            // Mark as read when fetching
            markAsRead(conversationId);
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message;
            if (errorMessage !== 'Network Error') {
                console.error('Error fetching messages:', errorMessage);
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [markAsRead]);

    // Send a message
    const sendMessage = useCallback(async (conversationId, content, type = 'text', sharedResource = null, replyTo = null, metadata = null) => {
        try {
            if (!user) throw new Error('Not authenticated');

            const message = {
                conversationId,
                content,
                type,
                sharedResource,
                replyTo,
                metadata,
                senderId: user.id,
                senderEmail: user.email,
                timestamp: new Date().toISOString(),
                read: false,
                status: 'sent'
            };

            const response = await api.post('/messages', message);

            // Update local messages
            setMessages(prev => [...prev, response.data]);

            // Refresh conversations
            fetchConversations();

            return response.data;
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message);
            throw err;
        }
    }, [user, fetchConversations]);

    // Toggle message reaction
    const toggleReaction = useCallback(async (messageId, emoji) => {
        try {
            if (!user) throw new Error('Not authenticated');

            // Find current reactions for this message to do optimistic update
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const reactions = { ...(msg.reactions || {}) };
                    const users = reactions[emoji] || [];

                    if (users.includes(user.id)) {
                        // Remove reaction
                        reactions[emoji] = users.filter(id => id !== user.id);
                        if (reactions[emoji].length === 0) delete reactions[emoji];
                    } else {
                        // Add reaction
                        reactions[emoji] = [...users, user.id];
                    }

                    return { ...msg, reactions };
                }
                return msg;
            }));

            // Sync with server
            await api.post(`/messages/${messageId}/react`, { emoji });
        } catch (err) {
            console.error('Error toggling reaction:', err);
            // In a real app we might want to revert the optimistic update here
        }
    }, [user]);

    // Send typing indicator
    const sendTyping = useCallback(async (conversationId, isTyping) => {
        if (!supabase || !conversationId || !user) return;

        const channel = supabase.channel(`chat:${conversationId}`);

        await channel.track({
            user: user.email,
            typing: isTyping
        });

        // Also broadcast directly for faster updates
        channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: user.id, isTyping }
        });
    }, [user]);

    // Create or get direct conversation
    const createDirectConversation = useCallback(async (otherUserId) => {
        try {
            const response = await api.post('/conversations/direct', { otherUserId });
            await fetchConversations();
            return response.data;
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Share a resource (note, flashcard, tutorial)
    const shareResource = useCallback(async (conversationId, resource) => {
        const content = `Shared ${resource.type}: ${resource.title}`;
        return sendMessage(conversationId, content, resource.type, resource);
    }, [sendMessage]);

    // Create group (admin only)
    const createGroup = useCallback(async (name, description) => {
        try {
            const response = await api.post('/groups/create', { name, description });
            await fetchConversations();
            return response.data;
        } catch (err) {
            console.error('Error creating group:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Join group via invite code
    const joinGroup = useCallback(async (inviteCode) => {
        try {
            const response = await api.post(`/groups/join/${inviteCode}`, {});
            await fetchConversations();
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message;
            console.error('Error joining group:', errorMessage);
            setError(errorMessage);
            throw err;
        }
    }, [fetchConversations]);

    // Respond to chat request (accept/reject)
    const respondToRequest = useCallback(async (conversationId, status) => {
        try {
            const response = await api.post(`/conversations/${conversationId}/respond`, { status });
            await fetchConversations();
            return response.data;
        } catch (err) {
            console.error('Error responding to request:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Request Notification Permission
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Poll for new messages (Legacy Polling + Supabase Realtime if active)
    useEffect(() => {
        if (!activeConversation) return;

        // Legacy fallback polling (every 10 seconds)
        const interval = setInterval(() => {
            fetchMessages(activeConversation.id);
        }, 10000);

        // Heartbeat for last_seen_at tracking
        const heartbeatInterval = setInterval(() => {
            api.post('/presence/heartbeat').catch(() => { });
        }, 1000 * 60 * 4); // 4 minutes

        return () => {
            clearInterval(interval);
            clearInterval(heartbeatInterval);
        };
    }, [activeConversation, fetchMessages]);

    // Supabase Realtime Setup for Active Conversation
    useEffect(() => {
        if (!activeConversation) {
            setMessages([]);
            return;
        }

        // Fetch immediately on selection/change
        setLoading(true);
        fetchMessages(activeConversation.id);

        if (!supabase) return;

        const channel = supabase.channel(`chat:${activeConversation.id}`);

        channel
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                const { userId, isTyping } = payload;
                const currentUser = user; // Use the 'user' state directly
                if (userId === currentUser.id) return;

                if (isTyping) {
                    setTypingUsers(prev => new Set(prev).add(userId));

                    if (typingTimeoutRef.current[userId]) {
                        clearTimeout(typingTimeoutRef.current[userId]);
                    }

                    typingTimeoutRef.current[userId] = setTimeout(() => {
                        setTypingUsers(prev => {
                            const next = new Set(prev);
                            next.delete(userId);
                            return next;
                        });
                    }, 3000);
                } else {
                    setTypingUsers(prev => {
                        const next = new Set(prev);
                        next.delete(userId);
                        return next;
                    });
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${activeConversation.id}`
            }, (payload) => {
                const newMessage = payload.new;
                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) return prev;
                    return [...prev, newMessage];
                });

                // Update conversation list 'last message' in local state
                setConversations(prev => prev.map(conv =>
                    conv.id === activeConversation.id
                        ? { ...conv, lastMessage: newMessage.content, lastMessageTime: newMessage.created_at }
                        : conv
                ));

                // Mark as read immediately if we are active
                markAsRead(activeConversation.id);

                if (document.hidden && Notification.permission === 'granted') {
                    new Notification('New Message', {
                        body: newMessage.content,
                        icon: '/icon.png'
                    });
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [activeConversation, markAsRead, setConversations]);

    // Realtime listener for NEW conversations (e.g. chat requests)
    useEffect(() => {
        if (!supabase || !user) return;

        const channel = supabase.channel('public:conversations')
            .on('postgres_changes', {
                event: '*', // Listen to INSERT and UPDATE
                schema: 'public',
                table: 'conversations'
            }, (payload) => {
                const conv = payload.new;
                console.log('🔔 Realtime Conversation Event:', payload.eventType, conv);

                // Only add/update if we are a participant
                if (conv.participants && conv.participants.includes(user.id)) {
                    // Map snake_case to camelCase for consistency
                    const mappedConv = mapConversation(conv);

                    setConversations(prev => {
                        const exists = prev.some(c => c.id === mappedConv.id);
                        if (payload.eventType === 'INSERT') {
                            if (exists) return prev;
                            return [mappedConv, ...prev];
                        } else if (payload.eventType === 'UPDATE') {
                            return prev.map(c => c.id === mappedConv.id ? { ...c, ...mappedConv } : c);
                        }
                        return prev;
                    });

                    // Trigger notification for new pending direct requests
                    if (payload.eventType === 'INSERT' && mappedConv.type === 'direct' && mappedConv.initiatorId !== user.id && mappedConv.status === 'pending') {
                        if (Notification.permission === 'granted') {
                            new Notification('New Chat Request', {
                                body: 'Someone started a new conversation with you.',
                                icon: '/icon.png'
                            });
                        }
                    }
                }
            })
            .subscribe((status) => {
                console.log('📡 Conversations Realtime Status:', status);
            });

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    // Global message listener for unread counts and notifications
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase.channel('global-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            }, (payload) => {
                const newMessage = payload.new;

                // Update conversation list globally
                setConversations(prev => prev.map(conv => {
                    if (conv.id === newMessage.conversation_id) {
                        const isCurrentlyActive = activeConversation?.id === newMessage.conversation_id;
                        return {
                            ...conv,
                            lastMessage: newMessage.content,
                            lastMessageTime: newMessage.created_at,
                            unreadCount: isCurrentlyActive ? 0 : (conv.unreadCount || 0) + 1
                        };
                    }
                    return conv;
                }));

                // Update unread counts if not active
                if (!activeConversation || activeConversation.id !== newMessage.conversation_id) {
                    setUnreadCounts(prev => ({
                        ...prev,
                        [newMessage.conversation_id]: (prev[newMessage.conversation_id] || 0) + 1
                    }));

                    // Show notification for background messages
                    if (document.hidden && Notification.permission === 'granted') {
                        new Notification('New Message', {
                            body: newMessage.content,
                            icon: '/icon.png'
                        });
                    }
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [activeConversation]);

    // Global User Presence
    useEffect(() => {
        if (!supabase || !user) return;

        const globalChannel = supabase.channel('global_presence');

        globalChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = globalChannel.presenceState();
                const online = new Set();
                Object.values(newState).forEach(presences => {
                    presences.forEach(p => {
                        if (p.userId) online.add(p.userId);
                    });
                });
                setOnlineUsers(online);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await globalChannel.track({
                        userId: user.id,
                        onlineAt: new Date().toISOString()
                    });
                }
            });

        return () => {
            globalChannel.unsubscribe();
        };
    }, [user]);

    // Leave group
    const leaveGroup = useCallback(async (conversationId) => {
        try {
            await api.post(`/groups/${conversationId}/leave`);
            setActiveConversation(null);
            await fetchConversations();
        } catch (err) {
            console.error('Error leaving group:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Delete conversation
    const deleteConversation = useCallback(async (conversationId) => {
        try {
            await api.delete(`/conversations/${conversationId}`);
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null);
            }
            await fetchConversations();
        } catch (err) {
            console.error('Error deleting conversation:', err);
            setError(err.message);
            throw err;
        }
    }, [activeConversation, fetchConversations]);

    // Keep activeConversation in sync with conversations list
    useEffect(() => {
        if (!activeConversation) return;
        const updated = conversations.find(c => c.id === activeConversation.id);
        if (updated && JSON.stringify(updated) !== JSON.stringify(activeConversation)) {
            setActiveConversation(updated);
        }
    }, [conversations, activeConversation]);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return {
        conversations,
        messages,
        activeConversation,
        setActiveConversation,
        loading,
        error,
        sendMessage,
        createDirectConversation,
        shareResource,
        createGroup,
        joinGroup,
        leaveGroup,
        refreshConversations: fetchConversations,
        onlineUsers,
        typingUsers,
        unreadCounts,
        sendTyping,
        respondToRequest,
        availableGroups,
        fetchAvailableGroups,
        deleteConversation
    };
};

export default useChat;
