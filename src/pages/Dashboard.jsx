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
import JourneyMap from '../components/dashboard/JourneyMap';
import FocusRadar from '../components/dashboard/FocusRadar';
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
    HelpCircle,
    Map
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
import { getModuleColor } from '../utils/colors';

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

const DashboardHeader = ({ user }) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
                {greeting}, <span className="text-primary-600 dark:text-primary-400">{user?.name || 'Student'}</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Here's your academic progress overview for today.
            </p>
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
    const [cloudEvents, setCloudEvents] = React.useState([]);
    const [isSyncingCloud, setIsSyncingCloud] = React.useState(false);

    const fetchCloudEvents = async () => {
        try {
            const settingsRes = await api.get('/user/settings');
            const url = settingsRes.data.calendar_sync_url;
            if (!url) return;

            setIsSyncingCloud(true);
            const response = await api.post('/sync/calendar', { url });
            // Get only upcoming events, limit to 4
            const upcoming = response.data
                .filter(e => new Date(e.start) >= new Date())
                .sort((a, b) => new Date(a.start) - new Date(b.start))
                .slice(0, 4);
            setCloudEvents(upcoming);
        } catch (error) {
            console.error('Failed to fetch cloud events:', error);
        } finally {
            setIsSyncingCloud(false);
        }
    };

    React.useEffect(() => {
        fetchCloudEvents();
    }, []);

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
                backgroundColor: stats.moduleData.map((m, i) => getModuleColor(m.id, i)),
                borderWidth: 0,
            },
        ],
    };

    return (
        <Layout title="Dashboard">
            <DashboardHeader user={user} />
            {/* Elite League Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl ${league.bg} ${league.border} ${league.glow || ''}`}
            >
                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${league.color}`}>
                        <Trophy size={32} className="drop-shadow-[0_0_10px_currentColor]" />
                    </div>
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${league.color}`}>{league.name} League</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[8px] font-bold text-white/60">Ranked</span>
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight">Level {user?.level || 1} Elite</h2>
                    </div>
                </div>

                <div className="flex items-center gap-8 lg:gap-12">
                    <div className="text-center">
                        <span className="block text-xl font-black text-white">{user?.xp || 0}</span>
                        <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Current XP</span>
                    </div>
                    <div className="text-center hidden sm:block">
                        <span className="block text-xl font-black text-white">Top 5%</span>
                        <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider">Global Rank</span>
                    </div>
                    <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                    <div className="flex flex-col gap-2 min-w-[120px]">
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                            <span className="text-white/40">Next Level</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon={<Target className="text-primary-500" />}
                    label="Today's Goal"
                    value={`${stats.todayHours.toFixed(1)} / ${(user?.settings?.dailyStudyTarget || 2)}h`}
                    trend="Daily progress"
                    onClick={() => navigate('/logs')}
                />
                <StatCard
                    icon={<Clock className="text-blue-500" />}
                    label="Remaining Study"
                    value={`${stats.totalRemaining.toFixed(1)}h`}
                    trend="To complete targets"
                    onClick={() => navigate('/modules')}
                />
                <StatCard
                    icon={<Layers className="text-purple-500" />}
                    label="Active Modules"
                    value={stats.activeModules}
                    trend="Currently enrolled"
                    onClick={() => navigate('/modules')}
                />
                <StatCard
                    icon={<Award className="text-pink-500" />}
                    label="Study Streak"
                    value={`${stats.streak} Days`}
                    trend="Keep it going!"
                    onClick={() => navigate('/logs')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Visual Journey Map (Replaces simple Heatmap) */}
                <Card
                    title="My Learning Journey"
                    className="lg:col-span-2 min-h-[400px]"
                    HeaderAction={
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg uppercase tracking-wider">
                            <Map size={14} />
                            <span>Campaign Mode</span>
                        </div>
                    }
                >
                    <JourneyMap />
                </Card>

                {/* Focus Profile & Badges */}
                <div className="space-y-6">
                    <Card title="Focus DNA" HeaderAction={<Brain size={18} className="text-purple-500" />}>
                        <div className="h-64">
                            <FocusRadar />
                        </div>
                        <div className="mt-2 text-center text-xs text-slate-400">
                            Analysis based on study patterns
                        </div>
                    </Card>

                    <Card title="Achievements">
                        <div className="grid grid-cols-2 gap-4">
                            {stats.badges.length > 0 ? stats.badges.map(badge => {
                                const Icon = badge.icon === 'Zap' ? Zap :
                                    badge.icon === 'Flame' ? Flame :
                                        badge.icon === 'Target' ? Target : Award;
                                return (
                                    <AnimatedBadge
                                        key={badge.name}
                                        name={badge.name}
                                        icon={Icon}
                                        color={badge.color}
                                    />
                                );
                            }) : (
                                <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <Trophy size={24} className="mx-auto mb-2 text-slate-300 opacity-20" />
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">No Badges Yet</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Cloud Schedule Card */}
                    {cloudEvents.length > 0 && (
                        <Card
                            title="Cloud Schedule"
                            HeaderAction={<Cloud size={18} className={`text-blue-500 ${isSyncingCloud ? 'animate-pulse' : ''}`} />}
                        >
                            <div className="space-y-3">
                                {cloudEvents.map(event => (
                                    <div key={event.id} className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl hover:bg-blue-500/10 transition-colors cursor-default">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <h4 className="text-[11px] font-black text-slate-800 dark:text-slate-100 truncate uppercase tracking-wider">{event.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                                                        {new Date(event.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="text-[9px] font-medium text-slate-400">
                                                        {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
                                                <Calendar size={12} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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

const StatCard = ({ icon, label, value, trend, onClick }) => (
    <Card
        className={`hover:shadow-md transition-shadow group relative overflow-hidden ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
        onClick={onClick}
    >
        <div className="relative z-10">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-wider mb-0.5">{label}</p>
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</h3>
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
