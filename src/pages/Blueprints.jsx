import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Rocket, Target, Clock, Zap, Star, LayoutGrid, ArrowRight, CheckCircle2, BadgeCheck } from 'lucide-react';

const Blueprints = () => {
    const { user } = useAuth();
    const [blueprints] = useState([
        {
            id: 1,
            name: 'Final Month Sprint',
            description: 'Intensive 4-week preparation kit for major exams with daily milestones.',
            difficulty: 'Expert',
            duration: '30 Days',
            users: 1240,
            color: 'indigo',
            features: ['Daily Recap Logic', 'Morning Intensity Flow', 'Stress Monitor integration']
        },
        {
            id: 2,
            name: 'Foundation Builder',
            description: 'Establish consistent study habits over 14 days with graduated intensity.',
            difficulty: 'Beginner',
            duration: '14 Days',
            users: 3500,
            color: 'emerald',
            features: ['Habit Gating', 'Sonic Environment Presets', 'Achievement Tracking']
        },
        {
            id: 3,
            name: 'Deep-Research Kit',
            description: 'Optimized workflow for thesis writing and literature review.',
            difficulty: 'Intermediate',
            duration: '60 Days',
            users: 820,
            color: 'rose',
            features: ['Citation Milestones', 'Reference Mapping', 'Focus Room exclusivity']
        },
    ]);

    return (
        <Layout title="Blueprints">
            <div className="max-w-6xl mx-auto space-y-12 py-6">
                {/* Hero */}
                <div className="relative rounded-[4rem] overflow-hidden bg-slate-900 border border-white/10 p-16 shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/20">
                                    <Rocket className="text-primary-400" size={28} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-400">Launch Sequence Initialized</span>
                            </div>
                            <h1 className="text-6xl font-black text-white tracking-tighter mb-6 leading-none">Blueprints</h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                Don't reinvent the wheel. Deploy pre-configured study systems designed by elite students to automate your academic success.
                            </p>
                        </div>
                        <div className="w-full md:w-auto">
                            <div className="p-10 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 text-center">
                                <div className="text-4xl font-black text-white mb-2">15k+</div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Deployments This Week</p>
                                <button className="w-full px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl">
                                    Explore Library
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {blueprints.map((blueprint) => (
                        <motion.div
                            whileHover={{ y: -10 }}
                            key={blueprint.id}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-10 shadow-xl relative overflow-hidden group flex flex-col"
                        >
                            <div className={`absolute top-0 right-0 w-40 h-40 bg-${blueprint.color}-500/10 blur-[60px] rounded-full -mr-20 -mt-20`} />

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className={`p-4 bg-${blueprint.color}-50 dark:bg-${blueprint.color}-900/10 rounded-[1.5rem] text-${blueprint.color}-500 border border-${blueprint.color}-100 dark:border-${blueprint.color}-800`}>
                                    <Layers size={24} />
                                </div>
                                <span className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <Clock size={12} />
                                    {blueprint.duration}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{blueprint.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 flex-1">
                                {blueprint.description}
                            </p>

                            <div className="space-y-4 mb-10">
                                {blueprint.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <BadgeCheck size={16} className={`text-${blueprint.color}-500`} />
                                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white italic">{blueprint.difficulty}</span>
                                </div>
                                <button className={`px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-${blueprint.color}-500 hover:text-white transition-all shadow-xl flex items-center gap-2`}>
                                    Deploy
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                    <div className="bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3.5rem] flex flex-col items-center justify-center p-12 group hover:border-primary-500/30 transition-all cursor-pointer">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                            <Plus size={32} className="text-slate-300 group-hover:text-primary-500" />
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Build Your Own</h4>
                        <p className="text-xs text-slate-400 font-medium text-center">Convert your current setup into a reusable study blueprint.</p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Blueprints;
