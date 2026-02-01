import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, FileText, CheckSquare, Layout, Command, ArrowRight } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { moduleService, taskService, noteService } from '../../services/firestoreService';
import Input from '../ui/Input';

const GlobalSearch = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    // Note: Assuming noteService exists or similar. If not, we'll skip notes or mock.
    // Assuming noteService.getAll is available. If not, we might need to adjust.
    // For safety, let's wrap noteService usage or just use modules/tasks/pages first.

    // Predefined pages
    const pages = [
        { title: 'Dashboard', path: '/', icon: Layout, type: 'Page' },
        { title: 'Modules', path: '/modules', icon: BookOpen, type: 'Page' },
        { title: 'Study Logs', path: '/logs', icon: FileText, type: 'Page' },
        { title: 'Tasks', path: '/tasks', icon: CheckSquare, type: 'Page' },
        { title: 'Notes', path: '/notes', icon: FileText, type: 'Page' },
        { title: 'Grades', path: '/grades', icon: Layout, type: 'Page' },
        { title: 'Flashcards', path: '/flashcards', icon: BookOpen, type: 'Page' },
        { title: 'Calendar', path: '/calendar', icon: Layout, type: 'Page' },
        { title: 'Kanban', path: '/kanban', icon: Layout, type: 'Page' },
        { title: 'Deep Analytics', path: '/deep-analytics', icon: Layout, type: 'Page' },
        { title: 'Deep Focus', path: '/focus', icon: Layout, type: 'Page' },
        { title: 'Settings', path: '/settings', icon: Layout, type: 'Page' },
    ];

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();

        // Filter Pages
        const matchedPages = pages.filter(p => p.title.toLowerCase().includes(lowerQuery));

        // Filter Modules
        const matchedModules = (modules || []).filter(m =>
            m.name.toLowerCase().includes(lowerQuery) ||
            (m.description && m.description.toLowerCase().includes(lowerQuery))
        ).map(m => ({
            title: m.name,
            sub: m.description,
            path: '/modules', // Could go to specific module detail if implemented
            icon: BookOpen,
            type: 'Module'
        }));

        // Filter Tasks
        const matchedTasks = (tasks || []).filter(t =>
            t.title.toLowerCase().includes(lowerQuery)
        ).map(t => ({
            title: t.title,
            sub: `Due: ${t.dueDate || 'No Date'}`,
            path: '/tasks',
            icon: CheckSquare,
            type: 'Task'
        }));

        setResults([...matchedPages, ...matchedModules, ...matchedTasks]);

    }, [query, modules, tasks]);

    const handleSelect = (path) => {
        navigate(path);
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 px-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: -20 }}
                    className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Search className="text-slate-400" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search everywhere..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        />
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                            <span className="text-xs font-bold mr-2 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">ESC</span>
                            <X size={18} className="inline" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {results.length > 0 ? (
                            <div className="space-y-1">
                                {results.map((result, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelect(result.path)}
                                        className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl group transition-all text-left"
                                    >
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                            <result.icon size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {result.title}
                                            </h4>
                                            {result.sub && <p className="text-xs text-slate-500 dark:text-slate-400">{result.sub}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                {result.type}
                                            </span>
                                            <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="py-12 text-center text-slate-400">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No results found for "{query}"</p>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <Command size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Type to search across pages, modules, and tasks</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
                        <span className="font-medium">JoshWebs Global Search</span>
                        <div className="flex gap-4">
                            <span><kbd className="font-sans border border-slate-200 dark:border-slate-700 px-1 rounded bg-white dark:bg-slate-800">↑↓</kbd> to navigate</span>
                            <span><kbd className="font-sans border border-slate-200 dark:border-slate-700 px-1 rounded bg-white dark:bg-slate-800">Enter</kbd> to select</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GlobalSearch;
