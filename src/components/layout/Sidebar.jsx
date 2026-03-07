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
    Sparkles,
    MessageCircle,
    Youtube,
    Code2
} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { usePresence } from '../../hooks/usePresence';
import useChat from '../../hooks/useChat';
import PomodoroTimer from '../PomodoroTimer';
import MusicPlayer from './MusicPlayer';
import { navGroups } from '../../data/navigation';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { onlineUsers = [] } = usePresence();
    const { unreadCounts = {} } = useChat();
    const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + (c || 0), 0);

    const nextLevelXP = (user?.level || 1) * 1000;
    const xpPercentage = Math.min(((user?.xp || 0) / nextLevelXP) * 100, 100);

    return (
        <>
            {/* Mobile Backdrop */}
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
                `}
            >
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Logo Section */}
                <div className="p-5 flex items-center gap-3 relative z-10 shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 relative overflow-hidden">
                        <GraduationCap size={22} className="relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                    </div>
                    <div>
                        <span className="text-xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                            StudySync
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                            <Sparkles size={9} className="text-primary-500" />
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Premium</span>
                        </div>
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className="mx-3 mb-3 p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg relative overflow-hidden group shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg text-white shadow-md shadow-primary-500/30">
                                    <Trophy size={13} />
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                    Level {user?.level || 1}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                {user?.xp || 0} / {nextLevelXP} XP
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                                style={{ width: `${xpPercentage}%` }}
                            />
                        </div>
                        {user?.badges && user.badges.length > 0 && (
                            <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                                {user.badges.map((badge, index) => (
                                    <span
                                        key={typeof badge === 'object' ? badge.name : `${badge}-${index}`}
                                        className="flex-shrink-0 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-md text-[9px] font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1"
                                    >
                                        <Star size={9} className="text-yellow-500" fill="currentColor" />
                                        {typeof badge === 'object' ? badge.name : badge}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Groups - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0 relative z-10 px-3 space-y-3 pb-2">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="px-2 mb-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {group.title}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => onClose && onClose()}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                                            group relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 text-primary-600 dark:text-primary-400 font-bold'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                                            }
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className={`relative z-10 ${isActive ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text` : ''}`}>
                                                    <item.icon size={17} />
                                                </div>
                                                <span className="relative z-10 text-[13px]">{item.label}</span>
                                                {/* Chat badge */}
                                                {item.label === 'Chat' && totalUnread > 0 && (
                                                    <span className="ml-auto relative z-10 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                        {totalUnread > 99 ? '99+' : totalUnread}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Study Buddies Section */}
                    <div>
                        <h3 className="px-2 mb-1 text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Study Buddies
                        </h3>
                        <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                            {onlineUsers.filter(u => u.id !== user?.id).length === 0 ? (
                                <div className="p-3 text-[10px] text-slate-400 italic text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    No buddies online yet
                                </div>
                            ) : (
                                onlineUsers.filter(u => u.id !== user?.id).map((buddy) => (
                                    <div key={buddy.id} className="flex items-center gap-2 p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all">
                                        <div className="relative">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                                                {buddy.avatar_url ? (
                                                    <img src={buddy.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    buddy.name?.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-800 rounded-full" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{buddy.name}</span>
                                            <span className="text-[9px] text-slate-400 truncate">{buddy.activity || 'Online'}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Music Player & Timer - pinned above logout */}
                <div className="shrink-0 relative z-10 px-3 py-2 border-t border-slate-200/50 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col gap-2">
                    <MusicPlayer compact />
                    <PomodoroTimer compact />
                </div>

                {/* Logout Button */}
                <div className="shrink-0 p-3 border-t border-slate-200/50 dark:border-slate-700/50 relative z-10 bg-white dark:bg-slate-900">
                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-300 font-semibold group"
                    >
                        <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
