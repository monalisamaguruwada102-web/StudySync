import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, taskService, studyLogService } from '../services/firestoreService';
import {
    BookOpen,
    Target,
    Calendar,
    Clock,
    CheckCircle2,
    Circle,
    ArrowLeft,
    Wand2,
    TrendingUp,
    Play
} from 'lucide-react';
import { motion } from 'framer-motion';

const ModuleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: modules, loading: modulesLoading } = useFirestore(moduleService.getAll);
    const { data: allTasks, loading: tasksLoading } = useFirestore(taskService.getAll);
    const { data: allLogs, loading: logsLoading } = useFirestore(studyLogService.getAll);

    const module = useMemo(() => modules.find(m => m.id === id), [modules, id]);
    const tasks = useMemo(() => allTasks.filter(t => t.moduleId === id), [allTasks, id]);
    const logs = useMemo(() => allLogs.filter(l => l.moduleId === id), [allLogs, id]);

    const stats = useMemo(() => {
        if (!module) return { progress: 0, hours: 0, completedTasks: 0 };
        const total = parseFloat(module.totalHoursStudied || 0);
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const progress = module.targetHours > 0 ? (total / module.targetHours) * 100 : 0;
        return {
            progress: Math.min(progress, 100).toFixed(0),
            hours: total.toFixed(1),
            completedTasks: completed,
            totalTasks: tasks.length
        };
    }, [module, tasks, logs]);

    if (modulesLoading) return <Layout title="Loading..."><div className="flex items-center justify-center h-64 text-slate-400">Loading module data...</div></Layout>;
    if (!module) return <Layout title="Not Found"><div className="text-center py-12">Module not found. <Button onClick={() => navigate('/modules')}>Go Back</Button></div></Layout>;

    return (
        <Layout title={module.name}>
            {/* Header / Back Button */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/50 dark:bg-slate-800 rounded-2xl hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{module.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed progress and study metrics</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Wand2 size={18} />
                        <span>AI Study Guide</span>
                    </Button>
                    <Button variant="primary" className="flex items-center gap-2" onClick={() => navigate('/logs')}>
                        <Play size={18} fill="currentColor" />
                        <span>Start Session</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content (Left Column) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Overview Card */}
                    <Card className="relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl -mr-20 -mt-20 rounded-full" />

                        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="relative w-32 h-32 flex-shrink-0">
                                <svg className="w-full h-full" viewBox="0 0 100 100">
                                    <circle className="text-slate-100 dark:text-slate-800" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                    <motion.circle
                                        className="text-primary-500"
                                        strokeWidth="8"
                                        strokeDasharray={251.2}
                                        initial={{ strokeDashoffset: 251.2 }}
                                        animate={{ strokeDashoffset: 251.2 - (251.2 * stats.progress / 100) }}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                        r="40"
                                        cx="50"
                                        cy="50"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.progress}%</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target Hours</p>
                                        <div className="flex items-center gap-2">
                                            <Target size={18} className="text-primary-500" />
                                            <span className="text-xl font-bold">{module.targetHours}h</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Studied</p>
                                        <div className="flex items-center gap-2">
                                            <Clock size={18} className="text-blue-500" />
                                            <span className="text-xl font-bold">{stats.hours}h</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Task Completion</p>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-green-500" />
                                            <span className="text-xl font-bold">{stats.completedTasks}/{stats.totalTasks}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Study Streak</p>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={18} className="text-orange-500" />
                                            <span className="text-xl font-bold">12 Days</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Pending Tasks Section */}
                    <Card title="Module Learning Path" HeaderAction={<Calendar size={18} className="text-slate-400" />}>
                        <div className="space-y-3">
                            {tasks.length > 0 ? tasks.map((task, idx) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`flex items-center justify-between p-4 rounded-2xl border ${task.status === 'Completed' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100/50 dark:border-green-900/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={task.status === 'Completed' ? 'text-green-500' : 'text-slate-300'}>
                                            {task.status === 'Completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold ${task.status === 'Completed' ? 'text-green-700 dark:text-green-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</h4>
                                            <p className="text-[10px] font-medium text-slate-500">Due: {task.dueDate || 'No date'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{task.priority}</span>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-12 text-slate-400 italic text-sm">No tasks created for this module yet.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Sidebar (Right Column) */}
                <div className="space-y-6">
                    <Card title="About Module" HeaderAction={<BookOpen size={18} className="text-primary-500" />}>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {module.description || "No description provided for this module."}
                        </p>
                    </Card>

                    <Card title="Study History">
                        <div className="space-y-4">
                            {logs.slice(0, 5).map((log, idx) => (
                                <div key={log.id} className="flex items-center gap-3 relative pb-4 last:pb-0">
                                    {idx !== logs.slice(0, 5).length - 1 && (
                                        <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 flex-shrink-0">
                                        <Clock size={12} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.hours} Hours</p>
                                            <span className="text-[10px] text-slate-400 font-medium">{log.date}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{log.topic || 'General Study'}</p>
                                    </div>
                                </div>
                            ))}
                            {logs.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic text-xs">No study logs yet.</div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default ModuleDetail;
