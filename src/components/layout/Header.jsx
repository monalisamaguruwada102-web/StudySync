import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    User, Bell, Sun, Moon, Menu, Search as SearchIcon, ChevronDown, Sparkles,
    Music, Terminal, ShoppingBag, Map as MapIcon, Users, Swords, Heart, BookOpen, Shield, FileText, Zap
} from 'lucide-react';
import GlobalSearch from '../search/GlobalSearch';
import { navGroups } from '../../data/navigation';

const premiumFeatures = [
    { path: '/focus', label: 'Sonic Studio', icon: Music, color: 'rose', description: 'Ambient sound mixer' },
    { path: '/command-center', label: 'Command Center', icon: Terminal, color: 'slate', description: 'Deadline overview' },
    { path: '/marketplace', label: 'Sync-Market', icon: ShoppingBag, color: 'amber', description: 'In-app shop' },
    { path: '/dashboard', label: 'Milestone Map', icon: MapIcon, color: 'emerald', description: 'Visual progress' },
    { path: '/sync-rooms', label: 'Sync-Rooms', icon: Users, color: 'indigo', description: 'Collaborative study' },
    { path: '/duels', label: 'Knowledge Duels', icon: Swords, color: 'rose', description: '1v1 Focus battles' },
    { path: '/guardians', label: 'Focus Guardian', icon: Heart, color: 'pink', description: 'Digital study pet' },
    { path: '/commons', label: 'Academy Commons', icon: BookOpen, color: 'primary', description: 'Resource sharing' },
    { path: '/vault', label: 'The Vault', icon: Shield, color: 'slate', description: 'Secure file storage' },
    { path: '/blueprints', label: 'Blueprints', icon: Zap, color: 'yellow', description: 'Subject kits' },
    { path: '/portfolio', label: 'Ultimate Portfolio', icon: FileText, color: 'indigo', description: 'PDF Performance export' }
];

const Header = ({ title, toggleSidebar }) => {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const [isSearchOpen, setIsSearchOpen] = React.useState(false);

    return (
        <>
            <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300 gap-4 lg:gap-8">
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 hidden xl:block">Welcome back to your study journey.</p>
                    </div>
                </div>

                {/* Horizontal Navigation - Desktop Original Dropdowns Restored */}
                <div className="hidden lg:flex items-center gap-1 flex-1 justify-center relative z-40">
                    {navGroups.map((group) => (
                        <div key={group.title} className="relative group/nav">
                            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span>{group.title}</span>
                                <ChevronDown size={14} className="opacity-50 group-hover/nav:rotate-180 transition-transform duration-300" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 p-2 opacity-0 translate-y-2 invisible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:visible transition-all duration-300 ease-out z-[100] min-w-[220px]">
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 p-2 backdrop-blur-3xl">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group/item
                                                ${isActive
                                                    ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                p-1.5 rounded-lg transition-colors group-hover/item:bg-white dark:group-hover/item:bg-slate-800 shadow-sm
                                                bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400
                                            `}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 sm:gap-6 shrink-0 relative z-40">
                    {/* Premium Dropdown */}
                    <div className="relative group/nav hidden sm:block">
                        <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform duration-300 font-bold text-sm tracking-wide">
                            <Sparkles size={14} />
                            <span>Premium Hub</span>
                            <ChevronDown size={14} className="opacity-70 group-hover/nav:rotate-180 transition-transform duration-300 ml-1" />
                        </button>

                        <div className="absolute top-full right-0 pt-3 opacity-0 translate-y-2 invisible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:visible transition-all duration-300 ease-out z-[100] w-[300px]">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 p-3 backdrop-blur-3xl max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="px-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Elite Tools</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                    {premiumFeatures.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group/item
                                                ${isActive
                                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }
                                            `}
                                        >
                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover/item:text-primary-500 group-hover/item:bg-white dark:group-hover/item:bg-slate-900 shadow-sm transition-colors">
                                                <item.icon size={16} />
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 truncate">{item.label}</span>
                                                <span className="text-[10px] text-slate-400 truncate">{item.description}</span>
                                            </div>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Trigger */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        title="Global Search (Cmd/Ctrl + K)"
                    >
                        <SearchIcon size={20} />
                    </button>

                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </button>

                    <div className="flex items-center gap-3 pl-2 sm:pl-6 border-l border-slate-100 dark:border-slate-800">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.email?.split('@')[0]}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">IT Student</p>
                        </div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            </header>

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Header;
