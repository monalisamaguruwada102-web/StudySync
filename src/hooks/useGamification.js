import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const useGamification = (stats) => {
    const { user, updateUser } = useAuth();
    const [newBadges, setNewBadges] = useState([]);

    useEffect(() => {
        if (!user || !stats) return;

        const checkAchievements = async () => {
            const earnedBadges = [];
            const currentBadges = user.badges || [];

            // Define Achievements Logic
            // 1. Persistence (Streak >= 3)
            if (stats.streak >= 3) {
                earnedBadges.push({ name: 'Persistence', icon: 'Flame', color: 'purple', description: 'Maintained a 3-day study streak' });
            }

            // 2. Scholar (Total Hours >= 10)
            if (stats.totalHours >= 10) {
                earnedBadges.push({ name: 'Scholar', icon: 'Target', color: 'gold', description: 'Studied for over 10 hours' });
            }

            // 3. Focus King (Completed Tasks >= 5)
            if (stats.pendingTasks === 0 && stats.totalHours > 5) {
                // Logic change: Based on completed tasks count if available in stats, 
                // but stats currently only has pendingTasks. 
                // We'll rely on what stats provides or what we can infer.
                // Ideally stats should provide 'completedTasks' count. 
                // For now, let's use a simpler heuristic or just skip if data missing.
            }
            // Re-implementing logic from useAnalytics to be consistent
            // Note: useAnalytics calculates badges dynamically. We should probably trust ITS calculation
            // and just persist them if they are in stats.badges but not in user.badges.

            if (stats.badges && stats.badges.length > 0) {
                for (const potentialBadge of stats.badges) {
                    const hasBadge = currentBadges.some(b => b.name === potentialBadge.name);
                    if (!hasBadge) {
                        try {
                            console.log('🏆 New Badge Earned:', potentialBadge.name);
                            const response = await api.post('/user/badges', { badge: potentialBadge });
                            if (response.data.success) {
                                updateUser({ badges: response.data.badges });
                                setNewBadges(prev => [...prev, potentialBadge]);
                            }
                        } catch (error) {
                            console.error('Failed to persist badge:', error);
                        }
                    }
                }
            }
        };

        checkAchievements();

    }, [stats, user, updateUser]);

    return {
        badges: user?.badges || [],
        newBadges
    };
};
