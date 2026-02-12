import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import Button from './Button';
import Input from './Input';

const NotificationDialog = ({
    title,
    message,
    type,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    isPrompt,
    placeholder,
    onClose
}) => {
    const [inputValue, setInputValue] = useState('');

    const icons = {
        warning: <AlertTriangle size={32} className="text-amber-500" />,
        info: <Info size={32} className="text-primary-500" />,
        success: <CheckCircle2 size={32} className="text-emerald-500" />,
        error: <AlertTriangle size={32} className="text-red-500" />
    };

    const bgs = {
        warning: 'bg-amber-500/10 border-amber-500/20',
        info: 'bg-primary-500/10 border-primary-500/20',
        success: 'bg-emerald-500/10 border-emerald-500/20',
        error: 'bg-red-500/10 border-red-500/20'
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onCancel}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-3xl ${bgs[type] || bgs.info}`}>
                            {icons[type] || icons.info}
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                        {title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                        {message}
                    </p>

                    {isPrompt && (
                        <div className="mb-8">
                            <Input
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={placeholder}
                                className="!rounded-2xl border-2 focus:ring-primary-500/10"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onConfirm(inputValue);
                                }}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            className="flex-1 !py-4 !rounded-2xl font-bold uppercase tracking-widest text-xs"
                            onClick={onCancel}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            variant={type === 'error' ? 'danger' : 'primary'}
                            className={`flex-1 !py-4 !rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg ${type === 'error' ? 'shadow-red-500/20' : 'shadow-primary-500/20'}`}
                            onClick={() => onConfirm(isPrompt ? inputValue : true)}
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default NotificationDialog;
