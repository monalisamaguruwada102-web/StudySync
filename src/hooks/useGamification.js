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

            let updatedXP = totalXP;
            let updatedLevel = currentLevel;
            let updatedStreak = stats.streak;
            let updatedBadges = [...currentBadges];
            let badgesEarnedThisCheck = [];

            // Determine if level up occurred
            if (currentLevel > (user.level || 1)) {
                console.log(`🎉 Level Up! ${user.level || 1} -> ${currentLevel}`);
            }

            // --- Badge Logic ---
            achievements.forEach(achievement => {
                // Check if user already has the badge and if the requirement is met
                if (!currentBadgeNames.includes(achievement.name) && achievement.requirement(stats, currentLevel)) {
                    const newBadge = {
                        ...achievement,
                        earnedAt: new Date().toISOString()
                    };
                    updatedBadges.push(newBadge);
                    badgesEarnedThisCheck.push(newBadge);
                    console.log('🏆 New Badge Earned:', newBadge.name);
                }
            });

            // Only update user if something has changed
            if (totalXP !== user.xp || currentLevel !== user.level || stats.streak !== user.streak || badgesEarnedThisCheck.length > 0) {
                // Optimistically update local context
                updateUser({
                    xp: updatedXP,
                    level: updatedLevel,
                    streak: updatedStreak,
                    badges: updatedBadges
                });
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
                            const response = await api.post('/user/badges', { badge: potentialBadge });
                            if (response.data.success) {
                                console.log('✅ Badge persisted to server');
                            }
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
