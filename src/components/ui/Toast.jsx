import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const Toast = ({ message, type, duration, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const variants = {
        success: {
            bg: 'bg-emerald-500',
            icon: <CheckCircle2 size={20} className="text-white" />,
            border: 'border-emerald-400/20'
        },
        error: {
            bg: 'bg-red-500',
            icon: <XCircle size={20} className="text-white" />,
            border: 'border-red-400/20'
        },
        warning: {
            bg: 'bg-amber-500',
            icon: <AlertCircle size={20} className="text-white" />,
            border: 'border-amber-400/20'
        },
        info: {
            bg: 'bg-primary-500',
            icon: <Info size={20} className="text-white" />,
            border: 'border-primary-400/20'
        }
    };

    const style = variants[type] || variants.info;

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-4 p-4 rounded-2xl shadow-2xl ${style.bg} border-b-4 ${style.border} min-w-[300px] max-w-md group`}
        >
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-xl">
                {style.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-white leading-tight uppercase tracking-tight">
                    {message}
                </p>
            </div>
            <button
                onClick={onClose}
                className="p-1 px-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export default Toast;
