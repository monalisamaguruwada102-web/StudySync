import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FileDown, GraduationCap, Award, TrendingUp, Calendar, Zap, Star, ShieldCheck, Download, ExternalLink } from 'lucide-react';

const Portfolio = () => {
    const { user } = useAuth();
    const [generating, setGenerating] = useState(false);

    const handleExport = () => {
        setGenerating(true);
        setTimeout(() => setGenerating(false), 3000);
    };

    return (
        <Layout title="Ultimate Portfolio">
            <div className="max-w-5xl mx-auto space-y-10 py-6">
                {/* Header Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-16 shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500" />

                    <div className="max-w-2xl mx-auto">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-900 p-5 shadow-2xl mx-auto mb-8">
                            <GraduationCap size={56} className="text-primary-400" />
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">The Ultimate Portfolio</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed mb-10">
                            Transform your study data into a professional academic portfolio. Export verified performance certificates and learning trajectories for your future applications.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={handleExport}
                                disabled={generating}
                                className="w-full sm:w-auto px-12 py-5 bg-slate-900 border-2 border-slate-900 dark:border-white text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Generating PDF...
                                    </>
                                ) : (
                                    <>
                                        <FileDown size={20} />
                                        Export Portfolio
                                    </>
                                )}
                            </button>
                            <button className="w-full sm:w-auto px-12 py-5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                                <ExternalLink size={20} />
                                View Live Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Portfolio Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <Card title="Academic Trajectory (Preview)">
                            <div className="aspect-[16/9] bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-12 text-center">
                                <TrendingUp size={48} className="text-slate-200 dark:text-slate-700 mb-6" />
                                <div className="space-y-2">
                                    <div className="h-4 w-40 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto" />
                                    <div className="h-4 w-64 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto opacity-50" />
                                </div>
                                <p className="mt-8 text-xs font-black uppercase tracking-widest text-slate-400">Interactive Analytics Visualization</p>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <Card title="Verified Skills">
                                <div className="space-y-4">
                                    {['Deep Focus Mastery', 'Advanced Memorization', 'Subject Synergy'].map((skill, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{skill}</span>
                                            <ShieldCheck size={16} className="text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card title="Activity Density">
                                <div className="flex flex-wrap gap-2">
                                    {Array(15).fill(0).map((_, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-lg ${i % 3 === 0 ? 'bg-primary-500' : i % 2 === 0 ? 'bg-primary-200 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-800'}`} />
                                    ))}
                                </div>
                                <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Last 90 Days Consistency</p>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <Card title="Portfolio Contents">
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
                                        <Star size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Elite Badges</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">Showcase your hardest earned achievements and focus records.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Consistency Logs</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">Proof of your daily commitment and study streaks over time.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">XP Progression</h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed">Visual growth map showing your evolution from Novice to Academic Titan.</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full" />
                            <Award className="mb-4 opacity-50" size={32} />
                            <h4 className="text-lg font-black italic uppercase mb-2">Academic Titan</h4>
                            <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                                You are in the top 1% of StudySync users. This title will be prominently displayed on your portfolio.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Portfolio;
