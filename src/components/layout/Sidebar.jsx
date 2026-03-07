import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
    Settings,
    Trophy,
    Star,
    Columns,
    Database,
    Activity,
    Users,
    Zap,
    Sparkles
} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import PomodoroTimer from '../PomodoroTimer';
import MusicPlayer from './MusicPlayer';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/', gradient: 'from-blue-500 to-cyan-500' },
        { icon: BookOpen, label: 'Modules', path: '/modules', gradient: 'from-purple-500 to-pink-500' },
        { icon: History, label: 'Study Logs', path: '/logs', gradient: 'from-green-500 to-emerald-500' },
        { icon: Columns, label: 'Kanban', path: '/kanban', gradient: 'from-orange-500 to-red-500' },
        { icon: Activity, label: 'Deep Analytics', path: '/deep-analytics', gradient: 'from-indigo-500 to-purple-500' },
        { icon: Zap, label: 'Deep Focus', path: '/focus', gradient: 'from-yellow-500 to-orange-500' },
        { icon: FileText, label: 'Notes', path: '/notes', gradient: 'from-teal-500 to-cyan-500' },
        { icon: Calculator, label: 'Grades', path: '/grades', gradient: 'from-violet-500 to-purple-500' },
        { icon: Brain, label: 'Flashcards', path: '/flashcards', gradient: 'from-fuchsia-500 to-pink-500' },
        { icon: CalendarDays, label: 'Calendar', path: '/calendar', gradient: 'from-blue-500 to-indigo-500' },
        { icon: TrendingUp, label: 'Analytics', path: '/analytics', gradient: 'from-emerald-500 to-teal-500' },
        { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-slate-500 to-gray-500' },
    ];

    const nextLevelXP = (user?.level || 1) * 1000;
    const xpPercentage = ((user?.xp || 0) / nextLevelXP) * 100;

    return (
        <>
            {/* Mobile Backdrop with blur */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-30 lg:hidden"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            <aside
                className={`
                    w-64 max-w-[80vw]
                    bg-white dark:bg-slate-900
                    bg-gradient-to-b from-white via-slate-50/50 to-white
                    dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900
                    border-r border-slate-200/50 dark:border-slate-700/50
                    flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] fixed left-0 top-0 z-[60]
                    shadow-2xl shadow-slate-900/10 dark:shadow-black/50
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between gap-3 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 relative overflow-hidden">
                            <GraduationCap size={28} className="relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                        </div>
                        <div>
                            <span className="text-xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                                StudySync
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Sparkles size={10} className="text-primary-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Premium</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className="mx-4 mb-6 p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden group">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl text-white shadow-lg shadow-primary-500/30">
                                    <Trophy size={16} />
                                </div>
                                <span className="text-sm font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent uppercase tracking-wider">
                                    Level {user?.level || 1}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                {user?.xp || 0} / {nextLevelXP} XP
                            </span>
                        </div>

                        {/* Premium progress bar */}
                        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner relative">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-primary-500/50 relative transition-all duration-1000"
                                style={{ width: `${xpPercentage}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                            </div>
                        </div>

                        {user?.badges && user.badges.length > 0 && (
                            <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
                                {user.badges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="flex-shrink-0 px-2.5 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg text-[9px] font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1 shadow-sm"
                                    >
                                        <Star size={10} className="text-yellow-500" fill="currentColor" />
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-0 space-y-1.5 overflow-y-auto min-h-0 relative z-10">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose && onClose()}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300
                                group relative overflow-hidden
                                ${isActive
                                    ? 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 text-primary-600 dark:text-primary-400 font-bold shadow-lg shadow-primary-500/10'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:hover:from-slate-800 dark:hover:to-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    {/* Icon */}
                                    <div className={`relative z-10 ${isActive ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text` : ''}`}>
                                        <item.icon size={20} />
                                    </div>

                                    <span className="relative z-10 text-sm tracking-wide">{item.label}</span>

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/5 group-hover:to-purple-500/5 rounded-2xl transition-all duration-300" />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Music Player & Timer */}
                <div className="relative z-10">
                    <MusicPlayer />
                    <PomodoroTimer />
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 relative z-10">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 rounded-2xl transition-all duration-300 font-semibold group relative overflow-hidden"
                    >
                        <LogOut size={20} />
                        <span className="text-sm tracking-wide">Logout</span>

                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-300" />
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
