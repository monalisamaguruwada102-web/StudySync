import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { pomodoroService } from '../services/firestoreService';

const TimerContext = createContext();

const FOCUS_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes
const STORAGE_KEY = 'pomodoro_timer_state';

export const TimerProvider = ({ children }) => {
    const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [sessionsCompleted, setSessionsCompleted] = useState(0);
    const [selectedTask, setSelectedTask] = useState(null);
    const intervalRef = useRef(null);
    const lastSaveRef = useRef(Date.now());

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                const timeSinceLastSave = Date.now() - parsed.lastUpdate;
                const secondsElapsed = Math.floor(timeSinceLastSave / 1000);

                // Restore state
                setIsBreak(parsed.isBreak || false);
                setSessionsCompleted(parsed.sessionsCompleted || 0);
                setSelectedTask(parsed.selectedTask || null);

                // Adjust time if timer was running
                if (parsed.isRunning) {
                    const adjustedTime = Math.max(0, parsed.timeLeft - secondsElapsed);
                    setTimeLeft(adjustedTime);
                    setIsRunning(true);
                } else {
                    setTimeLeft(parsed.timeLeft || FOCUS_TIME);
                    setIsRunning(false);
                }
            } catch (error) {
                console.error('Failed to restore timer state:', error);
            }
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        const state = {
            timeLeft,
            isRunning,
            isBreak,
            sessionsCompleted,
            selectedTask,
            lastUpdate: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        lastSaveRef.current = Date.now();
    }, [timeLeft, isRunning, isBreak, sessionsCompleted, selectedTask]);

    // Timer countdown effect
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, timeLeft]);

    // Handle session completion
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            handleSessionComplete();
        }
    }, [timeLeft, isRunning]);

    const handleSessionComplete = async () => {
        setIsRunning(false);

        if (!isBreak) {
            // Focus session completed
            setSessionsCompleted(prev => prev + 1);

            try {
                await pomodoroService.add({
                    taskId: selectedTask?.id || null,
                    duration: 25,
                    completedAt: new Date().toISOString()
                });
            } catch (error) {
                console.error('Failed to log session:', error);
            }

            setIsBreak(true);
            setTimeLeft(BREAK_TIME);
        } else {
            // Break completed
            setIsBreak(false);
            setTimeLeft(FOCUS_TIME);
        }
    };

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(isBreak ? BREAK_TIME : FOCUS_TIME);
    }, [isBreak]);

    const skipToBreak = useCallback(() => {
        setIsRunning(false);
        setIsBreak(true);
        setTimeLeft(BREAK_TIME);
    }, []);

    const skipToFocus = useCallback(() => {
        setIsRunning(false);
        setIsBreak(false);
        setTimeLeft(FOCUS_TIME);
    }, []);

    const clearTimer = useCallback(() => {
        setIsRunning(false);
        setTimeLeft(FOCUS_TIME);
        setIsBreak(false);
        setSessionsCompleted(0);
        setSelectedTask(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const value = {
        // State
        timeLeft,
        isRunning,
        isBreak,
        sessionsCompleted,
        selectedTask,

        // Actions
        start,
        pause,
        reset,
        skipToBreak,
        skipToFocus,
        clearTimer,
        setSelectedTask,

        // Utilities
        formatTime,
        progress: isBreak
            ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
            : ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100,
        FOCUS_TIME,
        BREAK_TIME
    };

    return (
        <TimerContext.Provider value={value}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};
