import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Bell, Sun, Moon } from 'lucide-react';

const Header = ({ title }) => {
    const { user } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30 transition-all duration-300">
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back to your study journey.</p>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button className="relative text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-accent-500 rounded-full border-2 border-white dark:border-slate-900" />
                </button>

                <div className="flex items-center gap-3 pl-6 border-l border-slate-100 dark:border-slate-800">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.email?.split('@')[0]}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">IT Student</p>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
