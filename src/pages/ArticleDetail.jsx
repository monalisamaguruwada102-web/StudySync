import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Calendar, User, Share2, Sparkles, BookOpen, Quote } from 'lucide-react';
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
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4 text-center">Article Not Found</h1>
                <Link to="/articles" className="text-primary-500 font-bold hover:underline">Back to Archive</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-24 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/articles')}
                    className="flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors text-xs font-black uppercase tracking-widest mb-12"
                >
                    <ArrowLeft size={16} />
                    Back to Knowledge Hub
                </motion.button>

                <article className="relative">
                    {/* Floating Info */}
                    <div className="flex flex-wrap items-center gap-6 mb-8">
                        <div className="px-4 py-1.5 bg-primary-500/10 rounded-full text-xs font-black text-primary-500 uppercase tracking-widest">
                            {article.category}
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                            <Clock size={14} className="text-primary-500/50" />
                            {article.readTime} reading time
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                            <Calendar size={14} className="text-primary-500/50" />
                            {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-12"
                    >
                        {article.title}
                    </motion.h1>

                    {/* Meta/Author Card */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] mb-12"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20">
                                {article.author[0]}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-primary-500 mb-0.5">Author</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{article.author}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary-500 transition-all">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="prose prose-lg dark:prose-invert max-w-none 
                                   prose-headings:font-black prose-headings:tracking-tight 
                                   prose-p:text-slate-600 dark:prose-p:text-slate-300 
                                   prose-strong:text-slate-900 dark:prose-strong:text-white
                                   prose-a:text-primary-500"
                    >
                        <ReactMarkdown
                            components={{
                                blockquote: ({ children }) => (
                                    <div className="my-12 p-8 bg-primary-500/5 border-l-4 border-primary-500 rounded-r-3xl relative overflow-hidden italic text-xl">
                                        <Quote size={48} className="absolute -top-4 -right-4 text-primary-500/10" />
                                        {children}
                                    </div>
                                )
                            }}
                        >
                            {article.content}
                        </ReactMarkdown>
                    </motion.div>

                    {/* Footer / Read More Section */}
                    <div className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">More Resources</h3>
                            <Link to="/articles" className="text-xs font-black uppercase tracking-widest text-primary-500 hover:underline">View All</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {articles.filter(a => a.id !== id).slice(0, 2).map(a => (
                                <Link key={a.id} to={`/articles/${a.id}`} className="group p-6 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl hover:bg-white/30 dark:hover:bg-slate-900/60 transition-all">
                                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary-500 transition-colors mb-2">{a.title}</h4>
                                    <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        <span>{a.category}</span>
                                        <span>•</span>
                                        <span>{a.readTime} read</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </article>

                {/* Decorative Sparkles */}
                <div className="fixed top-1/4 -right-12 opacity-[0.03] pointer-events-none">
                    <Sparkles size={400} />
                </div>
            </div>
        </div>
    );
};

export default ArticleDetail;
