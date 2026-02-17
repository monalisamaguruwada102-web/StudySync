import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Clock, User, Tag, Sparkles } from 'lucide-react';
import { articles } from '../data/articles';

const Articles = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', ...new Set(articles.map(a => a.category))];

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 rounded-full text-[10px] font-black text-primary-500 uppercase tracking-widest mb-4"
                        >
                            <BookOpen size={12} />
                            Academic Resources
                        </motion.div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                            Knowledge <span className="text-primary-500">Hub</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Master your studies with science-backed learning strategies.
                        </p>
                    </div>

                    <div className="w-full md:w-96 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-2 mb-12">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === cat
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 hover:bg-primary-500/5 hover:text-primary-500'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredArticles.map((article, idx) => (
                            <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, delay: idx * 0.05 }}
                                className="group relative"
                            >
                                <Link to={`/articles/${article.id}`} className="block h-full">
                                    <div className="h-full p-8 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl hover:bg-white/30 dark:hover:bg-slate-900/60 transition-all duration-500 relative overflow-hidden flex flex-col">

                                        {/* Floating Category */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/50 dark:bg-slate-800/50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6 w-fit">
                                            <Tag size={10} />
                                            {article.category}
                                        </div>

                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 group-hover:text-primary-500 transition-colors leading-tight">
                                            {article.title}
                                        </h3>

                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 line-clamp-3">
                                            {article.summary}
                                        </p>

                                        <div className="mt-auto space-y-6">
                                            <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-800" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                                                        {article.author.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 dark:text-white">{article.author}</span>
                                                        <span className="text-[9px] text-slate-500">{article.readTime} read</span>
                                                    </div>
                                                </div>
                                                <div className="w-10 h-10 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-all duration-300">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decorative element */}
                                        <div className="absolute top-0 right-0 p-8 text-primary-500/5 group-hover:text-primary-500/10 transition-colors">
                                            <Sparkles size={120} />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredArticles.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24"
                    >
                        <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">No articles found</h3>
                        <p className="text-slate-500">Try adjusting your search or category filter.</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Articles;
