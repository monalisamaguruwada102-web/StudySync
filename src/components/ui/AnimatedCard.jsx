import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({
    children,
    className = '',
    title = '',
    subtitle = '',
    icon: Icon = null,
    iconColor = 'text-primary-500',
    gradient = false,
    glow = false,
    delay = 0
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: delay * 0.1, ease: 'easeOut' }}
            whileHover={{
                y: -6,
                boxShadow: glow
                    ? '0 0 30px rgba(99, 102, 241, 0.3), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            className={`
                relative overflow-hidden rounded-2xl p-6
                bg-white dark:bg-slate-900
                border border-slate-100 dark:border-slate-800
                transition-all duration-300
                ${gradient ? 'gradient-border' : ''}
                ${className}
            `}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    className="absolute inset-0 -translate-x-full"
                    animate={{
                        translateX: ['-100%', '200%']
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 5,
                        ease: 'easeInOut'
                    }}
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        width: '50%'
                    }}
                />
            </div>

            {/* Background Glow */}
            {glow && (
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
            )}

            {/* Header */}
            {(title || Icon) && (
                <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                        {title && (
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {Icon && (
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${iconColor}`}
                        >
                            <Icon size={22} />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};

// Stat Card Variant
export const StatCard = ({
    icon: Icon,
    label,
    value,
    trend,
    trendUp = true,
    color = 'text-primary-500',
    delay = 0
}) => {
    return (
        <AnimatedCard glow delay={delay}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                        {label}
                    </p>
                    <motion.h3
                        className="text-3xl font-black text-slate-900 dark:text-slate-100"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: delay * 0.1 + 0.2 }}
                    >
                        {value}
                    </motion.h3>
                </div>
                {Icon && (
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${color}`}
                    >
                        <Icon size={24} />
                    </motion.div>
                )}
            </div>
            {trend && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: delay * 0.1 + 0.3 }}
                    className="mt-4 flex items-center gap-2 text-xs"
                >
                    <span className={`flex items-center gap-1 font-semibold ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
                        <svg
                            className={`w-3 h-3 ${!trendUp && 'rotate-180'}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">{trend}</span>
                </motion.div>
            )}
        </AnimatedCard>
    );
};

// Feature Card Variant
export const FeatureCard = ({
    icon: Icon,
    title,
    description,
    color = 'from-primary-500 to-purple-500',
    delay = 0
}) => {
    return (
        <AnimatedCard gradient delay={delay}>
            <motion.div
                whileHover={{ scale: 1.05 }}
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}
            >
                {Icon && <Icon size={24} className="text-white" />}
            </motion.div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
        </AnimatedCard>
    );
};

export default AnimatedCard;
