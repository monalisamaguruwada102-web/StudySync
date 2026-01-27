import React from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, studyLogService, taskService } from '../services/firestoreService';
import { useAnalytics } from '../hooks/useAnalytics';
import Heatmap from '../components/analytics/Heatmap';
import {
    Clock,
    Layers,
    Calendar,
    TrendingUp,
    Award
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

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);

    const stats = useAnalytics(logs, modules, tasks);

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

            <Card title="Study Intensity (Last 365 Days)" className="mb-6">
                <Heatmap logs={logs} />
            </Card>

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
    <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</h3>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                {icon}
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-slate-500 dark:text-slate-400">{trend}</span>
        </div>
    </Card>
);

export default Dashboard;
