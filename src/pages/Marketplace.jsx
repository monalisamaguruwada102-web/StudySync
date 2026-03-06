import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Star, Zap, Shield, Ice, CheckCircle2, AlertCircle, Coins } from 'lucide-react';

const Marketplace = () => {
    const { user, refreshUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await api.get('/api/marketplace/items');
                setItems(res.data);
            } catch (err) {
                console.error('Failed to fetch items:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    const handlePurchase = async (itemId) => {
        setPurchasing(itemId);
        setMessage(null);
        try {
            const res = await api.post('/api/marketplace/purchase', { itemId });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Purchase successful! Item added to inventory.' });
                await refreshUser();
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Purchase failed.' });
        } finally {
            setPurchasing(null);
        }
    };

    const getIcon = (iconName) => {
        switch (iconName) {
            case 'Ice': return <Ice size={24} className="text-cyan-400" />;
            case 'Shield': return <Shield size={24} className="text-amber-400" />;
            case 'Zap': return <Zap size={24} className="text-yellow-400" />;
            default: return <Star size={24} className="text-primary-400" />;
        }
    };

    return (
        <Layout title="Sync-Market">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                {/* Balance Header */}
                <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 blur-[120px] rounded-full -mr-48 -mt-48" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full -ml-32 -mb-32" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <ShoppingBag className="text-primary-400" size={32} />
                                <h1 className="text-4xl font-black tracking-tight">Sync-Market</h1>
                            </div>
                            <p className="text-slate-400 text-lg font-medium max-w-md">
                                Exchange your hard-earned SyncCoins for premium cosmetics and powerful study boosters.
                            </p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center min-w-[280px]">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-2">Available Balance</span>
                            <div className="flex items-center gap-4">
                                <Coins size={40} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                <span className="text-5xl font-black">{user?.syncCoins || 0}</span>
                            </div>
                            <button className="mt-6 text-[10px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-300 transition-colors">
                                How to earn more?
                            </button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`p-4 rounded-2xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}
                        >
                            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            <span className="text-sm font-bold">{message.text}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem]" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {items.map((item) => {
                            const isOwned = user?.inventory?.includes(item.id);
                            return (
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    key={item.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-xl group hover:border-primary-500/30 transition-all"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-all relative">
                                        {getIcon(item.icon)}
                                        {isOwned && (
                                            <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{item.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed px-2">
                                        {item.description}
                                    </p>

                                    <div className="mt-auto w-full">
                                        <button
                                            disabled={purchasing === item.id || (isOwned && item.type === 'cosmetic')}
                                            onClick={() => handlePurchase(item.id)}
                                            className={`
                                                w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-xs uppercase tracking-widest
                                                ${isOwned && item.type === 'cosmetic'
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                                    : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/30 active:scale-95'
                                                }
                                                ${purchasing === item.id ? 'opacity-50 cursor-wait' : ''}
                                            `}
                                        >
                                            {purchasing === item.id ? (
                                                'Processing...'
                                            ) : isOwned && item.type === 'cosmetic' ? (
                                                'Owned'
                                            ) : (
                                                <>
                                                    <Coins size={14} />
                                                    {item.price} Coins
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Marketplace;
