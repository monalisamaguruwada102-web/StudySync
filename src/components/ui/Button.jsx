import React from 'react';
import { motion } from 'framer-motion';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden';

    const variants = {
        primary: 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 hover:shadow-primary-600/40 border border-transparent',
        secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
        accent: 'bg-accent-500 text-white shadow-lg shadow-accent-500/30 hover:bg-accent-600 border border-transparent',
        ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 border border-transparent',
    };

    return (
        <motion.button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export default Button;
