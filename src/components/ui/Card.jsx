import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', title = '', HeaderAction = null }) => {
    return (
        <motion.div
            className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300 ${className}`}
            whileHover={{ y: -5, borderColor: 'rgba(99, 102, 241, 0.2)' }}
            transition={{ duration: 0.2 }}
        >
            {(title || HeaderAction) && (
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {title && <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
                    {HeaderAction && <div>{HeaderAction}</div>}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
        </motion.div>
    );
};

export default Card;
