import React from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import Button from './ui/Button';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService } from '../services/firestoreService';
import { useTimer } from '../context/TimerContext';

const PomodoroTimer = ({ compact }) => {
    const { data: modules = [] } = useFirestore(moduleService.getAll);
    const {
        timeLeft,
        isRunning,
        isBreak,
        selectedTask,
        setSelectedTask,
        start,
        pause,
        reset,
        formatTime,
    } = useTimer();

    const toggleTimer = () => isRunning ? pause() : start();

    const handleModuleChange = (e) => {
        const moduleId = e.target.value;
        const module = modules.find(m => m.id === moduleId);
        setSelectedTask(module ? { id: 'module-focus', title: module.name, moduleId: module.id } : null);
    };

    return (
        <div className={`p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 mt-auto ${compact ? '' : 'mx-4 mb-4'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {isBreak ? (
                        <Coffee size={16} className="text-accent-500" />
                    ) : (
                        <BookOpen size={16} className="text-primary-500" />
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isBreak ? 'Short Break' : 'Study Focus'}
                    </span>
                </div>
                <button onClick={reset} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <RotateCcw size={14} />
                </button>
            </div>

            {/* Module Selector */}
            {!isBreak && !isRunning && (
                <div className="mb-3">
                    <select
                        value={selectedTask?.moduleId || 'general'}
                        onChange={handleModuleChange}
                        className="w-full text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                        <option value="general">Global - No Module</option>
                        {modules.map(mod => (
                            <option key={mod.id} value={mod.id}>{mod.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* In-Session Display */}
            {isRunning && selectedTask && (
                <div className="mb-2 text-center">
                    <span className="text-[10px] font-bold text-primary-500 uppercase tracking-tighter truncate block px-2">
                        {selectedTask.title}
                    </span>
                </div>
            )}

            <div className={`font-mono font-bold text-slate-800 dark:text-slate-100 mb-4 text-center tabular-nums ${compact ? 'text-2xl' : 'text-3xl'}`}>
                {formatTime(timeLeft)}
            </div>

            <Button
                variant={isRunning ? 'ghost' : (isBreak ? 'accent' : 'primary')}
                onClick={toggleTimer}
                className="w-full !py-2 flex items-center justify-center gap-2 text-sm"
            >
                {isRunning ? <Pause size={16} /> : <Play size={16} />}
                {isRunning ? 'Pause' : 'Start'}
            </Button>
        </div>
    );
};

export default PomodoroTimer;
