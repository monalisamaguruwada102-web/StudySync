import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * usePresence hook
 * Tracks and manages real-time presence of users in a global study room.
 * @param {string} roomName - The name of the presence channel (default: 'global')
 * @returns {Array} List of online users with their status and metadata
 */
export function usePresence(roomName = 'global') {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!user || !supabase) return;

        const channel = supabase.channel(`presence:${roomName}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        const handleSync = () => {
            const newState = channel.presenceState();
            const formattedUsers = Object.entries(newState).map(([id, presences]) => {
                // Presence state returns an array for each key, take the most recent one
                const current = presences[0];
                return {
                    id,
                    ...current
                };
            });
            setOnlineUsers(formattedUsers);
        };

        channel
            .on('presence', { event: 'sync' }, handleSync)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        id: user.id,
                        name: user.name || user.email?.split('@')[0] || 'Anonymous student',
                        avatar_url: user.avatar_url,
                        status: 'online',
                        activity: 'Browsing Dashboard',
                        last_seen: new Date().toISOString()
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [user, roomName]);

    /**
     * Update current user's activity status
     * @param {Object} statusUpdate - { activity: string, status: string }
     */
    const updateActivity = async (statusUpdate) => {
        if (!user || !supabase) return;

        const channel = supabase.channel(`presence:${roomName}`);
        await channel.track({
            id: user.id,
            name: user.name || user.email?.split('@')[0] || 'Anonymous student',
            avatar_url: user.avatar_url,
            last_seen: new Date().toISOString(),
            ...statusUpdate
        });
    };

    return { onlineUsers, updateActivity };
}

export default usePresence;
