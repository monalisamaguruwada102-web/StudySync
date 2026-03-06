import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Users, Zap, Timer, Star, Shield, ArrowRight, CheckCircle2, AlertCircle, Sword, User, Search, Play, X, ShieldAlert } from 'lucide-react';

const KnowledgeDuels = () => {
    const { user } = useAuth();
    const [matching, setMatching] = useState(false);
    const [duelStarted, setDuelStarted] = useState(false);
    const [opponent, setOpponent] = useState(null);
    const [timer, setTimer] = useState(1500); // 25 min duel
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/api/premium/duels/history');
                setHistory(res.data);
            } catch (err) {
                console.error('Failed to fetch duel history:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const startMatchmaking = () => {
        setMatching(true);
        setTimeout(() => {
            setOpponent({
                name: 'Scholar_Alex',
                level: 14,
                xp: 12450,
                streak: 12,
                avatarSeed: 'Alex'
            });
            setMatching(false);
        }, 3000);
    };

    const startDuel = () => {
        setDuelStarted(true);
    };

    if (duelStarted) {
        return (
            <Layout title="Focus Duel In Progress">
                <div className="max-w-4xl mx-auto py-10">
                    <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden border-4 border-primary-500 shadow-[0_0_80px_rgba(99,102,241,0.3)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="flex items-center justify-between w-full mb-12">
                                {/* User Side */}
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-primary-400 p-4 mb-4">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} alt="You" />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-primary-400">You</h3>
                                    <span className="text-2xl font-black">420 XP</span>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Swords size={48} className="text-rose-500 animate-bounce mb-4" />
                                    <div className="bg-white/10 px-6 py-3 rounded-full border border-white/20">
                                        <span className="text-4xl font-black font-mono">
                                            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>
                                </div>

                                {/* Opponent Side */}
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-rose-400 p-4 mb-4">
                                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent?.avatarSeed}`} alt="Opponent" />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-rose-400">{opponent?.name}</h3>
                                    <span className="text-2xl font-black">385 XP</span>
                                </div>
                            </div>

                            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-8 border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary-500 to-rose-500"
                                    initial={{ width: "50%" }}
                                    animate={{ width: "55%" }}
                                />
                            </div>

                            <p className="text-slate-400 font-medium italic text-sm mb-12">
                                Stay focused! The first one to lose focus loses the duel.
                            </p>

                            <button
                                onClick={() => setDuelStarted(false)}
                                className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] border border-white/10 transition-all"
                            >
                                Surrender Duel
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Knowledge Duels">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-rose-500/20">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 blur-[130px] rounded-full -mr-64 -mt-64" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-rose-500 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.4)]">
                                    <Swords className="text-white" size={32} />
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter italic uppercase">Knowledge Duels</h1>
                            </div>
                            <p className="text-rose-100/60 text-lg font-medium max-w-xl leading-relaxed">
                                Enter the arena. Challenge other students to 1v1 productivity battles. Earn double SyncCoins and exclusive legendary badges.
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Trophy className="text-yellow-400" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Global Rank: #42</span>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Zap className="text-primary-400" size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Duel Wins: 15</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[400px] bg-white/10 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/10 flex flex-col items-center shadow-2xl">
                            <AnimatePresence mode="wait">
                                {matching ? (
                                    <motion.div
                                        key="matching"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.1 }}
                                        className="text-center space-y-8"
                                    >
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mx-auto" />
                                            <Search size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Finding Opponent</h3>
                                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest animate-pulse">Scanning the Hall of Fame...</p>
                                        </div>
                                        <button
                                            onClick={() => setMatching(false)}
                                            className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 transition-colors"
                                        >
                                            Cancel Search
                                        </button>
                                    </motion.div>
                                ) : opponent ? (
                                    <motion.div
                                        key="opponent"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-center space-y-8 w-full"
                                    >
                                        <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Match Found!</div>
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-rose-500 p-6 mx-auto shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent.avatarSeed}`} alt="Opponent" />
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-rose-600 text-[10px] font-black px-3 py-1 rounded-full border-2 border-slate-900">
                                                LVL {opponent.level}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black tracking-tight">{opponent.name}</h3>
                                            <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{opponent.streak} Day Streak 🔥</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setOpponent(null)}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                                            >
                                                Decline
                                            </button>
                                            <button
                                                onClick={startDuel}
                                                className="flex-1 py-4 rounded-2xl bg-rose-500 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-500/40 hover:bg-rose-600 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Play size={14} fill="currentColor" />
                                                Accept
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        className="text-center space-y-10"
                                    >
                                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                                            <User size={64} className="text-white/20 mx-auto" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-widest mb-4">Ready for Battle?</h3>
                                            <p className="text-xs text-white/40 font-medium leading-relaxed px-4">
                                                Duel format: 25 Minute Focus Session.<br />
                                                Winning condition: Most XP Gained.
                                            </p>
                                        </div>
                                        <button
                                            onClick={startMatchmaking}
                                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-rose-500 hover:text-white transition-all transform active:scale-95"
                                        >
                                            Search for Duel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <Card title="Recent Battle History">
                        <div className="space-y-4">
                            {loading ? (
                                [1, 2].map(i => (
                                    <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-2xl" />
                                ))
                            ) : (
                                history.map((duel) => (
                                    <div key={duel.id} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-primary-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${duel.result === 'Victory' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {duel.result === 'Victory' ? <Trophy size={18} /> : <Sword size={18} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">vs {duel.opponent}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{duel.duration} • {duel.result}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-black ${duel.result === 'Victory' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {duel.result === 'Victory' ? `+${duel.xpEarned} XP` : `+${duel.xpEarned} XP`}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    <div className="space-y-10">
                        <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 flex items-center gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                            <div className="p-6 bg-white/20 rounded-3xl border border-white/20">
                                <ShieldAlert size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-widest mb-2">Fair Play Shield</h3>
                                <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                                    Our anti-cheat system monitors focus status in real-time. Leaving your session results in an automatic loss.
                                </p>
                            </div>
                        </div>

                        <Card title="Recent Duel Results">
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Victory vs. User_99</span>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-600">+150 Coins</span>
                                </div>
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Defeat vs. MasterMind</span>
                                    </div>
                                    <span className="text-[10px] font-black text-rose-600">-25 Coins</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default KnowledgeDuels;
