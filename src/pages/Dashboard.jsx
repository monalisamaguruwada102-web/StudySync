import React, { useMemo } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, studyLogService, taskService, pomodoroService } from '../services/firestoreService';
import { useAnalytics } from '../hooks/useAnalytics';
import Heatmap from '../components/analytics/Heatmap';
import { useAuth } from '../context/AuthContext';
import { getLeague } from '../utils/gamification';
import { useGamification } from '../hooks/useGamification';
import AnimatedBadge from '../components/ui/AnimatedBadge';
import HelpModal from '../components/dashboard/HelpModal';
import KnowledgeGraph from '../components/analytics/KnowledgeGraph';
import JourneyMap from '../components/dashboard/JourneyMap';
import FocusRadar from '../components/dashboard/FocusRadar';
import LoadingReactor from '../components/ui/LoadingReactor';
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
    Map,
    Cloud
} from 'lucide-react';
import api from '../services/api';
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
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';
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

import { Bell, X, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const DashboardHeader = ({ user }) => {
    const { notifications, unreadCount, markAllAsRead } = useNotification();
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
                    {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">{user?.name || 'Student'}</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    Here's your academic progress overview for today.
                </p>
            </div>

            <div className="relative">
                <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all relative"
                >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
                    )}
                </button>

                <AnimatePresence>
                    {isNotificationsOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-4 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 origin-top-right"
                        >
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} New</span>
                                    )}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={markAllAsRead}
                                        className="p-1.5 text-slate-400 hover:text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                                        title="Mark all as read"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsNotificationsOpen(false)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={`p-3 rounded-2xl border transition-all ${notif.read ? 'bg-white dark:bg-slate-900 border-transparent opacity-60' : 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-900/30'}`}>
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notif.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary-500'}`} />
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{notif.title || 'Notification'}</h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                                                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const { data: modules, loading: loadingModules } = useFirestore(moduleService.getAll);
    const { data: logs, loading: loadingLogs } = useFirestore(studyLogService.getAll);
    const { data: tasks, loading: loadingTasks } = useFirestore(taskService.getAll);
    const { data: sessions, loading: loadingSessions } = useFirestore(pomodoroService.getAll);
    const [isHelpOpen, setIsHelpOpen] = React.useState(false);
    const [cloudEvents, setCloudEvents] = React.useState([]);
    const [isSyncingCloud, setIsSyncingCloud] = React.useState(false);

    const loading = loadingModules || loadingLogs || loadingTasks || loadingSessions;

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

    const stats = useAnalytics(logs, modules, tasks, sessions);
    // Use persistent badges from hook, passing stats to trigger checks
    const { badges: persistentBadges } = useGamification(stats);

    const league = useMemo(() => getLeague(user?.level || 1), [user?.level]);

    const barData = {
        labels: stats.weeklyTrend.map(d => d.day),
        datasets: modules.map((mod, i) => ({
            label: mod.name,
            data: stats.weeklyTrend.map(d => d.moduleHours[mod.id] || 0),
            backgroundColor: getModuleColor(mod.id, i),
            borderRadius: 4,
        })),
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

    const levelProgress = useMemo(() => {
        if (!user?.xp) return 0;
        return (user.xp % 1000) / 10;
    }, [user?.xp]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-8">
                    <LoadingReactor size="lg" message="Synthesizing Academy Data..." />
                    <div className="w-full max-w-md">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            <span>Initializing Core Analytics</span>
                            <span>Synchronizing...</span>
                        </div>
                        <div className="loading-bar-container">
                            <motion.div
                                className="loading-bar-fill"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <DashboardHeader user={user} />
            {/* Elite League Banner */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-8 p-1 rounded-[2.5rem] bg-gradient-to-br ${league.gradient || 'from-slate-200 to-slate-100'} shadow-2xl relative overflow-hidden group`}
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay"></div>
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 h-full relative z-10">
                    <div className="flex items-center gap-6 text-center md:text-left">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-primary-500/40 relative overflow-hidden ${league.color.replace('text', 'bg').replace('-400', '-500')}`}>
                            <Trophy size={40} className="relative z-10 drop-shadow-md" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent" />
                        </div>
                        <div>
                            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                <span className={`text-xs font-black uppercase tracking-[0.25em] ${league.color}`}>{league.name} League</span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">Ranked</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tight">Level {user?.level || 1} Elite</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">You're in the top 5% of students this week.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-10 lg:gap-16">
                        <div className="text-center">
                            <span className="block text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user?.xp || 0}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Current XP</span>
                        </div>
                        <div className="h-12 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block" />
                        <div className="flex flex-col gap-3 min-w-[180px]">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-400">Progress to Level {(user?.level || 1) + 1}</span>
                                <span className="text-primary-500">{levelProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelProgress}%` }}
                                    className={`h-full bg-gradient-to-r ${league.gradient || 'from-primary-500 to-primary-400'} shadow-[0_0_20px_rgba(99,102,241,0.5)]`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Help Button */}
            <div className="mb-8 flex justify-end">
                <button
                    onClick={() => setIsHelpOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-full shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700 transition-all active:scale-95 font-bold text-xs uppercase tracking-wider hover:border-primary-500/30"
                >
                    <HelpCircle size={16} />
                    <span>Guide</span>
                </button>
            </div>

            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={<Target className="text-white" />}
                    iconColor="bg-blue-500 shadow-blue-500/30"
                    label="Today's Goal"
                    onClick={() => navigate('/logs')}
                    value={`${stats.todayHours.toFixed(1)} / ${(user?.settings?.dailyStudyTarget || 2)}h`}
                    trend="Daily progress"
                />
                <StatCard
                    icon={<Clock className="text-white" />}
                    iconColor="bg-indigo-500 shadow-indigo-500/30"
                    label="Remaining Study"
                    onClick={() => navigate('/modules')}
                    value={`${stats.totalRemaining.toFixed(1)}h`}
                    trend="To complete targets"
                />
                <StatCard
                    icon={<Layers className="text-white" />}
                    iconColor="bg-purple-500 shadow-purple-500/30"
                    label="Active Modules"
                    onClick={() => navigate('/modules')}
                    value={stats.activeModules}
                    trend="Currently enrolled"
                />
                <StatCard
                    icon={<Award className="text-white" />}
                    iconColor="bg-pink-500 shadow-pink-500/30"
                    label="Study Streak"
                    onClick={() => navigate('/logs')}
                    value={`${stats.streak} Days`}
                    trend="Keep it going!"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Visual Journey Map */}
                <Card
                    title="My Learning Journey"
                    className="lg:col-span-2 min-h-[450px]"
                    HeaderAction={
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest">
                            <Map size={14} />
                            View Map
                        </button>
                    }
                >
                    <JourneyMap />
                </Card>

                {/* Focus Profile & Badges */}
                <div className="space-y-8">
                    <Card title="Focus DNA" HeaderAction={<Brain size={18} className="text-purple-500" />}>
                        <div className="h-64 relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 pointer-events-none rounded-full" />
                            <FocusRadar stats={stats} />
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis based on study patterns</p>
                        </div>
                    </Card>

                    <Card title="Achievements">
                        <div className="grid grid-cols-2 gap-4">
                            {persistentBadges.length > 0 ? persistentBadges.map(badge => {
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
                                <div className="col-span-2 py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 group hover:border-primary-500/30 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Trophy size={24} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">No Badges Yet</p>
                                    <p className="text-xs text-slate-400 mt-1">Keep studying to unlock rewards!</p>
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
                                    <div key={event.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-2xl hover:shadow-lg hover:border-blue-500/30 transition-all cursor-default group">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                                        {new Date(event.start).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-500 transition-colors">{event.title}</h4>
                                                <span className="text-[10px] font-medium text-slate-400 mt-0.5 block">
                                                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-700/50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <Calendar size={14} />
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
                        <Line
                            data={{
                                ...barData,
                                datasets: barData.datasets.map((dataset, i) => ({
                                    ...dataset,
                                    fill: true,
                                    borderColor: dataset.backgroundColor,
                                    backgroundColor: (context) => {
                                        const ctx = context.chart.ctx;
                                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                                        const color = dataset.backgroundColor;
                                        gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
                                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                                        return gradient;
                                    },
                                    tension: 0.4,
                                    pointRadius: 4,
                                    pointHoverRadius: 6,
                                    borderWidth: 3
                                }))
                            }}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: 'top',
                                        labels: {
                                            usePointStyle: true,
                                            padding: 20,
                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                            font: { weight: 'bold' }
                                        }
                                    },
                                    tooltip: {
                                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                        titleColor: isDarkMode ? '#f8fafc' : '#0f172a',
                                        bodyColor: isDarkMode ? '#f8fafc' : '#0f172a',
                                        borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                        borderWidth: 1,
                                        padding: 12
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: isDarkMode ? '#334155' : '#f1f5f9' },
                                        ticks: {
                                            color: isDarkMode ? '#94a3b8' : '#64748b',
                                            callback: (value) => `${value}h`
                                        }
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

const StatCard = ({ icon, iconColor, label, value, trend, onClick }) => (
    <Card
        className={`hover:shadow-2xl transition-all duration-300 group relative overflow-hidden card-hover-effect ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
        onClick={onClick}
    >
        <div className="relative z-10">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-4 rounded-2xl text-white shadow-lg ${iconColor || 'bg-slate-500'} group-hover:scale-110 transition-transform duration-300`}>
                    {React.cloneElement(icon, { size: 20 })}
                </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-500">
                    <TrendingUp size={10} />
                </div>
                <span className="text-slate-500 dark:text-slate-400 tracking-wider uppercase">{trend}</span>
            </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />
    </Card>
);

export default Dashboard;
