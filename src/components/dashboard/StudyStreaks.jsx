import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Trophy } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const WEEKS_TO_SHOW = 26; // ~6 months

const getIntensityClass = (hours) => {
    if (!hours || hours === 0) return 'bg-slate-100 dark:bg-slate-800/60';
    if (hours < 0.5) return 'bg-emerald-200 dark:bg-emerald-900/60';
    if (hours < 1.5) return 'bg-emerald-400 dark:bg-emerald-700';
    if (hours < 3) return 'bg-emerald-500 dark:bg-emerald-500';
    return 'bg-emerald-600 dark:bg-emerald-400';
};

const getIntensityLabel = (hours) => {
    if (!hours || hours === 0) return 'No study';
    if (hours < 0.5) return `${(hours * 60).toFixed(0)} minutes`;
    return `${hours.toFixed(1)} hours`;
};

const StudyStreaks = ({ logs = [], sessions = [], streak = 0 }) => {
    const { heatmapData, totalDays, longestStreak, totalHours } = useMemo(() => {
        // Build a map of date -> hours from all study activity
        const dateMap = {};

        const addToDate = (dateStr, hours) => {
            if (!dateStr) return;
            const key = new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
            dateMap[key] = (dateMap[key] || 0) + parseFloat(hours || 0);
        };

        logs.forEach(log => addToDate(log.date || log.createdAt, log.hours));
        sessions.forEach(s => addToDate(s.completedAt || s.createdAt, s.duration));

        // Generate heatmap grid (last N weeks)
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (WEEKS_TO_SHOW * 7) + (6 - today.getDay()));

        const weeks = [];
        const monthLabels = [];
        let currentDate = new Date(startDate);
        let lastMonth = -1;

        for (let w = 0; w < WEEKS_TO_SHOW; w++) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                const dateKey = currentDate.toLocaleDateString('en-CA');
                const isFuture = currentDate > today;
                week.push({
                    date: dateKey,
                    hours: isFuture ? null : (dateMap[dateKey] || 0),
                    isFuture,
                    dayOfWeek: d,
                });

                // Track month labels
                if (d === 0 && currentDate.getMonth() !== lastMonth) {
                    monthLabels.push({ week: w, label: MONTHS[currentDate.getMonth()] });
                    lastMonth = currentDate.getMonth();
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
            weeks.push(week);
        }

        // Calculate stats
        const studiedDates = Object.keys(dateMap).filter(k => dateMap[k] > 0);
        const totalDays = studiedDates.length;
        const totalHours = Object.values(dateMap).reduce((a, b) => a + b, 0);

        // Calculate longest streak
        const sortedDates = studiedDates.sort();
        let longest = 0;
        let currentRun = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            const prev = new Date(sortedDates[i - 1]);
            const curr = new Date(sortedDates[i]);
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                currentRun++;
            } else {
                longest = Math.max(longest, currentRun);
                currentRun = 1;
            }
        }
        longest = Math.max(longest, currentRun);
        if (sortedDates.length === 0) longest = 0;

        return {
            heatmapData: { weeks, monthLabels },
            totalDays,
            longestStreak: longest,
            totalHours,
        };
    }, [logs, sessions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-6 md:p-8"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <Flame size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Study Activity</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your learning consistency over time</p>
                    </div>
                </div>

                {/* Streak Stats */}
                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                            <Flame size={16} className="text-orange-500" />
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{streak}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                            <Trophy size={16} className="text-amber-500" />
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{longestStreak}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Longest</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="text-center hidden sm:block">
                        <div className="flex items-center gap-1.5 justify-center">
                            <Calendar size={16} className="text-emerald-500" />
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalDays}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Days Active</span>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-[680px]">
                    {/* Month labels */}
                    <div className="flex mb-1 ml-8">
                        {heatmapData.monthLabels.map((m, i) => (
                            <span
                                key={i}
                                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                                style={{
                                    position: 'relative',
                                    left: `${m.week * 16}px`,
                                    marginRight: i < heatmapData.monthLabels.length - 1
                                        ? `${(heatmapData.monthLabels[i + 1]?.week - m.week) * 16 - 30}px`
                                        : '0'
                                }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex gap-0">
                        {/* Day labels */}
                        <div className="flex flex-col gap-[3px] mr-2 mt-0">
                            {DAYS.map((day, i) => (
                                <span key={i} className="text-[9px] font-bold text-slate-400 dark:text-slate-500 h-[13px] flex items-center justify-end w-6">
                                    {day}
                                </span>
                            ))}
                        </div>

                        {/* Weeks */}
                        <div className="flex gap-[3px]">
                            {heatmapData.weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col gap-[3px]">
                                    {week.map((day, di) => (
                                        <motion.div
                                            key={`${wi}-${di}`}
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: wi * 0.01 + di * 0.005 }}
                                            className={`w-[13px] h-[13px] rounded-[3px] transition-all cursor-pointer hover:ring-2 hover:ring-slate-400 dark:hover:ring-slate-500 hover:ring-offset-1 dark:hover:ring-offset-slate-900 ${day.isFuture
                                                    ? 'bg-transparent'
                                                    : getIntensityClass(day.hours)
                                                }`}
                                            title={day.isFuture ? '' : `${day.date}: ${getIntensityLabel(day.hours)}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend + Total */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Less</span>
                    <div className="flex gap-[3px]">
                        {['bg-slate-100 dark:bg-slate-800/60', 'bg-emerald-200 dark:bg-emerald-900/60', 'bg-emerald-400 dark:bg-emerald-700', 'bg-emerald-500 dark:bg-emerald-500', 'bg-emerald-600 dark:bg-emerald-400'].map((cls, i) => (
                            <div key={i} className={`w-[13px] h-[13px] rounded-[3px] ${cls}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">More</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {totalHours.toFixed(1)}h total study time
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default StudyStreaks;
