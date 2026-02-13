import React, { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';
import {
    moduleService,
    noteService,
    flashcardService,
    studyLogService,
    pomodoroService,
    taskService
} from '../services/firestoreService';
import {
    Zap,
    Share2,
    Target,
    Activity,
    Brain,
    Clock,
    TrendingUp,
    Map,
    Trophy,
    Boxes
} from 'lucide-react';
import { getModuleColor } from '../utils/colors';
import ForceGraph2D from 'react-force-graph-2d';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

const DeepAnalytics = () => {
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: notes } = useFirestore(noteService.getAll);
    const { data: flashcards } = useFirestore(flashcardService.getAll);
    const { data: pomodoros } = useFirestore(pomodoroService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);

    // 1. Efficiency Score Calculation
    const efficiencyScore = useMemo(() => {
        if (logs.length === 0) return 0;

        const totalHours = logs.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);
        const pomodoroHours = (pomodoros.length * 25) / 60;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;

        // Weight: Focus intensity (Pomodoros per Hour) * Output (Completed Tasks)
        // Normalized with a base
        const focusFactor = (pomodoroHours / (totalHours || 1)) * 100;
        const taskFactor = (completedTasks / (tasks.length || 1)) * 100;

        return Math.min(Math.round((focusFactor + taskFactor) / 2), 100);
    }, [logs, pomodoros, tasks]);

    const stats = useMemo(() => {
        const totalHours = logs.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);
        return { totalHours };
    }, [logs]);

    const knowledgeData = useMemo(() => {
        const nodes = [];
        const links = [];

        // Add modules as nodes
        modules.forEach(mod => {
            nodes.push({ id: mod.id, name: mod.name, group: 1 }); // Group 1 for modules
        });

        // Add notes as nodes and link to modules
        notes.forEach(note => {
            nodes.push({ id: note.id, name: note.title, group: 2 }); // Group 2 for notes
            if (note.moduleId) {
                links.push({ source: note.moduleId, target: note.id, value: 1 });
            }
        });

        // Add flashcards as nodes and link to modules
        flashcards.forEach(flashcard => {
            nodes.push({ id: flashcard.id, name: flashcard.question, group: 3 }); // Group 3 for flashcards
            if (flashcard.moduleId) {
                links.push({ source: flashcard.moduleId, target: flashcard.id, value: 1 });
            }
        });

        // Add tasks as nodes and link to modules
        tasks.forEach(task => {
            nodes.push({ id: task.id, name: task.title, group: 4 }); // Group 4 for tasks
            if (task.moduleId) {
                links.push({ source: task.moduleId, target: task.id, value: 1 });
            }
        });

        return { nodes, links };
    }, [modules, notes, flashcards, tasks]);

    const focusDistributionData = {
        labels: ['Deep Work', 'Shallow Work', 'Breaks'],
        datasets: [
            {
                data: [70, 20, 10], // Example data
                backgroundColor: ['#6366f1', '#a855f7', '#f87171'],
                borderColor: ['#6366f1', '#a855f7', '#f87171'],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Layout title="Deep Work Analytics">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Zap size={100} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/80">Efficiency Score</h3>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-5xl font-black tracking-tighter">{efficiencyScore}</span>
                                <span className="text-lg font-bold text-white/60 mb-1">/ 100</span>
                            </div>
                            <div className="mt-4 w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${efficiencyScore}%` }}
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                />
                            </div>
                            <p className="mt-3 text-xs font-medium text-white/60">Based on focus duration & task completion</p>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden group border-l-4 border-l-emerald-500">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Clock size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <Clock size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Focus Time</h3>
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {Math.floor(stats.totalHours)}<span className="text-xl text-slate-400 font-bold ml-1">h</span> {Math.round((stats.totalHours % 1) * 60)}<span className="text-xl text-slate-400 font-bold ml-1">m</span>
                        </h4>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg w-fit">
                            <TrendingUp size={14} />
                            <span>+12% vs last week</span>
                        </div>
                    </Card>

                    <Card className="relative overflow-hidden group border-l-4 border-l-blue-500">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                            <Brain size={80} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Brain size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Knowledge Nodes</h3>
                        </div>
                        <h4 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {knowledgeData.nodes.length}
                        </h4>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg w-fit">
                            <Share2 size={14} />
                            <span>{knowledgeData.links.length} Connections</span>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                    <Card
                        className="lg:col-span-2 overflow-hidden flex flex-col p-0 border-0 shadow-2xl"
                        noPadding
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10 relative">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                                    <Map size={18} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Knowledge Graph</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Memory Network Visualization</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/5 rounded-full border border-indigo-500/10">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modules</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative bg-slate-950">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
                            <ForceGraph2D
                                graphData={knowledgeData}
                                nodeLabel="name"
                                nodeColor={node => node.group === 1 ? '#6366f1' : '#10b981'}
                                linkColor={() => '#334155'}
                                backgroundColor="rgba(0,0,0,0)"
                                nodeRelSize={6}
                                linkWidth={1}
                                linkDirectionalParticles={2}
                                linkDirectionalParticleSpeed={d => d.value * 0.001}
                            />
                        </div>
                    </Card>

                    <div className="space-y-6 flex flex-col">
                        <Card title="Focus Distribution" className="flex-1" HeaderAction={<Brain size={18} className="text-purple-500" />}>
                            <div className="h-full min-h-[200px] flex items-center justify-center relative">
                                <Doughnut
                                    data={focusDistributionData}
                                    options={{
                                        cutout: '70%',
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                                labels: {
                                                    usePointStyle: true,
                                                    padding: 20,
                                                    font: { size: 10, family: 'Inter', weight: '700' },
                                                    color: '#94a3b8'
                                                }
                                            }
                                        }
                                    }}
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-900 dark:text-white">100%</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Effort</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Activity size={60} />
                            </div>
                            <h4 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-2">Top Performer</h4>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                    <Trophy size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="font-black text-lg">Deep Work Session</p>
                                    <p className="text-xs text-slate-400 font-bold">+450 XP Gained</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {modules.map(mod => {
                        const modTasks = tasks.filter(t => t.moduleId === mod.id);
                        const completed = modTasks.filter(t => t.status === 'Completed').length;

                        // Weighted average of activity calculation
                        const modLogs = logs.filter(l => l.moduleId === mod.id);
                        const now = new Date();
                        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

                        const recentHours = modLogs
                            .filter(l => new Date(l.date) >= oneWeekAgo)
                            .reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);

                        const previousHours = modLogs
                            .filter(l => new Date(l.date) >= twoWeeksAgo && new Date(l.date) < oneWeekAgo)
                            .reduce((sum, l) => sum + parseFloat(l.hours || 0), 0);

                        const velocity = previousHours === 0
                            ? (recentHours > 0 ? 100 : 0)
                            : Math.round(((recentHours - previousHours) / previousHours) * 100);

                        const progress = modTasks.length > 0 ? (completed / modTasks.length) * 100 : 0;

                        return (
                            <Card key={mod.id} title={mod.name} className="dark:bg-slate-800">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500">Mastery Velocity</span>
                                        <span className={`font-bold ${velocity >= 0 ? 'text-primary-500' : 'text-red-500'}`}>
                                            {velocity >= 0 ? '+' : ''}{velocity}% this week
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%`, backgroundColor: getModuleColor(mod.id) }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <Boxes size={12} />
                                        <span>Associated items: {notes.filter(n => n.moduleId === mod.id).length} Notes, {flashcards.filter(f => f.moduleId === mod.id).length} Cards</span>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </Layout>
    );
};

export default DeepAnalytics;
