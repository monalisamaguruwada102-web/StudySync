import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Video, Mic, MessageSquare, Plus, ArrowRight, Shield, Globe, Lock } from 'lucide-react';
import api from '../services/api';

const SyncRooms = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([
        { id: 1, name: 'Deep Work: Computer Science', participants: 12, capacity: 20, type: 'Public', status: 'Studying', color: 'indigo' },
        { id: 2, name: 'Lofi Study Beats & Coffee', participants: 45, capacity: 100, type: 'Public', status: 'Focusing', color: 'emerald' },
        { id: 3, name: 'Medical Finals Prep', participants: 8, capacity: 15, type: 'Private', status: 'Active', color: 'rose' },
        { id: 4, name: 'Mathematics Masters', participants: 5, capacity: 10, type: 'Public', status: 'Reviewing', color: 'amber' },
    ]);
    const [activeRoom, setActiveRoom] = useState(null);

    const joinRoom = (room) => {
        setActiveRoom(room);
    };

    if (activeRoom) {
        return (
            <Layout title={`Room: ${activeRoom.name}`}>
                <div className="max-w-7xl mx-auto py-6 h-[80vh] flex flex-col">
                    <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveRoom(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                <Plus size={24} className="rotate-45" />
                            </button>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{activeRoom.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeRoom.participants + 1} Studying Now</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-primary-500 transition-all shadow-sm">
                                <Video size={20} />
                            </button>
                            <button className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-primary-500 transition-all shadow-sm">
                                <Mic size={20} />
                            </button>
                            <button className="px-8 py-4 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all">
                                Leave Room
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
                        {/* Participants Grid */}
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pr-4 custom-scrollbar">
                            {[user, ...Array(activeRoom.participants)].map((_, i) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    key={i}
                                    className="aspect-square bg-slate-900 rounded-[3rem] relative overflow-hidden group border-4 border-transparent hover:border-primary-500 transition-all"
                                >
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i === 0 ? user?.name : i}`}
                                        alt="Avatar"
                                        className="w-full h-full object-cover p-8 opacity-80"
                                    />
                                    <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                                            {i === 0 ? 'You (Studying)' : `Scholar #${i + 420}`}
                                        </span>
                                        <div className="flex gap-2">
                                            <Mic size={12} className="text-white/40" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Chat Sidebar */}
                        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                <MessageSquare className="text-primary-500" size={20} />
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Live Session Chat</h3>
                            </div>
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                                <div className="text-center py-10 opacity-40">
                                    <Globe size={32} className="mx-auto mb-3" />
                                    <p className="text-[10px] uppercase font-black tracking-widest">Connect with others</p>
                                </div>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Send encouragement..."
                                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-primary-500 transition-all text-slate-900 dark:text-white"
                                    />
                                    <button className="p-2 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20">
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Sync-Rooms">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/20 blur-[130px] rounded-full -mr-64 -mt-64" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                                <Users className="text-primary-400" size={32} />
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter">Sync-Rooms</h1>
                        </div>
                        <p className="text-indigo-200 text-lg font-medium max-w-xl leading-relaxed">
                            Don't study alone. Join live focus rooms with students worldwide and boost your productivity through mutual accountability.
                        </p>
                        <div className="mt-10 flex gap-4">
                            <button className="px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/30 transition-all active:scale-95 flex items-center gap-3">
                                <Plus size={18} strokeWidth={3} />
                                Create Private Room
                            </button>
                            <div className="flex items-center gap-3 px-6 py-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} className="w-8 h-8 rounded-full border-2 border-slate-900" />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-300">1.2k Studying Now</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {rooms.map((room) => (
                        <motion.div
                            whileHover={{ y: -10 }}
                            key={room.id}
                            className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-xl relative overflow-hidden group cursor-pointer`}
                            onClick={() => joinRoom(room)}
                        >
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-${room.color}-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />

                            <div className="flex items-start justify-between relative z-10 mb-8">
                                <div className={`p-5 bg-${room.color}-50 dark:bg-${room.color}-900/10 rounded-[2rem] text-${room.color}-500 shadow-sm border border-${room.color}-100 dark:border-${room.color}-900/30 transition-colors group-hover:bg-${room.color}-500 group-hover:text-white`}>
                                    <Video size={28} />
                                </div>
                                <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${room.type === 'Public' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-rose-100 text-rose-600 border border-rose-200'}`}>
                                    {room.type === 'Public' ? <Globe size={12} /> : <Lock size={12} />}
                                    {room.type}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight pr-10">{room.name}</h3>
                            <div className="flex items-center gap-6 mt-6">
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</span>
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        {room.status}
                                    </span>
                                </div>
                                <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />
                                <div>
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Participants</span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{room.participants}/{room.capacity} Scholars</span>
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="w-10 h-10 rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${room.id + i}`} alt="Avatar" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-2xl border-4 border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                        <Plus size={14} className="text-slate-400" />
                                    </div>
                                </div>
                                <button className={`p-4 bg-${room.color}-500 text-white rounded-2xl shadow-xl shadow-${room.color}-500/20 group-hover:scale-110 active:scale-95 transition-all`}>
                                    <ArrowRight size={20} strokeWidth={3} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default SyncRooms;
