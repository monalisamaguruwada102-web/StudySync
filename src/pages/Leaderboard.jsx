import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { Trophy, Medal, Crown, Star, ArrowUp, ArrowDown, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getLeague } from '../utils/gamification';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    const { user: currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await api.get('/leaderboard');
                setLeaderboard(data);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (index) => {
        switch (index) {
            case 0: return <Crown className="text-yellow-400 w-6 h-6 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
            case 1: return <Medal className="text-slate-300 w-6 h-6" />;
            case 2: return <Medal className="text-orange-400 w-6 h-6" />;
            default: return <span className="text-sm font-black text-slate-400">{index + 1}</span>;
        }
    };

    return (
        <Layout title="Global Leaderboard">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 mx-auto"
                    >
                        <Trophy size={40} />
                    </motion.div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">The Academy Hall of Fame</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Compete with students globally and climb the leagues.</p>
                </div>

                <div className="relative">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-primary-500/5 blur-[100px] rounded-full pointer-events-none" />

                    <Card className="relative overflow-hidden border-slate-200/50 dark:border-slate-800 shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-3 px-2">
                                <thead>
                                    <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-6 py-2">Rank</th>
                                        <th className="px-6 py-2">Student</th>
                                        <th className="px-6 py-2">League</th>
                                        <th className="px-6 py-2 text-right">XP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((user, index) => {
                                        const league = getLeague(user.level || 1);
                                        const isMe = user.id === currentUser?.id;

                                        return (
                                            <motion.tr
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                key={user.id}
                                                className={`group transition-all duration-300 ${isMe ? 'bg-primary-500/10 dark:bg-primary-500/5 scale-[1.02] shadow-xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                            >
                                                <td className="px-6 py-4 first:rounded-l-2xl">
                                                    <div className="flex items-center justify-center w-10">
                                                        {getRankIcon(index)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg ${isMe ? 'bg-primary-600 shadow-primary-500/50' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                            {user.name?.substring(0, 2).toUpperCase() || 'ST'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold ${isMe ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>
                                                                    {user.name || 'Anonymous Student'}
                                                                </span>
                                                                {isMe && <span className="bg-primary-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">You</span>}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Level {user.level || 1}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${league.color} ${league.bg} ${league.border}`}>
                                                        {league.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right last:rounded-r-2xl">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-1">
                                                            {user.xp?.toLocaleString() || 0}
                                                            <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-green-500 uppercase tracking-tighter">
                                                            <ArrowUp size={10} />
                                                            Trending
                                                        </div>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {loading && (
                                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">
                                    Loadinghall of fame...
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Leaderboard;
