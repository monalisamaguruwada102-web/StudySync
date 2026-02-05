import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Palette, Check } from 'lucide-react';

const themes = [
    { id: 'default', name: 'Default', colors: ['#3b82f6', '#ec4899'] },
    { id: 'midnight', name: 'Midnight', colors: ['#6366f1', '#a855f7'] },
    { id: 'forest', name: 'Forest', colors: ['#10b981', '#14b8a6'] },
    { id: 'sunset', name: 'Sunset', colors: ['#f97316', '#f43f5e'] },
    { id: 'ocean', name: 'Ocean', colors: ['#0ea5e9', '#06b6d4'] },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: ['#a855f7', '#f0f'] },
    { id: 'rose', name: 'Rose', colors: ['#f43f5e', '#fbbf24'] },
];

const ThemeSelector = () => {
    const { theme, isDarkMode, toggleTheme, toggleDarkMode } = useTheme();

    return (
        <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-lg space-y-6 w-full max-w-xs">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Palette size={20} className="text-primary-500" />
                    Appearance
                </h3>
                <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-primary-600" />}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => toggleTheme(t.id)}
                        className={`group relative p-3 rounded-xl border-2 transition-all duration-300 text-left ${theme === t.id
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800/50 hover:border-primary-300'
                            }`}
                    >
                        <div className="flex flex-col gap-2">
                            <span className={`text-sm font-semibold ${theme === t.id ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                {t.name}
                            </span>
                            <div className="flex gap-1">
                                {t.colors.map((c, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c }} />
                                ))}
                            </div>
                        </div>
                        {theme === t.id && (
                            <div className="absolute top-2 right-2 text-primary-500">
                                <Check size={16} />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelector;
