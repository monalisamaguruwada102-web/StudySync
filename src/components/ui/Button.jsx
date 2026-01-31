import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = 'px-6 py-3 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden transition-all duration-300 tracking-wide';

    const variants = {
        primary: `
            bg-gradient-to-r from-primary-600 to-primary-700 
            text-white 
            shadow-xl shadow-primary-500/40 
            hover:shadow-2xl hover:shadow-primary-600/50
            border border-primary-500/20
            hover:from-primary-500 hover:to-primary-600
        `,
        secondary: `
            bg-gradient-to-r from-white to-slate-50 
            dark:from-slate-800 dark:to-slate-900 
            text-slate-700 dark:text-slate-200 
            border border-slate-300 dark:border-slate-600
            hover:border-slate-400 dark:hover:border-slate-500
            shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50
            hover:shadow-xl
        `,
        accent: `
            bg-gradient-to-r from-accent-500 to-pink-500 
            text-white 
            shadow-xl shadow-accent-500/40 
            hover:shadow-2xl hover:shadow-accent-600/50
            border border-accent-400/20
            hover:from-accent-400 hover:to-pink-400
        `,
        ghost: `
            bg-transparent 
            text-slate-600 dark:text-slate-400 
            hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50
            dark:hover:from-slate-800 dark:hover:to-slate-900
            border border-transparent
            hover:border-slate-200 dark:hover:border-slate-700
        `,
        danger: `
            bg-gradient-to-r from-red-500 to-red-600 
            text-white 
            shadow-xl shadow-red-500/40 
            hover:shadow-2xl hover:shadow-red-600/50
            border border-red-400/20
            hover:from-red-400 hover:to-red-500
        `,
    };

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${className} group`}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {/* Shimmer effect on hover */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>

            {/* Glow effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-gradient-to-r from-current/20 to-current/20 -z-10" />
        </motion.button>
    );
};

export default Button;
