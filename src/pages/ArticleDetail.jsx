import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, User, Share2, Printer, Bookmark, LayoutDashboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { articles } from '../data/articles';

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const article = articles.find(a => a.id === id);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!article) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl font-black text-black mb-4 text-center">Archive Entry Missing</h1>
                <button
                    onClick={() => navigate('/articles')}
                    className="text-rose-700 font-black uppercase tracking-widest border-b-2 border-rose-700 pb-1 hover:text-rose-900 hover:border-rose-900 transition-colors"
                >
                    Return to Library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-32 px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <div className="flex items-center gap-6 mb-20">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/articles')}
                        className="group flex items-center gap-1.5 text-slate-400 hover:text-rose-700 dark:hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Archive Directory
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-1.5 text-slate-400 hover:text-rose-700 dark:hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform" />
                        Dashboard
                    </motion.button>
                </div>

                <article className="relative">
                    {/* Header Info */}
                    <div className="flex flex-wrap items-center gap-8 mb-12 pb-12 border-b border-rose-100 dark:border-rose-900/30">
                        <div className="text-[10px] font-black text-rose-700 dark:text-rose-500 uppercase tracking-[0.2em]">
                            {article.category}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <Clock size={12} />
                            {article.readTime}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            <Calendar size={12} />
                            {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="text-5xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-[0.95] mb-20 drop-shadow-sm"
                    >
                        {article.title}
                    </motion.h1>

                    {/* Author Meta */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between mb-24"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-700 dark:bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-lg">
                                {article.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <div className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{article.author}</div>
                                <div className="text-xs text-rose-700 dark:text-rose-500 font-medium">Editorial Staff</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400 hover:text-rose-700 dark:hover:text-rose-500">
                                <Share2 size={18} />
                            </button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400 hover:text-rose-700 dark:hover:text-rose-500">
                                <Bookmark size={18} />
                            </button>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors text-slate-400 hover:text-rose-700 dark:hover:text-rose-500" onClick={() => window.print()}>
                                <Printer size={18} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-xl prose-slate dark:prose-invert max-w-none
                                   prose-headings:text-black dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tighter
                                   prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:font-medium
                                   prose-strong:text-rose-800 dark:prose-strong:text-rose-400 prose-strong:font-black
                                   prose-blockquote:border-l-4 prose-blockquote:border-rose-700 dark:prose-blockquote:border-rose-500 prose-blockquote:bg-rose-50 dark:prose-blockquote:bg-rose-900/10 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-slate-800 dark:prose-blockquote:text-rose-100 prose-blockquote:rounded-r-lg
                                   prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:marker:text-rose-700 dark:prose-li:marker:text-rose-500
                                   prose-code:text-rose-800 dark:prose-code:text-rose-300 prose-code:bg-rose-50 dark:prose-code:bg-rose-900/20 prose-code:px-1 prose-code:rounded prose-code:font-bold prose-code:before:content-none prose-code:after:content-none"
                    >
                        <ReactMarkdown
                            components={{
                                blockquote: ({ children }) => (
                                    <blockquote className="my-16 font-serif italic text-2xl leading-relaxed text-slate-900 dark:text-slate-100 pl-8 border-l-4 border-rose-700 dark:border-rose-500">
                                        {children}
                                    </blockquote>
                                )
                            }}
                        >
                            {article.content}
                        </ReactMarkdown>
                    </motion.div>

                    {/* Footer / End of Article */}
                    <div className="mt-32 pt-16 border-t-2 border-rose-700 dark:border-rose-500 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-500 mb-2">Next Read</div>
                            <div className="text-2xl font-black text-black dark:text-white">The Art of Deep Work</div>
                        </div>
                        <button
                            onClick={() => navigate('/articles')}
                            className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-xs hover:bg-rose-700 dark:hover:bg-rose-200 transition-colors"
                        >
                            Back to Library
                        </button>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ArticleDetail;
