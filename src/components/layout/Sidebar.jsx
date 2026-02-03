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
import PomodoroTimer from '../PomodoroTimer';
import MusicPlayer from './MusicPlayer';
import { navGroups } from '../../data/navigation';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const { user } = useAuth();

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
                    w-72 max-w-[85vw]
                    bg-white dark:bg-slate-900
                    bg-gradient-to-b from-white via-slate-50/50 to-white
                    dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900
                    border-r border-slate-200/50 dark:border-slate-700/50
                    flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] fixed left-0 top-0 z-[100]
                    shadow-2xl shadow-slate-900/10 dark:shadow-black/50
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}
            >
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Logo Section */}
                <div className="p-6 flex items-center justify-between gap-3 relative z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                            <GraduationCap size={24} className="relative z-10" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                        </div>
                        <div>
                            <span className="text-xl font-black bg-gradient-to-r from-slate-900 via-primary-600 to-purple-600 dark:from-slate-100 dark:via-primary-400 dark:to-purple-400 bg-clip-text text-transparent">
                                StudySync
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Sparkles size={8} className="text-primary-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Premium</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className="mx-4 mb-4 shrink-0">
                    <div className="p-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/50 dark:shadow-black/20 relative overflow-hidden group hover:shadow-primary-500/10 transition-all duration-300">
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/5 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg text-white shadow-md shadow-primary-500/30">
                                        <Trophy size={14} />
                                    </div>
                                    <span className="text-xs font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent uppercase tracking-wider">
                                        Level {user?.level || 1}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
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
                <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-6 relative z-10 custom-scrollbar lg:hidden">
                    {navGroups.map((group, groupIndex) => (
                        <div key={group.title}>
                            <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => onClose && onClose()}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                                            group relative overflow-hidden
                                            ${isActive
                                                ? 'bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 text-primary-600 dark:text-primary-400 font-bold shadow-sm shadow-primary-500/10'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                                            }
                                        `}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {/* Icon */}
                                                <div className={`
                                                    relative z-10 transition-transform duration-300 group-hover:scale-110
                                                    ${isActive ? `text-transparent bg-gradient-to-r ${item.gradient} bg-clip-text` : 'opacity-70 group-hover:opacity-100'}
                                                `}>
                                                    <item.icon size={18} />
                                                </div>

                                                <span className="relative z-10 text-sm tracking-tight capitalize">{item.label}</span>

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

                {/* Spacer to push footer to bottom */}
                <div className="flex-1"></div>

                {/* Music Player & Timer (Fixed at bottom) */}
                <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm relative z-10 gap-2 flex flex-col">
                    <MusicPlayer compact />
                    <PomodoroTimer compact />

                    <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 w-full px-3 py-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all duration-200 text-xs font-semibold mt-2 group"
                    >
                        <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
