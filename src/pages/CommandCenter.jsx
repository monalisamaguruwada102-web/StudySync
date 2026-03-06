import React, { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';
import { taskService, moduleService } from '../services/firestoreService';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Target, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

const CommandCenter = () => {
    const { data: tasks, loading: loadingTasks } = useFirestore(taskService.getAll);
    const { data: modules, loading: loadingModules } = useFirestore(moduleService.getAll);

    const urgentTasks = useMemo(() => {
        if (!tasks) return [];
        const now = new Date();
        return tasks
            .filter(t => t.status !== 'Completed' && t.dueDate)
            .map(t => {
                const due = new Date(t.dueDate);
                const diffTime = due - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return { ...t, daysLeft: diffDays };
            })
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [tasks]);

    const getUrgencyColor = (days) => {
        if (days <= 0) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (days <= 3) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        if (days <= 7) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    };

    const getUrgencyLevel = (days) => {
        if (days <= 0) return 'CRITICAL';
        if (days <= 3) return 'HIGH URGENCY';
        if (days <= 7) return 'MODERATE';
        return 'STABLE';
    };

    if (loadingTasks || loadingModules) return <Layout title="Command Center">Loading Command Center...</Layout>;

    return (
        <Layout title="Command Center">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 flex items-center gap-3">
                            <ShieldAlert className="text-red-500" size={32} />
                            Academy Command Center
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Strategic overview of your academic deadlines and focus priorities.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800">
                        <div className="px-6 py-3 bg-red-500 text-white rounded-[1.5rem] shadow-lg shadow-red-500/30">
                            <span className="text-[10px] font-black uppercase tracking-widest block opacity-70">Overdue</span>
                            <span className="text-xl font-black">{urgentTasks.filter(t => t.daysLeft < 0).length}</span>
                        </div>
                        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-[1.5rem]">
                            <span className="text-[10px] font-black uppercase tracking-widest block opacity-50">Active Focus</span>
                            <span className="text-xl font-black">{urgentTasks.length}</span>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Deadlines Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Priority Deadline Feed" HeaderAction={<AlertTriangle className="text-orange-500" />}>
                            <div className="space-y-4">
                                {urgentTasks.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 italic">No active deadlines recorded.</div>
                                ) : (
                                    urgentTasks.map((task, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={task.id}
                                            className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-[2rem] hover:shadow-2xl hover:border-primary-500/30 transition-all cursor-default"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${getUrgencyColor(task.daysLeft)}`}>
                                                    <span className="text-xl font-black leading-none">{Math.abs(task.daysLeft)}</span>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Days {task.daysLeft < 0 ? 'Ago' : ''}</span>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary-500">
                                                            {modules.find(m => m.id === task.moduleId)?.name || 'General Task'}
                                                        </span>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${getUrgencyColor(task.daysLeft)}`}>
                                                            {getUrgencyLevel(task.daysLeft)}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{task.title}</h3>
                                                </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 flex items-center gap-3">
                                                <div className="text-right hidden md:block">
                                                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</span>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{task.dueDate}</span>
                                                </div>
                                                <div className="p-3 rounded-full bg-slate-50 dark:bg-slate-700/50 text-slate-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Strategic Stats */}
                    <div className="space-y-8">
                        <Card title="Strategic Status">
                            <div className="space-y-6">
                                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl text-white relative overflow-hidden shadow-2xl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 blur-[60px] rounded-full -mr-16 -mt-16" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-6">Combat Readiness</h4>

                                    <div className="space-y-4">
                                        {[
                                            { label: 'Exam Prep', value: 65, color: 'bg-green-500' },
                                            { label: 'Note Mastery', value: 42, color: 'bg-blue-500' },
                                            { label: 'Focus Score', value: 88, color: 'bg-purple-500' }
                                        ].map(stat => (
                                            <div key={stat.label}>
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                                    <span>{stat.label}</span>
                                                    <span className="text-white/70">{stat.value}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${stat.value}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className={`h-full ${stat.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-primary-500/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-primary-500" />
                                            <span className="text-xs font-bold dark:text-white">Smart Revision Schedule</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-primary-500/50 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={16} className="text-blue-500" />
                                            <span className="text-xs font-bold dark:text-white">Generate Exam Roadmap</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-primary-500/10 border border-primary-500/20 rounded-[2.5rem] relative overflow-hidden group">
                            <div className="relative z-10">
                                <Target className="text-primary-500 mb-4 group-hover:scale-110 transition-transform" size={32} />
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Focus Recommendation</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Based on your current deadlines, we recommend prioritizing **{urgentTasks[0]?.title || 'Module Organization'}** today.
                                </p>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/5 blur-[80px] rounded-full pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CommandCenter;
