import React from 'react';
import { motion } from 'framer-motion';
import { Flag, Star, Lock, CheckCircle2 } from 'lucide-react';

const MilestoneMap = ({ tasks = [], moduleName = "General Path" }) => {
    // Sort tasks by creation date to form a path
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // SVG Path Constants
    const width = 800;
    const height = 200;
    const padding = 100;
    const step = (width - 2 * padding) / Math.max(1, sortedTasks.length - 1);

    // Generate path points with some "waviness"
    const points = sortedTasks.map((task, i) => ({
        x: padding + i * step,
        y: height / 2 + Math.sin(i * 1.5) * 40,
        task
    }));

    // Generate SVG path string
    const pathD = points.reduce((acc, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        // Quadratic curve for smoothness
        const prev = points[i - 1];
        const cpX = (prev.x + point.x) / 2;
        return `${acc} Q ${cpX} ${prev.y}, ${point.x} ${point.y}`;
    }, "");

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{moduleName} Milestone Map</h3>
                    <p className="text-sm text-slate-500 font-medium">Your visual journey through this subject's objectives.</p>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-primary-500/10 text-primary-600 rounded-full border border-primary-500/20">
                    <Star size={16} className="fill-current" />
                    <span className="text-xs font-black uppercase tracking-widest">
                        {tasks.filter(t => t.status === 'Completed').length} / {tasks.length} Milestones
                    </span>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-10 custom-scrollbar">
                <svg width={width} height={height} className="min-w-[800px]">
                    {/* Background Path (Dotted) */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray="8 8"
                        className="text-slate-200 dark:text-slate-800"
                    />

                    {/* Progress Path (Solid) */}
                    <motion.path
                        d={pathD}
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                    </defs>

                    {/* Milestone Nodes */}
                    {points.map((point, i) => {
                        const isCompleted = point.task.status === 'Completed';
                        const isCurrent = !isCompleted && (i === 0 || points[i - 1].task.status === 'Completed');

                        return (
                            <g key={point.task.id}>
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    cx={point.x}
                                    cy={point.y}
                                    r={isCurrent ? "24" : "18"}
                                    className={`${isCompleted ? 'fill-indigo-500' : isCurrent ? 'fill-white dark:fill-slate-800' : 'fill-slate-100 dark:fill-slate-800'} stroke-[4] ${isCompleted ? 'stroke-indigo-200 dark:stroke-indigo-900' : isCurrent ? 'stroke-indigo-500' : 'stroke-slate-200 dark:stroke-slate-700'}`}
                                />

                                <foreignObject x={point.x - 10} y={point.y - 10} width="20" height="20" className="pointer-events-none">
                                    <div className="flex items-center justify-center text-white h-full">
                                        {isCompleted ? <CheckCircle2 size={12} /> : isCurrent ? <Flag size={12} className="text-indigo-500" /> : <Lock size={12} className="text-slate-400" />}
                                    </div>
                                </foreignObject>

                                {/* Label */}
                                <g transform={`translate(${point.x}, ${point.y + 45})`}>
                                    <text
                                        textAnchor="middle"
                                        className={`text-[10px] font-black uppercase tracking-widest ${isCompleted || isCurrent ? 'fill-slate-900 dark:fill-white' : 'fill-slate-400'}`}
                                    >
                                        {point.task.title.length > 15 ? point.task.title.substring(0, 12) + '...' : point.task.title}
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                        <Flag size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Next Objective: <span className="text-indigo-500">
                            {points.find(p => p.task.status !== 'Completed')?.task.title || 'Course Completed!'}
                        </span>
                    </span>
                </div>
                <button className="px-6 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:border-indigo-500 transition-all">
                    View Details
                </button>
            </div>
        </div>
    );
};

export default MilestoneMap;
