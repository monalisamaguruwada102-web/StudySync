import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const ComingSoonBadge = ({
    size = 'md',
    position = 'inline',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'text-[8px] px-2 py-0.5 gap-1',
        md: 'text-[10px] px-3 py-1 gap-1.5',
        lg: 'text-xs px-4 py-1.5 gap-2'
    };

    const positionClasses = {
        inline: '',
        'top-right': 'absolute -top-2 -right-2',
        'top-left': 'absolute -top-2 -left-2',
        overlay: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                ${sizeClasses[size]}
                ${positionClasses[position]}
                ${className}
                inline-flex items-center justify-center
                font-black uppercase tracking-widest
                bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500
                text-white rounded-full
                shadow-lg shadow-purple-500/50
                relative overflow-hidden
                z-10
            `}
        >
            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                    x: ['-200%', '200%']
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Content */}
            <Sparkles size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} className="relative z-10" />
            <span className="relative z-10">Coming Soon</span>
        </motion.div>
    );
};

export default ComingSoonBadge;
