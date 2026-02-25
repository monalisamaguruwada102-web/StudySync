import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogOut,
    GraduationCap,
    Trophy,
    Sparkles
} from 'lucide-react';
import { logout } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import useChat from '../../hooks/useChat';
import { usePresence } from '../../hooks/usePresence';
import PomodoroTimer from '../PomodoroTimer';
import MusicPlayer from './MusicPlayer';
import { navGroups } from '../../data/navigation';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { unreadCounts } = useChat();
    const { onlineUsers } = usePresence();

    const totalUnread = Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0);

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
                    lg:w-72 w-[85vw] max-w-sm
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl
                    border border-white/20 dark:border-white/10
                    flex flex-col fixed z-[100]
                    shadow-2xl shadow-black/20
                    transition-all duration-500 ease-[bezier(0.23,1,0.32,1)]
                    
                    /* Desktop: Floating Glass Panel */
                    lg:h-[calc(100vh-2rem)] lg:my-4 lg:ml-4 lg:rounded-[2.5rem]
                    lg:top-0 lg:left-0
                    
                    /* Mobile: Full Screen Drawer */
                    h-[100dvh] top-0 left-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Logo Section */}
                <div className="p-4 lg:p-6 flex items-center justify-between gap-3 relative z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                            <GraduationCap size={20} className="relative z-10 lg:w-6 lg:h-6" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                        </div>
                        <div>
                            <span className="text-lg lg:text-xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                                StudySync
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Sparkles size={8} className="text-primary-500" />
                                <span className="text-[8px] lg:text-[9px] font-bold text-slate-400 uppercase tracking-wider">Premium</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className="mx-3 lg:mx-4 mb-3 lg:mb-4 shrink-0">
                    <div className="p-3 lg:p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden group hover:shadow-primary-500/10 transition-all duration-300">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1 lg:p-1.5 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg text-white shadow-md shadow-primary-500/30">
                                        <Trophy size={12} className="lg:w-3.5 lg:h-3.5" />
                                    </div>
                                    <span className="text-[10px] lg:text-xs font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent uppercase tracking-wider">
                                        Level {user?.level || 1}
                                    </span>
                                </div>
                                <span className="text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {user?.xp || 0} / {nextLevelXP} XP
                                </span>
                            </div>

                            {/* Premium progress bar */}
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner relative">
                                <div
                                    className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-primary-500/50 relative transition-all duration-1000"
                                    style={{ width: `${xpPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation (Mobile Only) */}
                <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-24 space-y-6 relative z-10 custom-scrollbar lg:hidden">
                    {navGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            <div className="px-1 mb-4">
                                <h3 className="inline-flex items-center px-3 py-1 bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-200/30 dark:border-white/5 shadow-sm">
                                    {group.title}
                                </h3>
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => onClose && onClose()}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-500
                                            group relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/40 dark:to-slate-900/40 text-primary-600 dark:text-primary-400 font-black shadow-xl shadow-primary-500/10 border border-primary-500/20'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-bold hover:bg-white/50 dark:hover:bg-white/5 border border-transparent'
                                            }
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Premium hover glow */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                {/* Icon */}
                                                <div className={`
                                                    relative z-10 p-2 rounded-xl transition-all duration-500
                                                    ${isActive
                                                        ? `bg-gradient-to-br ${item.gradient} text-white shadow-lg shadow-primary-500/30 scale-110`
                                                        : 'bg-slate-100/50 dark:bg-slate-800/50 group-hover:scale-110'
                                                    }
                                                `}>
                                                    <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                                    {/* Chat Unread Badge */}
                                                    {item.label === 'Chat' && totalUnread > 0 && (
                                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-bounce" />
                                                    )}
                                                </div>

                                                <span className={`relative z-10 text-xs tracking-wide uppercase font-black transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                    {item.label}
                                                </span>

                                                {/* Chat Unread Counter Pill */}
                                                {item.label === 'Chat' && totalUnread > 0 && (
                                                    <div className="ml-auto relative z-10">
                                                        <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md shadow-rose-500/30">
                                                            {totalUnread > 99 ? '99+' : totalUnread}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Active Indicator */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="sidebar-active"
                                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full"
                                                    />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Study Buddies Section (Real-time Presence) */}
                <div className="px-4 mb-4 shrink-0">
                    <div className="px-1 mb-2">
                        <h3 className="inline-flex items-center px-3 py-1 bg-emerald-100/50 dark:bg-emerald-800/50 backdrop-blur-md rounded-full text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] border border-emerald-200/30 dark:border-white/5 shadow-sm">
                            Study Buddies
                        </h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {onlineUsers.filter(u => u.id !== user?.id).length === 0 ? (
                            <div className="p-3 text-[10px] text-slate-400 italic text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                No buddies online yet
                            </div>
                        ) : (
                            onlineUsers.filter(u => u.id !== user?.id).map((buddy) => (
                                <div key={buddy.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 group transition-all hover:bg-white dark:hover:bg-slate-800">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="relative">
                                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden">
                                                {buddy.avatar_url ? (
                                                    <img src={buddy.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    buddy.name?.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 border border-white dark:border-slate-800 rounded-full shadow-sm" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">{buddy.name}</span>
                                            <span className="text-[9px] font-medium text-slate-400 truncate">{buddy.activity || 'Online'}</span>
                                        </div>
                                    </div>
                                    {buddy.status === 'studying' && (
                                        <div className="w-4 h-4 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                                            <Sparkles size={10} className="animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Spacer to push footer to bottom */}
                <div className="flex-1"></div>

                {/* Music Player & Timer (Fixed at bottom) */}
                <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative z-10 gap-2 flex flex-col">
                    <MusicPlayer compact />
                    <PomodoroTimer compact />

                    <button
                        onClick={() => logout()}
                        className="
                            group flex items-center gap-3 w-full px-4 py-3 
                            text-slate-500 dark:text-slate-400 
                            hover:text-red-500 dark:hover:text-red-400 
                            bg-white/50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-900/10
                            border border-transparent hover:border-red-200 dark:hover:border-red-900/30
                            rounded-2xl transition-all duration-300
                            text-xs font-bold uppercase tracking-wider
                        "
                    >
                        <div className="p-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                            <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        </div>
                        <span>Sign Out System</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
