import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedBadge = ({ name, icon: Icon, color = 'primary', size = 'md' }) => {
    const colorClasses = {
        primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20 shadow-primary-500/20',
        gold: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-yellow-500/20',
        purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/20',
        green: 'bg-green-500/10 text-green-500 border-green-500/20 shadow-green-500/20',
    };

    const sizeClasses = {
        sm: 'p-2 text-[10px]',
        md: 'p-4 text-xs',
        lg: 'p-6 text-sm',
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className={`relative group rounded-2xl border backdrop-blur-md transition-all duration-300 ${colorClasses[color]} ${sizeClasses[size]} flex flex-col items-center gap-3 text-center cursor-help`}
        >
            {/* Animated Glow Backdrop */}
            <div className={`absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${color === 'primary' ? 'bg-primary-500' : color === 'gold' ? 'bg-yellow-500' : color === 'purple' ? 'bg-purple-500' : 'bg-green-500'}`} />

            {/* Icon Container with Shine Effect */}
            <div className="relative overflow-hidden rounded-full p-3 bg-white/5 border border-white/10">
                <Icon size={size === 'lg' ? 32 : 24} className="relative z-10" />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-45"
                    animate={{
                        x: ['-100%', '200%'],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut"
                    }}
                />
            </div>

            <div className="relative z-10">
                <span className="font-black uppercase tracking-widest block mb-1">{name}</span>
                <span className="text-[10px] opacity-60 font-medium">Achievement Unlocked</span>
            </div>

            {/* Sparkle Particles on Hover */}
            <AnimatePresence>
                <div className="absolute -inset-2 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-1 h-1 rounded-full ${color === 'primary' ? 'bg-primary-400' : 'bg-yellow-400'}`}
                            initial={{ opacity: 0, scale: 0 }}
                            whileHover={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                                x: (Math.random() - 0.5) * 50,
                                y: (Math.random() - 0.5) * 50,
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    ))}
                </div>
            </AnimatePresence>
        </motion.div>
    );
};

export default AnimatedBadge;
