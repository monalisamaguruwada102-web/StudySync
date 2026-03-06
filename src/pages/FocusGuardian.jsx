import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Star, Shield, HelpCircle, Info, ChevronRight, Award } from 'lucide-react';

const FocusGuardian = () => {
    const { user } = useAuth();
    const [guardian, setGuardian] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGuardian = async () => {
            try {
                const res = await api.get('/api/premium/guardian');
                setGuardian(res.data);
            } catch (err) {
                console.error('Failed to fetch guardian:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGuardian();
    }, []);
    const [activeGuardian, setActiveGuardian] = useState({
        id: 1,
        name: 'Aurelius',
        type: 'Phoenix',
        level: 4,
        xp: 3200,
        nextLevelXp: 5000,
        stage: 'Juvenile',
        happiness: 85,
        energy: 40,
        abilities: ['XP Boost +5%', 'Focus Shield'],
        imageSeed: 'Aurelius'
    });

    const [guardians] = useState([
        { id: 1, name: 'Aurelius', type: 'Phoenix', level: 4, stage: 'Juvenile', color: 'rose' },
        { id: 2, name: 'Hydro', type: 'Serpent', level: 1, stage: 'Egg', color: 'blue' },
        { id: 3, name: 'Terra', type: 'Golem', level: 1, stage: 'Egg', color: 'emerald' },
    ]);

    return (
        <Layout title="Focus Guardians">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                {loading ? (
                    <div className="h-96 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[4rem]" />
                ) : (
                    <>
                        {/* Hero / Active Guardian */}
                        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl border border-indigo-500/20">
                            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/10 blur-[150px] rounded-full -mr-80 -mt-80" />

                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        animate={{ y: [0, -20, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative w-64 h-64 md:w-80 md:h-80"
                                    >
                                        <div className="absolute inset-0 bg-primary-500/20 blur-[60px] rounded-full animate-pulse" />
                                        <div className="relative z-10 w-full h-full bg-slate-800/40 backdrop-blur-3xl rounded-[4rem] border-2 border-white/10 p-12 shadow-2xl flex items-center justify-center overflow-hidden">
                                            <img
                                                src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${activeGuardian.imageSeed}`}
                                                alt="Guardian"
                                                className="w-full h-full object-contain filter drop-shadow-2xl"
                                            />
                                        </div>

                                        {/* Orbiting Stats */}
                                        <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-xl flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                                                <Heart size={16} fill="white" />
                                            </div>
                                            <div>
                                                <span className="block text-[8px] font-black uppercase tracking-widest text-white/50">Happiness</span>
                                                <span className="text-sm font-black">{activeGuardian.happiness}%</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-4 py-1.5 bg-primary-500/20 text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-500/30">
                                                {activeGuardian.stage} {activeGuardian.type}
                                            </span>
                                            <span className="text-white/40 font-black tracking-widest text-xs uppercase">LVL {activeGuardian.level}</span>
                                        </div>
                                        <h1 className="text-5xl font-black tracking-tighter mb-4">{activeGuardian.name}</h1>
                                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                                            Your {activeGuardian.type} grows as you study. It currently grants you a 5% bonus to all XP gained during focus sessions.
                                        </p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                                                <span>Growth to Next Stage</span>
                                                <span>{Math.round((activeGuardian.xp / activeGuardian.nextLevelXp) * 100)}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(activeGuardian.xp / activeGuardian.nextLevelXp) * 100}%` }}
                                                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button className="flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-xl">
                                                <Zap size={16} fill="currentColor" />
                                                Feed (50 Coins)
                                            </button>
                                            <button className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                                                <Award size={16} />
                                                Abilities
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {guardians.map((guardian) => (
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    key={guardian.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl flex items-center gap-6 relative group cursor-pointer"
                                >
                                    <div className={`w-20 h-20 rounded-[1.5rem] bg-${guardian.color}-50 dark:bg-${guardian.color}-900/10 flex items-center justify-center border border-${guardian.color}-100 dark:border-${guardian.color}-800 transition-all group-hover:scale-110`}>
                                        <img src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${guardian.name}`} alt="Guardian" className="w-12 h-12" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">{guardian.name}</h3>
                                            {guardian.id === activeGuardian.id && (
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            )}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{guardian.stage} {guardian.type}</p>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-xs font-bold text-slate-500">LVL {guardian.level}</span>
                                            <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[3rem] flex flex-col items-center justify-center p-8 group hover:border-primary-500/30 transition-all cursor-pointer">
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                    <Star size={24} className="text-slate-300 group-hover:text-primary-500" />
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-primary-500 transition-colors">Summon New Guardian</p>
                            </div>
                        </div>

                        {/* Growth Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card title="How it Works" className="relative h-full">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Study to Grow</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Every hour you focus in StudySync provides growth XP to your active guardian.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Unlock Perks</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">As they level up, guardians unlock passive study buffs and exclusive UI themes.</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Guardian Abilities">
                                <div className="space-y-4">
                                    {['XP Flow I', 'Concentration Shield', 'Coin Magnet'].map((ab, i) => (
                                        <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-primary-500" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ab}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Active</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default FocusGuardian;
