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

        // Map pathname to readable activity
        const getActivityFromPath = (path) => {
            if (path === '/' || path === '/dashboard') return '📊 Viewing Dashboard';
            if (path.startsWith('/modules')) return '📚 Studying Modules';
            if (path.startsWith('/focus')) return '🎯 Deep Focus Mode';
            if (path.startsWith('/flashcards')) return '🧠 Practicing Flashcards';
            if (path.startsWith('/notes')) return '📝 Taking Notes';
            if (path.startsWith('/chat')) return '💬 In Chat';
            if (path.startsWith('/calendar')) return '📅 Checking Calendar';
            if (path.startsWith('/kanban')) return '✅ Managing Tasks';
            if (path.startsWith('/grades')) return '🎓 Checking Grades';
            if (path.startsWith('/analytics') || path.startsWith('/deep-analytics')) return '📈 Viewing Analytics';
            if (path.startsWith('/logs')) return '📋 Reviewing Study Logs';
            if (path.startsWith('/tutorials')) return '🎥 Watching Tutorials';
            if (path.startsWith('/leaderboard')) return '🏆 Checking Leaderboard';
            if (path.startsWith('/settings')) return '⚙️ In Settings';
            if (path.startsWith('/sandbox')) return '💻 In Code Sandbox';
            return '🌐 Browsing';
        };

        const channel = supabase.channel(`presence:${roomName}`, {
            config: { presence: { key: user.id } },
        });

        const handleSync = () => {
            const newState = channel.presenceState();
            const formattedUsers = Object.entries(newState).map(([id, presences]) => {
                const current = presences[0];
                return { id, ...current };
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
                        activity: getActivityFromPath(window.location.pathname),
                        last_seen: new Date().toISOString()
                    });
                }
            });

        // Re-track on route changes
        const handleRouteChange = () => {
            channel.track({
                id: user.id,
                name: user.name || user.email?.split('@')[0] || 'Anonymous student',
                avatar_url: user.avatar_url,
                status: 'online',
                activity: getActivityFromPath(window.location.pathname),
                last_seen: new Date().toISOString()
            });
        };
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            channel.unsubscribe();
            window.removeEventListener('popstate', handleRouteChange);
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
