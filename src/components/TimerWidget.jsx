import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';
import { Brain, Coffee, Timer } from 'lucide-react';

const TimerWidget = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isRunning, timeLeft, isBreak, formatTime } = useTimer();

    // Don't show widget on the focus page or if timer is not running
    if (!isRunning || location.pathname === '/focus') {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => navigate('/focus')}
                className="fixed bottom-6 right-6 z-50 cursor-pointer group"
            >
                <div className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 ${isBreak
                        ? 'bg-green-500/90 border-green-400/50 hover:bg-green-600/90'
                        : 'bg-primary-600/90 border-primary-500/50 hover:bg-primary-700/90'
                    }`}>
                    {/* Icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                        {isBreak ? (
                            <Coffee size={16} className="text-white animate-bounce" />
                        ) : (
                            <Brain size={16} className="text-white animate-pulse" />
                        )}
                    </div>

                    {/* Timer Display */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                            {isBreak ? 'Break Time' : 'Focus Mode'}
                        </span>
                        <span className="text-xl font-black tabular-nums text-white">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Pulse Animation */}
                    <div className={`absolute inset-0 rounded-2xl animate-ping opacity-20 ${isBreak ? 'bg-green-400' : 'bg-primary-400'
                        }`} style={{ animationDuration: '2s' }} />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Click to open Focus Mode
                    <div className="absolute top-full right-4 w-2 h-2 bg-slate-900 transform rotate-45 -translate-y-1" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TimerWidget;
