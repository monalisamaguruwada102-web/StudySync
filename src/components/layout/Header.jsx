import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Bell, Sun, Moon, Menu, Search as SearchIcon } from 'lucide-react';
import GlobalSearch from '../search/GlobalSearch';

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
                        className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">Welcome back to your study journey.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-6">
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
