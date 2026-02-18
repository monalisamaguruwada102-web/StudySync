import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Clock, Calendar, Share2, Quote, ArrowRight } from 'lucide-react';
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
                    className="text-black font-black uppercase tracking-widest border-b-2 border-black pb-1 hover:text-slate-600 hover:border-slate-600 transition-colors"
                >
                    Return to Library
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-32 px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">

                {/* Back Link */}
                <div className="flex items-center gap-6 mb-20">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center gap-1.5 text-slate-400 hover:text-black dark:hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform" />
                        Dashboard
                    </motion.button>
                    <div className="w-[2px] h-4 bg-slate-100 dark:bg-slate-900" />
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/articles')}
                        className="group flex items-center gap-1.5 text-slate-400 hover:text-black dark:hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Archive Directory
                    </motion.button>
                </div>

                <article className="relative">
                    {/* Header Info */}
                    <div className="flex flex-wrap items-center gap-8 mb-12 pb-12 border-b border-slate-100 dark:border-slate-900">
                        <div className="text-[10px] font-black text-black dark:text-white uppercase tracking-[0.2em]">
                            {article.category}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Clock size={12} />
                            {article.readTime}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            <Calendar size={12} />
                            {new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                        className="text-5xl lg:text-7xl font-black text-black dark:text-white tracking-tighter leading-[0.95] mb-20"
                    >
                        {article.title}
                    </motion.h1>

                    {/* Author Meta */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between mb-24"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xl font-black">
                                {article.author[0]}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1" >Written By</p>
                                <p className="text-xl font-black text-black dark:text-white leading-none">{article.author}</p>
                            </div>
                        </div>
                        <button
                            className="p-4 rounded-none border border-slate-200 dark:border-slate-800 text-slate-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all group"
                            title="Share Insights"
                        >
                            <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                        </button>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="prose prose-xl prose-slate dark:prose-invert max-w-none 
                                   prose-headings:text-black dark:prose-headings:text-white prose-headings:font-black prose-headings:tracking-tighter 
                                   prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:font-medium
                                   prose-strong:text-black dark:prose-strong:text-white prose-strong:font-black
                                   prose-blockquote:border-l-4 prose-blockquote:border-black dark:prose-blockquote:border-white prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:font-serif prose-blockquote:italic
                                   prose-li:text-slate-700 dark:prose-li:text-slate-300
                                   prose-code:text-black dark:prose-code:text-white prose-code:bg-slate-100 dark:prose-code:bg-slate-900"
                    >
                        <ReactMarkdown
                            components={{
                                blockquote: ({ children }) => (
                                    <blockquote className="my-16 font-serif italic text-3xl leading-relaxed text-slate-900 dark:text-slate-100">
                                        {children}
                                    </blockquote>
                                )
                            }}
                        >
                            {article.content}
                        </ReactMarkdown>
                    </motion.div>

                    {/* Footer */}
                    <div className="mt-32 pt-16 border-t-2 border-black dark:border-white flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">More from</p>
                            <h3 className="text-3xl font-black text-black dark:text-white tracking-widest uppercase">The Library</h3>
                        </div>
                        <button
                            onClick={() => navigate('/articles')}
                            className="inline-flex items-center gap-4 bg-black text-white dark:bg-white dark:text-black px-10 py-5 text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                        >
                            Browse All Articles
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ArticleDetail;
