import { useState, useEffect } from "react";
import { getAnalyticsData } from "../services/firestoreService";
import { startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";

export const useAnalytics = (logs, modules, tasks) => {
    const [stats, setStats] = useState({
        totalHours: 0,
        activeModules: 0,
        pendingTasks: 0,
        weeklyProgress: 0,
        moduleData: [], // for charts
        weeklyTrend: [], // for charts
        streak: 0
    });

    useEffect(() => {
        if (!logs || !modules || !tasks) return;

        // 1. Total Hours
        const totalHours = logs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0);

        // 2. Active Modules
        const activeModules = modules.length;

        // 3. Pending Tasks
        const pendingTasks = tasks.filter(task => task.status === "Pending").length;

        // 4. Module Progress Data
        const moduleData = modules.map(mod => {
            const modLogs = logs.filter(log => log.moduleId === mod.id);
            const modHours = modLogs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0);
            return {
                name: mod.name,
                hours: modHours,
                target: mod.targetHours,
                progress: mod.targetHours > 0 ? (modHours / mod.targetHours) * 100 : 0
            };
        });

        // 5. Weekly Trend
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);

        // Last 7 days trend
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const weeklyTrend = days.map((day, index) => {
            const dayLogs = logs.filter(log => {
                const logDate = log.date ? new Date(log.date) : null;
                return logDate && logDate.getDay() === index && isWithinInterval(logDate, { start: weekStart, end: weekEnd });
            });
            return {
                day,
                hours: dayLogs.reduce((acc, log) => acc + parseFloat(log.hours || 0), 0)
            };
        });

        // 6. Streak tracking (simplified)
        const logDates = [...new Set(logs.map(log => log.date))].sort().reverse();
        let streak = 0;
        let checkDate = new Date();

        // Check if there's a log today or yesterday to start streak
        // (This is a simplified logic)

        setStats({
            totalHours,
            activeModules,
            pendingTasks,
            weeklyProgress: 0, // Placeholder
            moduleData,
            weeklyTrend,
            streak
        });

    }, [logs, modules, tasks]);

    return stats;
};
