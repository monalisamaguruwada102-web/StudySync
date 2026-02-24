import React from 'react';
import { motion } from 'framer-motion';

const LoadingReactor = ({ size = 'md', color = 'primary', message = 'Loading System...' }) => {
    const dimensions = {
        sm: 'w-12 h-12',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    }[size];

    const colors = {
        primary: 'from-primary-500 to-primary-700 shadow-primary-500/50',
        accent: 'from-accent-500 to-accent-700 shadow-accent-500/50',
        purple: 'from-purple-500 to-purple-700 shadow-purple-500/50',
        emerald: 'from-emerald-500 to-emerald-700 shadow-emerald-500/50'
    }[color];

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`relative ${dimensions}`}>
                {/* Outer Ring */}
                <motion.div
                    className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Rotating Reactor Core */}
                <motion.div
                    className={`absolute inset-2 rounded-full bg-gradient-to-tr ${colors} shadow-lg opacity-80 blur-[2px]`}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm" />
                </motion.div>

                {/* Pulsing Center */}
                <motion.div
                    className={`absolute inset-6 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]`}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Orbiting Particle */}
                <motion.div
                    className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-white rounded-full shadow-[0_0_10px_white]"
                    animate={{
                        rotate: 360,
                        transformOrigin: `0 ${size === 'sm' ? '24px' : size === 'md' ? '48px' : '64px'}`
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {message && (
                <motion.p
                    className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {message}
                </motion.p>
            )}
        </div>
    );
};

export default LoadingReactor;
