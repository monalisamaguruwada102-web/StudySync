import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const useChat = () => {
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get auth token
    const getToken = () => localStorage.getItem('token');

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${API_URL}/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(response.data);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(err.message);
        }
    }, []);

    // Fetch messages for a conversation
    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(`${API_URL}/messages/${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(response.data);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Send a message
    const sendMessage = useCallback(async (conversationId, content, type = 'text', sharedResource = null) => {
        try {
            const token = getToken();
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const message = {
                conversationId,
                content,
                type,
                sharedResource,
                senderId: user.id,
                senderEmail: user.email,
                timestamp: new Date().toISOString(),
                read: false
            };

            const response = await axios.post(`${API_URL}/messages`, message, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local messages
            setMessages(prev => [...prev, response.data]);

            // Update conversation last message
            await axios.put(`${API_URL}/conversations/${conversationId}`, {
                lastMessage: content.substring(0, 50),
                lastMessageTime: new Date().toISOString()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh conversations
            fetchConversations();

            return response.data;
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Create or get direct conversation
    const createDirectConversation = useCallback(async (otherUserId) => {
        try {
            const token = getToken();
            const response = await axios.post(`${API_URL}/conversations/direct`,
                { otherUserId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh conversations
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
            const token = getToken();
            const response = await axios.post(`${API_URL}/groups/create`,
                { name, description },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh conversations
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
            const token = getToken();
            const response = await axios.post(`${API_URL}/groups/join/${inviteCode}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh conversations
            await fetchConversations();

            return response.data;
        } catch (err) {
            console.error('Error joining group:', err);
            setError(err.message);
            throw err;
        }
    }, [fetchConversations]);

    // Poll for new messages
    useEffect(() => {
        if (!activeConversation) return;

        const interval = setInterval(() => {
            fetchMessages(activeConversation.id);
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [activeConversation, fetchMessages]);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Update active conversation when selected
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation, fetchMessages]);

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
        refreshConversations: fetchConversations
    };
};

export default useChat;
