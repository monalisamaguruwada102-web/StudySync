import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, Star, ChevronRight } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { moduleService, taskService } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const JourneyMap = () => {
    const navigate = useNavigate();
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);

    const timelineData = useMemo(() => {
        let firstIncompleteFound = false;

        const ordered = [...modules].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

        return ordered.map((mod, index) => {
            const modTasks = tasks.filter(t => t.moduleId === mod.id);
            const isCompleted = modTasks.length > 0 && modTasks.every(t => t.status === 'Completed');

            let isActive = false;
            let isLocked = false;

            if (!isCompleted && !firstIncompleteFound) {
                isActive = true;
                firstIncompleteFound = true;
            } else if (!isCompleted && firstIncompleteFound) {
                isLocked = true;
            }

            return { mod, id: mod.id, isCompleted, isActive, isLocked, index };
        });
    }, [modules, tasks]);

    if (modules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <Star size={32} className="opacity-20" />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">No learning data found</p>
            </div>
        );
    }

    return (
        <div className="relative p-2">
            {/* The Timeline Line */}
            <div className="absolute left-10 top-0 bottom-0 w-1 bg-slate-100 dark:bg-slate-800/50 rounded-full" />

            <div className="space-y-12 relative z-10">
                {timelineData.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-8 group"
                    >
                        {/* Status Icon Orb */}
                        <div className="relative flex-shrink-0 mt-2">
                            <motion.button
                                whileHover={!item.isLocked ? { scale: 1.1 } : {}}
                                whileTap={!item.isLocked ? { scale: 0.95 } : {}}
                                onClick={() => !item.isLocked && navigate(`/modules/${item.id}`)}
                                className={`
                                    w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative z-10
                                    transition-all duration-500
                                    ${item.isActive
                                        ? 'bg-gradient-to-br from-primary-500 via-indigo-600 to-purple-600 ring-4 ring-primary-500/20'
                                        : item.isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                            : 'bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700'
                                    }
                                `}
                            >
                                <div className="text-white">
                                    {item.isCompleted ? <Check size={32} strokeWidth={3} /> :
                                        item.isActive ? <Star size={32} fill="white" className="animate-pulse" /> :
                                            <Lock size={28} className="text-slate-400 dark:text-slate-600" />}
                                </div>

                                {/* Active Pulse */}
                                {item.isActive && (
                                    <div className="absolute inset-0 rounded-3xl bg-primary-500/40 animate-ping -z-10" />
                                )}
                            </motion.button>

                            {/* Connector Line Fill for Completed */}
                            {idx < timelineData.length - 1 && item.isCompleted && (
                                <div className="absolute left-1/2 -bottom-12 w-1 h-12 bg-green-500 -translate-x-1/2 -z-10" />
                            )}
                        </div>

                        {/* Content Card */}
                        <motion.div
                            onClick={() => !item.isLocked && navigate(`/modules/${item.id}`)}
                            className={`
                                flex-1 p-6 rounded-[2rem] border transition-all duration-300 group-hover:shadow-xl cursor-pointer
                                ${item.isActive
                                    ? 'bg-white dark:bg-slate-900 border-primary-500 shadow-lg shadow-primary-500/10'
                                    : 'bg-white/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800'
                                }
                            `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${item.isActive ? 'text-primary-500' : 'text-slate-400'}`}>
                                    {item.isCompleted ? 'Module Mastery' : item.isActive ? 'Active Mission' : 'Upcoming Stage'}
                                </span>
                                <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${item.isActive ? 'text-primary-500' : 'text-slate-400'}`} />
                            </div>

                            <h3 className={`text-xl font-black mb-2 tracking-tight ${item.isLocked ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                {item.mod.name}
                            </h3>

                            <div className="flex flex-wrap gap-4 mt-4">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-md ${item.isActive ? 'bg-primary-500/10 text-primary-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <Check size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tasks.filter(t => t.moduleId === item.id && t.status === 'Completed').length} Tasks Done</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-md ${item.isActive ? 'bg-primary-500/10 text-primary-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                        <Star size={12} />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.mod.targetHours}h Target</span>
                                </div>
                            </div>

                            {/* Mini Progress Bar */}
                            <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(tasks.filter(t => t.moduleId === item.id && t.status === 'Completed').length / Math.max(1, tasks.filter(t => t.moduleId === item.id).length)) * 100}%` }}
                                    className={`h-full rounded-full ${item.isCompleted ? 'bg-green-500' : 'bg-primary-500'}`}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default JourneyMap;
