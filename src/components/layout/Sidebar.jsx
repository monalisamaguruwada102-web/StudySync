import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    History,
    CheckSquare,
    FileText,
    TrendingUp,
    LogOut,
    GraduationCap,
    Calculator,
    Brain,
    CalendarDays,
    CalendarCheck,
    Settings,
    Trophy,
    Star,
    Columns,
    Database,
    Activity,
    Users // Added Users icon
} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import PomodoroTimer from '../PomodoroTimer';

import MusicPlayer from './MusicPlayer';

const Sidebar = () => {
    const { user } = useAuth();
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Users, label: 'Community', path: '/community' },
        { icon: BookOpen, label: 'Modules', path: '/modules' },
        { icon: History, label: 'Study Logs', path: '/logs' },
        { icon: Columns, label: 'Kanban', path: '/kanban' },
        { icon: Database, label: 'SQL Architect', path: '/sql' },
        { icon: Activity, label: 'Deep Focus', path: '/deep-analytics' },
        { icon: CalendarCheck, label: 'Auto Planner', path: '/planner' },
        { icon: FileText, label: 'Notes', path: '/notes' },
        { icon: Calculator, label: 'Grades', path: '/grades' },
        { icon: Brain, label: 'Flashcards', path: '/flashcards' },
        { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
        { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const nextLevelXP = (user?.level || 1) * 1000;
    const xpPercentage = ((user?.xp || 0) / nextLevelXP) * 100;

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
                    <GraduationCap size={24} />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400">
                    StudySync
                </span>
            </div>

            <div className="mx-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                            <Trophy size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Level {user?.level || 1}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{user?.xp || 0} / {nextLevelXP} XP</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-1000"
                        style={{ width: `${xpPercentage}%` }}
                    />
                </div>
                {user?.badges && user.badges.length > 0 && (
                    <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
                        {user.badges.map(badge => (
                            <span key={badge} className="flex-shrink-0 px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                <Star size={8} className="text-yellow-500" />
                                {badge}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <nav className="flex-1 px-4 py-0 space-y-1 overflow-y-auto no-scrollbar">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'}
            `}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <MusicPlayer />
            <PomodoroTimer />

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside >
    );
};

export default Sidebar;
