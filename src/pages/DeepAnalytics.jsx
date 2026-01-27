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
    Link as LinkIcon,
    Circle,
    Boxes
} from 'lucide-react';

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

    // 2. Knowledge Map Data Generation
    const mapNodes = useMemo(() => {
        const nodes = [];
        const links = [];

        // Center: User node
        nodes.push({ id: 'user', type: 'user', label: 'My Brain', x: 400, y: 300 });

        modules.forEach((mod, modIdx) => {
            const angle = (modIdx / (modules.length || 1)) * 2 * Math.PI;
            const x = 400 + 150 * Math.cos(angle);
            const y = 300 + 150 * Math.sin(angle);

            nodes.push({ id: mod.id, type: 'module', label: mod.name, x, y });
            links.push({ source: 'user', target: mod.id });

            // Notes for this module
            const modNotes = notes.filter(n => n.moduleId === mod.id).slice(0, 3);
            modNotes.forEach((note, noteIdx) => {
                const subAngle = angle + (noteIdx - 1) * 0.3;
                nodes.push({
                    id: note.id,
                    type: 'note',
                    label: note.title,
                    x: x + 80 * Math.cos(subAngle),
                    y: y + 80 * Math.sin(subAngle)
                });
                links.push({ source: mod.id, target: note.id });
            });
        });

        return { nodes, links };
    }, [modules, notes]);

    return (
        <Layout title="Deep Work Analytics">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-gradient-to-br from-primary-600 to-primary-900 border-none text-white overflow-hidden relative">
                        <Zap size={120} className="absolute -bottom-8 -right-8 opacity-20 rotate-12" />
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70 mb-1">Efficiency Score</p>
                        <h2 className="text-5xl font-black mb-4">{efficiencyScore}%</h2>
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between text-xs font-bold">
                                <span>Focus Intensity</span>
                                <span className="opacity-80">High</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/20 rounded-full">
                                <div className="h-full bg-white rounded-full" style={{ width: `${efficiencyScore}%` }} />
                            </div>
                            <p className="text-[10px] italic leading-relaxed opacity-80">
                                Your productivity is 20% higher in the mornings.
                            </p>
                        </div>
                    </Card>

                    <Card title="Focus Breakdown">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Target size={14} className="text-primary-500" />
                                    <span className="text-slate-600 dark:text-slate-400">Total Pomodoros</span>
                                </div>
                                <span className="font-bold dark:text-slate-200">{pomodoros.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-green-500" />
                                    <span className="text-slate-600 dark:text-slate-400">Deep Work Time</span>
                                </div>
                                <span className="font-bold dark:text-slate-200">{Math.round((pomodoros.length * 25) / 60)}h</span>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="lg:col-span-3 overflow-hidden" HeaderAction={<Share2 size={18} className="text-slate-300" />}>
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Brain size={18} className="text-primary-500" />
                            Knowledge Graph
                        </h3>
                        <p className="text-xs text-slate-400">Visualization of semantic connections between your study resources.</p>
                    </div>

                    <div className="relative h-[500px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 600">
                            {/* Links */}
                            {mapNodes.links.map((link, i) => {
                                const source = mapNodes.nodes.find(n => n.id === link.source);
                                const target = mapNodes.nodes.find(n => n.id === link.target);
                                if (!source || !target) return null;
                                return (
                                    <line
                                        key={i}
                                        x1={source.x} y1={source.y} x2={target.x} y2={target.y}
                                        stroke="currentColor"
                                        className="text-slate-200 dark:text-slate-800"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                    />
                                );
                            })}

                            {/* Nodes */}
                            {mapNodes.nodes.map(node => (
                                <g key={node.id} className="cursor-pointer group">
                                    <circle
                                        cx={node.x} cy={node.y}
                                        r={node.type === 'user' ? 25 : node.type === 'module' ? 12 : 6}
                                        className={`${node.type === 'user' ? 'fill-primary-600 shadow-xl' :
                                                node.type === 'module' ? 'fill-primary-400 dark:fill-primary-500' : 'fill-slate-300 dark:fill-slate-600'
                                            }`}
                                    />
                                    <text
                                        x={node.x} y={node.y + (node.type === 'user' ? 45 : node.type === 'module' ? 25 : 15)}
                                        textAnchor="middle"
                                        className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 invisible group-hover:visible"
                                    >
                                        {node.label}
                                    </text>
                                </g>
                            ))}
                        </svg>

                        <div className="absolute top-4 right-4 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <Circle size={10} className="fill-primary-600 text-primary-600" />
                                <span className="text-slate-600 dark:text-slate-300">Core Knowledge</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <Circle size={10} className="fill-primary-400 text-primary-400" />
                                <span className="text-slate-600 dark:text-slate-300">Active Modules</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold">
                                <Circle size={10} className="fill-slate-300 text-slate-300" />
                                <span className="text-slate-600 dark:text-slate-300">Related Notes</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {modules.map(mod => {
                    const modTasks = tasks.filter(t => t.moduleId === mod.id);
                    const completed = modTasks.filter(t => t.status === 'Completed').length;
                    const progress = modTasks.length > 0 ? (completed / modTasks.length) * 100 : 0;

                    return (
                        <Card key={mod.id} title={mod.name} className="dark:bg-slate-800">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Mastery Velocity</span>
                                    <span className="font-bold text-primary-500">+{Math.round(progress)}% this week</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
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
        </Layout>
    );
};

export default DeepAnalytics;
