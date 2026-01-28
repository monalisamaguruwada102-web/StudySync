import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '../hooks/useFirestore';
import { taskService, pomodoroService } from '../services/firestoreService';
import {
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    Coffee,
    Brain,
    Zap,
    Volume2,
    VolumeX,
    Maximize,
    X
} from 'lucide-react';

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes

const DeepFocus = () => {
    const { data: tasks } = useFirestore(taskService.getAll);
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const pendingTasks = tasks.filter(t => t.status !== 'Completed');

    useEffect(() => {
        let interval;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleSessionEnd();
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const handleSessionEnd = async () => {
        setIsRunning(false);
        if (!isBreak) {
            setSessionsCompleted(prev => prev + 1);
            // Log the pomodoro session
            try {
                await pomodoroService.add({
                    taskId: selectedTask?.id || null,
                    duration: 25,
                    completedAt: new Date().toISOString()
                });
            } catch (e) {
                console.error('Failed to log session', e);
            }
            setIsBreak(true);
            setTimeLeft(BREAK_TIME);
        } else {
            setIsBreak(false);
            setTimeLeft(FOCUS_TIME);
        }
    };

    const toggleTimer = () => setIsRunning(!isRunning);
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(isBreak ? BREAK_TIME : FOCUS_TIME);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = isBreak
        ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
        : ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-primary-500/20 rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                        }}
                        animate={{
                            y: [null, Math.random() * -500],
                            opacity: [0.2, 0.8, 0.2],
                        }}
                        transition={{
                            duration: 10 + Math.random() * 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            </div>

            {/* Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Header */}
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                    <X size={20} />
                    <span className="text-sm">Exit Focus</span>
                </a>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Maximize size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
                {/* Mode Indicator */}
                <motion.div
                    key={isBreak ? 'break' : 'focus'}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isBreak
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-primary-500/20 text-primary-400'
                        }`}
                >
                    {isBreak ? <Coffee size={18} /> : <Brain size={18} />}
                    <span className="text-sm font-bold uppercase tracking-widest">
                        {isBreak ? 'Break Time' : 'Deep Focus'}
                    </span>
                </motion.div>

                {/* Timer */}
                <div className="relative mb-12">
                    {/* Progress Ring */}
                    <svg className="w-80 h-80 transform -rotate-90">
                        <circle
                            cx="160"
                            cy="160"
                            r="150"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="8"
                        />
                        <motion.circle
                            cx="160"
                            cy="160"
                            r="150"
                            fill="none"
                            stroke={isBreak ? '#22c55e' : '#6366f1'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 150}
                            strokeDashoffset={2 * Math.PI * 150 * (1 - progress / 100)}
                            initial={false}
                            animate={{ strokeDashoffset: 2 * Math.PI * 150 * (1 - progress / 100) }}
                            transition={{ duration: 0.5 }}
                        />
                    </svg>

                    {/* Time Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            className="text-7xl font-black tracking-tight"
                            key={timeLeft}
                            initial={{ scale: 1.05 }}
                            animate={{ scale: 1 }}
                        >
                            {formatTime(timeLeft)}
                        </motion.span>
                        {selectedTask && (
                            <p className="text-sm text-slate-400 mt-2 max-w-[200px] text-center truncate">
                                {selectedTask.title}
                            </p>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 mb-12">
                    <button
                        onClick={resetTimer}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                    >
                        <RotateCcw size={24} />
                    </button>
                    <motion.button
                        onClick={toggleTimer}
                        whileTap={{ scale: 0.95 }}
                        className={`p-6 rounded-full transition-all shadow-xl ${isRunning
                            ? 'bg-white/10 hover:bg-white/20'
                            : 'bg-primary-600 hover:bg-primary-500'
                            }`}
                    >
                        {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </motion.button>
                    <button
                        onClick={handleSessionEnd}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
                    >
                        <CheckCircle size={24} />
                    </button>
                </div>

                {/* Task Selector */}
                <div className="w-full max-w-md">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 text-center">Working On</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {pendingTasks.slice(0, 5).map(task => (
                            <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedTask?.id === task.id
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                            >
                                {task.title}
                            </button>
                        ))}
                        {pendingTasks.length === 0 && (
                            <p className="text-sm text-slate-500 italic">No pending tasks</p>
                        )}
                    </div>
                </div>

                {/* Session Stats */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <Zap size={16} className="text-yellow-500" />
                        <span>{sessionsCompleted} sessions today</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Brain size={16} className="text-primary-500" />
                        <span>{sessionsCompleted * 25} min focused</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeepFocus;
