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

            // --- XP & Level Calculation ---
            const hoursXP = Math.round((stats.totalHours || 0) * 100);
            const tasksXP = (stats.completedTasks || 0) * 150;
            const streakXP = (stats.streak || 0) * 200;

            const totalXP = hoursXP + tasksXP + streakXP;
            const currentLevel = Math.floor(totalXP / 1000) + 1;

            // Update User if XP or Level changed
            if (totalXP !== user.xp || currentLevel !== user.level) {
                // Determine if level up occurred
                if (currentLevel > (user.level || 1)) {
                    // Could trigger a level up animation/toast here if we had a toast context available
                    console.log(`🎉 Level Up! ${user.level} -> ${currentLevel}`);
                }

                updateUser({
                    xp: totalXP,
                    level: currentLevel
                });
            }

            // --- Badge Logic ---
            // 1. Persistence (Streak >= 3)
            if (stats.streak >= 3) {
                earnedBadges.push({ name: 'Persistence', icon: 'Flame', color: 'purple', description: 'Maintained a 3-day study streak' });
            }

            // 2. Scholar (Total Hours >= 10)
            if (stats.totalHours >= 10) {
                earnedBadges.push({ name: 'Scholar', icon: 'Target', color: 'gold', description: 'Studied for over 10 hours' });
            }

            // 3. Focus King (Completed Tasks >= 5)
            if ((stats.completedTasks || 0) >= 5) {
                earnedBadges.push({ name: 'Focus King', icon: 'Award', color: 'green', description: 'Completed 5+ tasks' });
            }

            // Re-implementing logic from useAnalytics to be consistent
            // Note: useAnalytics calculates badges dynamically. We should probably trust ITS calculation
            // and just persist them if they are in stats.badges but not in user.badges.

            const allPotentialBadges = [...earnedBadges, ...(stats.badges || [])];
            // Deduplicate based on name
            const uniquePotentialBadges = Array.from(new Map(allPotentialBadges.map(item => [item.name, item])).values());

            if (uniquePotentialBadges.length > 0) {
                for (const potentialBadge of uniquePotentialBadges) {
                    const hasBadge = currentBadges.some(b => b.name === potentialBadge.name);
                    if (!hasBadge) {
                        try {
                            console.log('🏆 New Badge Earned:', potentialBadge.name);
                            // Optimistically update first
                            updateUser({ badges: [...currentBadges, potentialBadge] });
                            setNewBadges(prev => [...prev, potentialBadge]);

                            // Then persist
                            // const response = await api.post('/user/badges', { badge: potentialBadge });
                            // if (response.data.success) {
                            //    // verified by server
                            // }
                            // Since api might not be fully wired up for this mock, we rely on updateUser context
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
