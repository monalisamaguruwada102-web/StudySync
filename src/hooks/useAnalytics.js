import { useMemo } from "react";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export const useAnalytics = (logs, modules, tasks, sessions = []) => {
    return useMemo(() => {
        if (!logs || !modules || !tasks) {
            return {
                totalHours: 0,
                activeModules: 0,
                pendingTasks: 0,
                weeklyProgress: 0,
                moduleData: [],
                weeklyTrend: [],
                streak: 0
            };
        }

        // Unified list of study activity
        const normalizedSessions = (sessions || []).map(s => ({
            ...s,
            hours: s.duration || 0, // In hours
            date: s.completedAt,
            type: 'focus'
        }));

        const allLogs = [...logs, ...normalizedSessions];

        // 1. Total Hours
        const totalHours = allLogs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0);

        // 1.1 Today's Hours (Fix: Use local date instead of UTC)
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
        const todayHours = allLogs
            .filter(log => {
                const logDate = log.date ? new Date(log.date) : (log.createdAt ? new Date(log.createdAt) : null);
                return logDate && logDate.toLocaleDateString('en-CA') === todayStr;
            })
            .reduce((acc, log) => acc + parseFloat(log.hours || 0), 0);

        // 2. Active Modules
        const activeModules = modules.length;

        // 3. Pending Tasks
        const pendingTasks = tasks.filter(task => task.status === "Pending").length;

        // 4. Module Progress Data
        const moduleData = modules.map((mod, index) => {
            const modLogs = allLogs.filter(l => l.moduleId === mod.id);
            const loggedHours = modLogs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0);
            const baseHours = parseFloat(mod.totalHoursStudied || 0);

            const totalModHours = baseHours + loggedHours;
            const target = parseFloat(mod.targetHours || 0);
            const remaining = Math.max(0, target - totalModHours);

            return {
                id: mod.id,
                name: mod.name,
                hours: totalModHours,
                remaining: remaining.toFixed(1),
                target: target,
                progress: target > 0 ? (totalModHours / target) * 100 : 0,
                index // Useful for color assignment
            };
        });

        // 4.1 Total Remaining
        const totalRemaining = moduleData.reduce((acc, m) => acc + parseFloat(m.remaining), 0);

        // 5. Weekly Trend
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);

        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyTrend = days.map((day, index) => {
            const dayLogs = allLogs.filter(log => {
                const logDate = log.date ? new Date(log.date) : (log.createdAt ? new Date(log.createdAt) : null);
                return logDate && logDate.getDay() === index && isWithinInterval(logDate, { start: weekStart, end: weekEnd });
            });

            // Breakdown by module
            const moduleHours = {};
            modules.forEach(m => {
                const hours = dayLogs
                    .filter(l => l.moduleId === m.id)
                    .reduce((acc, l) => acc + parseFloat(l.hours || 0), 0);
                if (hours > 0) moduleHours[m.id] = hours;
            });

            return {
                day,
                hours: dayLogs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0),
                moduleHours
            };
        });

        // 6. Streak tracking (Real Logic)
        const sortedDates = [...new Set(allLogs.map(log => {
            const date = log.date || log.createdAt;
            return date ? new Date(date).toISOString().split('T')[0] : null;
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
                    const diff = (current - next) / (1000 * 60 * 60 * 24);
                    if (diff === 1) streak++;
                    else break;
                }
            }
        }

        // 7. Achievement Detection
        const badges = [];
        if (streak >= 3) badges.push({ name: 'Persistence', icon: 'Flame', color: 'purple' });
        if (totalHours >= 10) badges.push({ name: 'Scholar', icon: 'Target', color: 'gold' });
        if (tasks.filter(t => t.status === 'Completed').length >= 5) badges.push({ name: 'Focus King', icon: 'Award', color: 'green' });

        const hasEarlySession = allLogs.some(log => {
            const date = log.date ? new Date(log.date) : null;
            return date && date.getHours() < 8;
        });
        if (hasEarlySession) badges.push({ name: 'Early Bird', icon: 'Zap', color: 'primary' });

        return {
            totalHours,
            todayHours,
            totalRemaining,
            activeModules,
            pendingTasks,
            weeklyProgress: modules.length > 0 ? (moduleData.reduce((acc, m) => acc + m.progress, 0) / modules.length) : 0,
            moduleData,
            weeklyTrend,
            streak,
            badges
        };

    }, [logs, modules, tasks, sessions]);
};
