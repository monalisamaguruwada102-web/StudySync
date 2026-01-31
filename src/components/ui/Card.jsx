import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', title = '', HeaderAction = null }) => {
    return (
        <motion.div
            className={`
                bg-white dark:bg-slate-900 
                rounded-2xl 
                border border-slate-200/50 dark:border-slate-700/50
                shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50
                overflow-hidden 
                transition-all duration-300 
                relative
                group
                ${className}
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -8,
                scale: 1.01,
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.1)',
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Premium gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-primary-500/10 group-hover:via-purple-500/5 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none rounded-2xl" />

            {/* Ambient glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/20 group-hover:to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

            {(title || HeaderAction) && (
                <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between relative z-10 bg-gradient-to-r from-transparent via-slate-50/50 dark:via-slate-800/50 to-transparent">
                    {title && (
                        <h3 className="font-bold text-lg bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                            {title}
                        </h3>
                    )}
                    {HeaderAction && <div>{HeaderAction}</div>}
                </div>
            )}
            <div className="p-6 relative z-10">
                {children}
            </div>

            {/* Subtle corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>
    );
};

export default Card;
