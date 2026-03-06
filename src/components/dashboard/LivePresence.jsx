import React, { useState, useEffect } from 'react';
import { Users, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const LivePresence = () => {
    const [activeCount, setActiveCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchActiveCount = async () => {
        try {
            const { data } = await api.get('/presence/active-count');
            setActiveCount(data.count || 0);
        } catch (error) {
            console.error('Failed to fetch active count:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveCount();
        const interval = setInterval(fetchActiveCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading && activeCount === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-sm shadow-emerald-500/10"
        >
            <div className="relative">
                <Users size={14} className="text-emerald-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap">
                {activeCount > 1 ? `${activeCount} Students Studying Now` : 'You are currently focused'}
            </span>
            {activeCount > 5 && (
                <Flame size={12} className="text-orange-500 animate-pulse" />
            )}
        </motion.div>
    );
};

export default LivePresence;
