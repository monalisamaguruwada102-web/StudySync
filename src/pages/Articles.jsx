import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight, Clock, Tag, Sparkles } from 'lucide-react';
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
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-24 px-4 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-20">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-0 py-1 border-b-2 border-black dark:border-white text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em] mb-6"
                        >
                            <BookOpen size={14} />
                            Editorial Knowledge
                        </motion.div>
                        <h1 className="text-5xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-none mb-6 text-stroke">
                            The <span className="italic font-serif">Library</span>
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl font-medium max-w-xl">
                            Curated insights into the science of learning, productivity, and academic excellence.
                        </p>
                    </div>

                    <div className="w-full md:w-96 relative group">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-black dark:text-white" size={20} />
                        <input
                            type="text"
                            placeholder="Find a topic..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-black dark:focus:border-white outline-none transition-all text-black dark:text-white text-lg font-bold placeholder:text-slate-300"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-3 mb-16">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-8 py-2.5 rounded-none text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-300 ${selectedCategory === cat
                                ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                                : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                                }`}
                        >
                            {cat}
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
                                    <div className="h-full flex flex-col pt-8 pb-12 border-t border-slate-100 dark:border-slate-900 group-hover:border-black dark:group-hover:border-white transition-all duration-500 relative">

                                        <div className="flex items-center justify-between mb-8">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                {article.category}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-200 dark:text-slate-800 uppercase tracking-widest">
                                                0{article.id}
                                            </span>
                                        </div>

                                        <h2 className="text-3xl font-black text-black dark:text-white leading-[1.1] tracking-tight mb-6 group-hover:translate-x-2 transition-transform duration-500">
                                            {article.title}
                                        </h2>

                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-grow">
                                            {article.summary}
                                        </p>

                                        <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-900 group-hover:border-black dark:group-hover:border-white transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-[10px] font-black">
                                                    {article.author[0]}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-black dark:text-white uppercase tracking-widest leading-none">
                                                        {article.author}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">
                                                        {article.readTime} Read
                                                    </p>
                                                </div>
                                            </div>
                                            <ArrowRight className="text-slate-200 group-hover:text-black dark:group-hover:text-white transition-all transform group-hover:translate-x-1" size={18} />
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
