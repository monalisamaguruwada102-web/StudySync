import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

function Modal({ isOpen, onClose, title, children, footer, size }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-50 flex items-center justify-center ${size === 'full' ? 'p-0' : 'p-4'}`}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transition-colors duration-300
                            ${size === 'full' ? 'w-full h-full rounded-none' : 'w-full max-w-lg rounded-2xl'}
                        `}
                    >
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                            <Button variant="ghost" onClick={onClose} className="!p-1">
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {children}
                        </div>

                        {footer && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
