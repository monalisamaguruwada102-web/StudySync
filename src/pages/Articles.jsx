import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Clock, ArrowRight, BookMarked, LayoutDashboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { articles } from '../data/articles';

const Articles = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const navigate = useNavigate();

    const categories = ['All', ...new Set(articles.map(article => article.category))];

    const filteredArticles = articles.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-24 px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
                    <div className="max-w-2xl">
                        {/* Navigation */}
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => navigate('/dashboard')}
                            className="group mb-8 flex items-center gap-2 text-slate-400 hover:text-rose-700 dark:hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform" />
                            Dashboard
                        </motion.button>

                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-0 py-1 border-b-2 border-rose-700 dark:border-rose-500 text-[10px] font-black text-rose-700 dark:text-rose-500 uppercase tracking-[0.2em] mb-6"
                        >
                            <BookOpen size={14} />
                            Editorial Knowledge
                        </motion.div>
                        <h1 className="text-5xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-none mb-6 text-stroke">
                            The <span className="italic font-serif text-rose-800 dark:text-rose-600">Library</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl font-medium max-w-xl">
                            Curated insights into the science of learning, productivity, and academic excellence.
                        </p>
                    </div>

                    <div className="w-full md:w-96 relative group">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-rose-700 dark:text-rose-500" size={20} />
                        <input
                            type="text"
                            placeholder="Find a topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-rose-700 dark:focus:border-rose-500 outline-none transition-all text-black dark:text-white text-lg font-bold placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-3 mb-16">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === category
                                    ? 'bg-rose-700 text-white'
                                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'
                                } `}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <AnimatePresence mode="popLayout">
                        {filteredArticles.map((article, idx) => (
                            <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: idx * 0.05 }}
                                className="group"
                            >
                                <Link to={`/articles/${article.id}`} className="block h-full group">
                                    <div className="h-full flex flex-col pt-8 pb-12 border-t-4 border-slate-100 dark:border-slate-900 group-hover:border-rose-700 dark:group-hover:border-rose-600 transition-all duration-500">
                                        <div className="flex justify-between items-start mb-6">
                                            <span className="text-[10px] font-black text-rose-700 dark:text-rose-500 uppercase tracking-[0.2em]">{article.category}</span>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                <Clock size={12} />
                                                {article.readTime}
                                            </div>
                                        </div>

                                        <h2 className="text-3xl font-black text-black dark:text-white leading-[1.1] mb-4 group-hover:text-rose-800 dark:group-hover:text-rose-400 transition-colors">
                                            {article.title}
                                        </h2>

                                        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8 line-clamp-3">
                                            {article.excerpt}
                                        </p>

                                        <div className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black dark:text-white group-hover:gap-4 transition-all">
                                            Read Article <ArrowRight size={12} className="text-rose-700 dark:text-rose-500" />
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
                        className="py-32 text-center"
                    >
                        <p className="text-2xl font-serif italic text-slate-400">No entries found in this collection.</p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                            className="mt-6 text-xs font-black uppercase tracking-widest text-black dark:text-white border-b border-black dark:border-white pb-1"
                        >
                            Reset Search
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Articles;
