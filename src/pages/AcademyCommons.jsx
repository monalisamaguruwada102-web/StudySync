import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, BookOpen, Download, ThumbsUp, Share2, Plus, Star, Tag, MessageCircle } from 'lucide-react';

const AcademyCommons = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [resources] = useState([
        { id: 1, title: 'Organic Chemistry Master Notes', author: 'Dr_Study', downloads: 1240, rating: 4.9, tags: ['Chemistry', 'Pre-Med'], type: 'PDF' },
        { id: 2, title: 'Calculus III cheat sheet', author: 'MathWhiz', downloads: 850, rating: 4.8, tags: ['Math', 'Calculus'], type: 'Image' },
        { id: 3, title: 'World History Timeline (1900-2000)', author: 'HistoryBuff', downloads: 420, rating: 4.6, tags: ['History'], type: 'PDF' },
        { id: 4, title: 'Python Algorithms & Data Structures', author: 'Dev_Josh', downloads: 2100, rating: 5.0, tags: ['CS', 'Python'], type: 'Code' },
        { id: 5, title: 'Anatomy Flashcard Deck', author: 'MedStudent_01', downloads: 630, rating: 4.7, tags: ['Medicine', 'Flashcards'], type: 'Archive' },
    ]);

    return (
        <Layout title="Academy Commons">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                {/* Search & Header */}
                <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <BookOpen className="text-primary-500" size={32} />
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academy Commons</h1>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md">
                                Discover and share high-quality study materials peer-reviewed by the community.
                            </p>
                        </div>

                        <div className="flex-1 w-full max-w-md">
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by topic, author, or subject..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-primary-500/30 dark:focus:border-primary-500/20 rounded-[2rem] pl-16 pr-6 py-5 text-sm font-bold placeholder:text-slate-400 text-slate-900 dark:text-white transition-all outline-none shadow-inner"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <button className="px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
                            <Plus size={20} />
                            Publish Resource
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                        {['All Subjects', 'Medicine', 'Computer Science', 'Law', 'Engineering', 'History', 'Math'].map((tag) => (
                            <button key={tag} className="px-5 py-2.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-primary-500 hover:text-white transition-all border border-slate-100 dark:border-slate-700">
                                {tag}
                            </button>
                        ))}
                        <button className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-500 transition-colors">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                {/* Resource Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resources.map((res) => (
                        <motion.div
                            whileHover={{ y: -10 }}
                            key={res.id}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl flex flex-col group"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/10 flex items-center justify-center text-primary-500 border border-primary-100 dark:border-primary-900/30">
                                    <Tag size={24} />
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full shadow-sm">
                                    <Star size={12} className="text-yellow-400 fill-current" />
                                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{res.rating}</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-primary-500 transition-colors cursor-pointer">
                                {res.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">By {res.author}</p>

                            <div className="flex flex-wrap gap-2 mb-8">
                                {res.tags.map(t => (
                                    <span key={t} className="px-3 py-1 bg-slate-50 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 rounded-lg">
                                        #{t}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Download size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{res.downloads}</span>
                                    </div>
                                    <button className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <ThumbsUp size={16} />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-primary-500 transition-all border border-transparent hover:border-primary-100">
                                        <Share2 size={16} />
                                    </button>
                                    <button className="p-3 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-600 transition-all active:scale-95">
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Community Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mb-32 -mr-32" />
                        <div className="relative z-10">
                            <MessageCircle className="mb-6 opacity-40" size={40} />
                            <h2 className="text-3xl font-black mb-4 tracking-tight italic">Top Contributor of the Month</h2>
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-white p-2 shadow-xl">
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=StudyMaster" alt="Top Scholar" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black">StudyMaster_24</h4>
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Shared 15 Resources • 4.2k Downloads</p>
                                </div>
                            </div>
                            <button className="mt-8 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                                Follow Scholar
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[3rem] p-10 border border-slate-800 shadow-xl flex flex-col justify-center">
                        <h3 className="text-white text-2xl font-black mb-4 tracking-tight">Earn Rewards for Sharing</h3>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                            Get unique badges and exclusive Sync-Market discounts for every high-quality study resource you share with the community.
                        </p>
                        <div className="flex gap-4">
                            <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <Award className="text-yellow-400" size={18} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest tracking-widest">Contributor Badge</span>
                            </div>
                            <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                                <Zap className="text-primary-400" size={18} />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest tracking-widest">+500 SyncCoins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AcademyCommons;
