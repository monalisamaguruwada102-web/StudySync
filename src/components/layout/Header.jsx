import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    User, Bell, Sun, Moon, Menu, Search as SearchIcon, ChevronDown
} from 'lucide-react';
import GlobalSearch from '../search/GlobalSearch';
import { navGroups } from '../../data/navigation';

const Header = ({ title, toggleSidebar }) => {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    const [isSearchOpen, setIsSearchOpen] = React.useState(false);

    return (
        <>
            <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                    </div>
                </div>

                {/* Horizontal Navigation - Desktop */}
                <div className="hidden lg:flex items-center gap-1 mx-4 flex-1 justify-center">
                    {navGroups.map((group) => (
                        <div key={group.title} className="relative group/nav">
                            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <span>{group.title}</span>
                                <ChevronDown size={14} className="opacity-50 group-hover/nav:rotate-180 transition-transform duration-300" />
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 p-2 opacity-0 translate-y-2 invisible group-hover/nav:opacity-100 group-hover/nav:translate-y-0 group-hover/nav:visible transition-all duration-300 ease-out z-50 min-w-[220px]">
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

                <div className="flex items-center gap-2 sm:gap-4">
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

                    <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hidden sm:block">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </button>

                    <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-md shadow-primary-500/20 ring-2 ring-white dark:ring-slate-900">
                            <span className="font-bold text-xs">{user?.email?.[0]?.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </header>

            <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
};

export default Header;
