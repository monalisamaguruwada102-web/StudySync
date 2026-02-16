const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(url, key);

/**
 * Fetches ALL relevant data from Supabase and calculates live stats 
 * that match the dashboard's on-the-fly calculation.
 */
const getLiveDashboardStats = async (userId) => {
    if (!supabase) return null;

    try {
        // 0. Fetch User Profile for Theme, Streak, and Timer State
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        const { data: userRecord } = await supabase.from('users').select('*').eq('id', userId).single();

        // Merge profile and user (legacy fallback)
        const combinedUser = { ...(userRecord || {}), ...(profile || {}) };

        // 1. Fetch all study logs
        const { data: logs } = await supabase.from('study_logs').select('*').eq('user_id', userId);
        const totalHours = (logs || []).reduce((acc, l) => acc + parseFloat(l.hours || 0), 0);

        // 2. Fetch all tasks
        const { data: allTasks } = await supabase.from('tasks').select('*').eq('user_id', userId);
        const completedTasksCount = (allTasks || []).filter(t => t.status === 'Completed').length;

        // 3. Calculate Streak (Real Logic from useAnalytics.js)
        const sortedDates = [...new Set((logs || []).map(log => {
            const dateVal = log.date || log.created_at || log.createdAt;
            if (!dateVal) return null;
            return String(dateVal).split('T')[0];
        }))].filter(Boolean).sort().reverse();

        let streak = 0;
        if (sortedDates.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                streak = 1;
                for (let i = 0; i < sortedDates.length - 1; i++) {
                    const current = new Date(sortedDates[i]);
                    const next = new Date(sortedDates[i + 1]);
                    const diff = Math.round((current - next) / (1000 * 60 * 60 * 24));
                    if (diff === 1) streak++;
                    else break;
                }
            }
        }

        // 4. Calculate Live XP and Level (Formula from useGamification.js)
        const hoursXP = Math.round(totalHours * 100);
        const tasksXP = completedTasksCount * 150;
        const streakXP = streak * 200;
        const totalXP = hoursXP + tasksXP + streakXP;
        const liveLevel = Math.floor(totalXP / 1000) + 1;

        // 5. Fetch Modules and map to camelCase for the frontend/scheduler
        const { data: rawModules } = await supabase.from('modules').select('*').eq('user_id', userId);
        const modules = (rawModules || []).map(m => ({
            ...m,
            targetHours: m.target_hours,
            totalHoursStudied: m.total_hours_studied
        }));


        // 6. Fetch Flashcards and Decks (New for Active Recall)
        const { data: decks } = await supabase.from('flashcard_decks').select('*').eq('user_id', userId);
        const deckIds = (decks || []).map(d => d.id);
        let flashcards = [];
        if (deckIds.length > 0) {
            const { data: cards } = await supabase.from('flashcards').select('*').in('deck_id', deckIds);
            flashcards = cards || [];
        }

        return {
            totalHours,
            completedTasksCount,
            streak: combinedUser.streak || streak, // Priority to profile streak if set
            theme: combinedUser.theme || 'default',
            darkMode: combinedUser.dark_mode || false,
            timerState: combinedUser.timer_state || {},
            totalXP,
            level: liveLevel,
            logs: logs || [],
            tasks: allTasks || [],
            modules: modules || [],
            decks: decks || [],
            flashcards
        };
    } catch (error) {
        console.error('❌ Sync Error:', error);
        return null;
    }
};

/**
 * Fetches analytics for the last 7 days for the Weekly Retrospective.
 */
const getWeeklyAnalytics = async (userId) => {
    if (!supabase) return null;

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();

        // 1. Fetch study logs (last 7 days)
        const { data: logs } = await supabase.from('study_logs').select('*').eq('user_id', userId).gte('date', sevenDaysAgoStr);

        // 2. Fetch completed tasks (last 7 days)
        const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', userId).eq('status', 'Completed').gte('updated_at', sevenDaysAgoStr);

        // 3. Fetch Pomodoro sessions (for peak performance)
        const { data: poms } = await supabase.from('pomodoro_sessions').select('*').eq('user_id', userId).eq('completed', true).gte('created_at', sevenDaysAgoStr);

        // 4. Fetch Modules for naming
        const { data: modules } = await supabase.from('modules').select('*').eq('user_id', userId);

        // --- Aggregation Logic ---

        // XP History & Mastery Map
        const dailyXP = {};
        const moduleHours = {};
        const hourDistribution = new Array(24).fill(0);

        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dailyXP[d.toISOString().split('T')[0]] = 0;
        }

        (logs || []).forEach(log => {
            const dateVal = log.date || log.created_at;
            if (!dateVal) return;
            const date = String(dateVal).split('T')[0];
            if (dailyXP[date] !== undefined) {
                dailyXP[date] += Math.round(parseFloat(log.hours || 0) * 100);
            }
            // Mastery Map
            const mId = log.module_id || log.moduleId;
            moduleHours[mId] = (moduleHours[mId] || 0) + parseFloat(log.hours || 0);
        });

        (tasks || []).forEach(task => {
            const dateVal = task.updated_at || task.updatedAt || task.created_at;
            if (!dateVal) return;
            const date = String(dateVal).split('T')[0];
            if (dailyXP[date] !== undefined) {
                dailyXP[date] += 150;
            }
        });

        (poms || []).forEach(pom => {
            const dateVal = pom.created_at || pom.createdAt;
            if (!dateVal) return;
            const hour = new Date(dateVal).getHours();
            hourDistribution[hour]++;
        });

        const masteryMap = Object.entries(moduleHours).map(([id, hours]) => {
            const module = (modules || []).find(m => m.id === id);
            return { name: module ? module.name : 'Unknown', hours: hours.toFixed(1) };
        }).sort((a, b) => b.hours - a.hours);

        const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));

        return {
            dailyXP: Object.entries(dailyXP).reverse().map(([date, xp]) => ({ date, xp })),
            masteryMap,
            peakHour,
            totalTasks: (tasks || []).length,
            totalHours: (logs || []).reduce((acc, l) => acc + parseFloat(l.hours || 0), 0)
        };
    } catch (error) {
        console.error('❌ Weekly Analytics Error:', error);
        return null;
    }
};

module.exports = { getLiveDashboardStats, getWeeklyAnalytics };
