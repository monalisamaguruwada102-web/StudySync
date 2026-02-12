import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import Button from './ui/Button';
import { pomodoroService, studyLogService, moduleService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useFirestore } from '../hooks/useFirestore';

const PomodoroTimer = () => {
    const { refreshAuth } = useAuth();
    const { data: modules } = useFirestore(moduleService.getAll);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('study'); // 'study' or 'break'
    const [selectedModule, setSelectedModule] = useState('general');
    const MAX_MINUTES = 60;

    const timerRef = useRef(null);

    const handleModeSwitch = async () => {
        if (mode === 'study') {
            try {
                // Log to Pomodoro Sessions (Historical)
                await pomodoroService.add({
                    date: new Date().toISOString(),
                    type: 'study',
                    duration: minutes + (seconds / 60)
                });

                // ALSO LOG TO STUDY LOGS (For Heatmap Visibility)
                await studyLogService.add({
                    date: new Date().toISOString().split('T')[0],
                    topic: 'Pomodoro Focus Session',
                    hours: (minutes / 60) + (seconds / 3600),
                    moduleId: selectedModule
                });

                await refreshAuth(); // Update XP bar
            } catch (error) {
                console.error('Failed to save pomodoro session', error);
            }
        }

        const nextMode = mode === 'study' ? 'break' : 'study';
        setMode(nextMode);
        setMinutes(nextMode === 'study' ? 25 : 5);
        setSeconds(0);
        // Play sound or notification here
        if (Notification.permission === 'granted') {
            new Notification(nextMode === 'study' ? 'Break over! Time to study.' : 'Study session finished! Take a break.');
        }
    };

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                if (seconds < 59) {
                    setSeconds(s => s + 1);
                } else if (minutes < MAX_MINUTES - 1) {
                    setMinutes(m => m + 1);
                    setSeconds(0);
                } else {
                    // Timer reached 60 minutes
                    setMinutes(60);
                    setSeconds(0);
                    clearInterval(timerRef.current);
                    setIsActive(false);
                    handleModeSwitch();
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, minutes, seconds]);


    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('study');
        setMinutes(0);
        setSeconds(0);
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 mt-auto mx-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {mode === 'study' ? (
                        <BookOpen size={16} className="text-primary-500" />
                    ) : (
                        <Coffee size={16} className="text-accent-500" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {mode === 'study' ? 'Study Focus' : 'Short Break'}
                    </span>
                </div>
                <button onClick={resetTimer} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* Module Selector */}
            {mode === 'study' && !isActive && (
                <div className="mb-3">
                    <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(e.target.value)}
                        className="w-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="general">Global - No Module</option>
                        {modules.map(mod => (
                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="text-3xl font-mono font-bold text-slate-800 dark:text-slate-100 mb-4 text-center tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <Button
                variant={isActive ? 'ghost' : (mode === 'study' ? 'primary' : 'accent')}
                onClick={toggleTimer}
                className="w-full !py-2 flex items-center justify-center gap-2 text-sm"
            >
                {isActive ? <Pause size={16} /> : <Play size={16} />}
                {isActive ? 'Pause' : 'Start'}
            </Button>
        </div>
    );
};

export default PomodoroTimer;
