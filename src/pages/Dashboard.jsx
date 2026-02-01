import React, { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, studyLogService, taskService } from '../services/firestoreService';
import { useAnalytics } from '../hooks/useAnalytics';
import Heatmap from '../components/analytics/Heatmap';
import { useAuth } from '../context/AuthContext';
import { getLeague } from '../utils/gamification';
import AnimatedBadge from '../components/ui/AnimatedBadge';
import HelpModal from '../components/dashboard/HelpModal';
import KnowledgeGraph from '../components/analytics/KnowledgeGraph';
import {
    Clock,
    Layers,
    Calendar,
    TrendingUp,
    Award,
    Zap,
    Trophy,
    Flame,
    Target,
    Brain,
    HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const WelcomeMarquee = ({ user }) => {
    const navItems = [
        'Dashboard', 'Modules', 'Study Logs', 'Kanban',
        'Deep Analytics', 'Deep Focus', 'Notes', 'Grades',
        'Flashcards', 'Calendar', 'Analytics', 'Settings'
    ];

    const marqueeText = `Welcome, ${user?.name || 'Student'}! • ${navItems.join(' • ')} • `;

    return (
        <div className="mb-6 py-3 bg-white/5 dark:bg-slate-900/50 backdrop-blur-md border-y border-slate-200/50 dark:border-slate-800/50 overflow-hidden relative group">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10" />

            <motion.div
                initial={{ x: "0%" }}
                animate={{ x: "-50%" }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="flex whitespace-nowrap gap-4"
            >
                <span className="text-sm font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                    {marqueeText.repeat(4)}
                </span>
            </motion.div>
        </div>
    );
};

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);

    const stats = useAnalytics(logs, modules, tasks);
    const league = useMemo(() => getLeague(user?.level || 1), [user?.level]);

    const barData = {
        labels: stats.weeklyTrend.map(d => d.day),
        datasets: [
            {
                label: 'Study Hours',
                data: stats.weeklyTrend.map(d => d.hours),
                backgroundColor: '#3b82f6',
                borderRadius: 8,
            },
        ],
    };

    const doughnutData = {
        labels: stats.moduleData.map(m => m.name),
        datasets: [
            {
                label: 'Hours per Module',
                data: stats.moduleData.map(m => m.hours),
                backgroundColor: [
                    '#3b82f6',
                    '#60a5fa',
                    '#93c5fd',
                    '#bfdbfe',
                    '#dbeafe',
                ],
                borderWidth: 0,
            },
        ],
    };

    return (
        <Layout title="Dashboard">
            <WelcomeMarquee user={user} />
            {/* Elite League Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl ${league.bg} ${league.border} ${league.glow || ''}`}
            >
                <div className="flex items-center gap-6 text-center md:text-left">
                    <div className={`p-5 rounded-2xl bg-white/5 border border-white/10 ${league.color}`}>
                        <Trophy size={40} className="drop-shadow-[0_0_10px_currentColor]" />
                    </div>
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <span className={`text-xs font-black uppercase tracking-[0.3em] ${league.color}`}>{league.name} League</span>
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/60">Ranked</span>
                        </div>
                        <h2 className="text-3xl font-black text-white">Level {user?.level || 1} Elite</h2>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-center">
                        <span className="block text-2xl font-black text-white">{user?.xp || 0}</span>
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Current XP</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-black text-white">Top 5%</span>
                        <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Global Rank</span>
                    </div>
                    <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
                    <div className="flex flex-col gap-2 min-w-[150px]">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-white/40">Progress to Lvl {(user?.level || 1) + 1}</span>
                            <span className="text-white">65%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className={`h-full ${league.color.replace('text', 'bg')}`}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Help Button */}
            <div className="mb-6">
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 font-semibold text-sm"
                >
                    <HelpCircle size={18} />
                    How to use Study Assistance
                </button>
            </div>

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<Clock className="text-blue-500" />}
                    label="Total Hours"
                    value={stats.totalHours.toFixed(1)}
                    trend="+12% from last week"
                />
                <StatCard
                    icon={<Layers className="text-purple-500" />}
                    label="Active Modules"
                    value={stats.activeModules}
                    trend="Currently enrolled"
                />
                <StatCard
                    icon={<Calendar className="text-orange-500" />}
                    label="Pending Tasks"
                    value={stats.pendingTasks}
                    trend="Next due tomorrow"
                />
                <StatCard
                    icon={<Award className="text-pink-500" />}
                    label="Study Streak"
                    value={`${stats.streak} Days`}
                    trend="Keep it going!"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Visual Data Map Placeholder (Heatmap) */}
                <Card title="Study Intensity (Last 365 Days)" className="lg:col-span-2">
                    <Heatmap logs={logs} />
                </Card>

                {/* Achievement Badges & Knowledge Graph */}
                <div className="space-y-6">
                    <Card title="Knowledge Map" HeaderAction={<Brain size={18} className="text-primary-500" />}>
                        <div className="py-2">
                            <KnowledgeGraph modules={modules} logs={logs} />
                            <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Coverage</span>
                                <span className="text-primary-500">{((modules.length * 100) / 10).toFixed(0)}%</span>
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 ml-2">Recent Badges</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <AnimatedBadge name="Early Bird" icon={Zap} color="primary" />
                            <AnimatedBadge name="Persistence" icon={Flame} color="purple" />
                            <AnimatedBadge name="Scholar" icon={Target} color="gold" />
                            <AnimatedBadge name="Focus King" icon={Award} color="green" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Weekly Study Trend" className="lg:col-span-2">
                    <div className="h-[300px]">
                        <Bar
                            data={barData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
                                        bodyColor: isDarkMode ? '#f8fafc' : '#0f172a',
                                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                        borderWidth: 1
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
                                        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
                                    }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card title="Module Distribution">
                    <div className="h-[300px] flex items-center justify-center">
                        {stats.moduleData.length > 0 ? (
                            <Doughnut
                                data={doughnutData}
                                options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: { color: isDarkMode ? '#f8fafc' : '#0f172a' }
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <p className="text-slate-400 italic">No data available yet</p>
                        )}
                    </div>
                </Card>
            </div>

            <div className="mt-8">
                <Card title="Upcoming Assignments & Tasks">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 dark:text-slate-500 text-sm uppercase tracking-wider">
                                    <th className="pb-4 font-medium">Task</th>
                                    <th className="pb-4 font-medium">Module</th>
                                    <th className="pb-4 font-medium">Due Date</th>
                                    <th className="pb-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {tasks.slice(0, 5).map((task) => (
                                    <tr key={task.id} className="text-slate-700 dark:text-slate-300">
                                        <td className="py-4 font-medium">{task.title}</td>
                                        <td className="py-4 text-sm">{modules.find(m => m.id === task.moduleId)?.name || 'Unknown'}</td>
                                        <td className="py-4 text-sm">{task.dueDate}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-400 italic">No tasks found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

const StatCard = ({ icon, label, value, trend }) => (
    <Card className="hover:shadow-md transition-shadow group relative overflow-hidden">
        <div className="relative z-10">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</h3>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
                    {React.cloneElement(icon, { size: 18 })}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-slate-500 dark:text-slate-400 tracking-wider uppercase">{trend}</span>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors" />
    </Card>
);

export default Dashboard;
