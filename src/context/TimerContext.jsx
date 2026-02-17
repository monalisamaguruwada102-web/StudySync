import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { pomodoroService } from '../services/firestoreService';
import api from '../services/api';
import { usePresence } from '../hooks/usePresence';

const TimerContext = createContext();

const FOCUS_TIME = 60 * 60; // 60 minutes
const BREAK_TIME = 5 * 60;  // 5 minutes

export const TimerProvider = ({ children }) => {
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('timer_timeLeft');
        return saved ? parseInt(saved, 10) : FOCUS_TIME;
    });
    const [isRunning, setIsRunning] = useState(() => {
        return localStorage.getItem('timer_isRunning') === 'true';
    });
    const [isBreak, setIsBreak] = useState(() => {
        return localStorage.getItem('timer_isBreak') === 'true';
    });
    const [sessionsCompleted, setSessionsCompleted] = useState(() => {
        const saved = localStorage.getItem('timer_sessionsCompleted');
        return saved ? parseInt(saved, 10) : 0;
    });
    const [selectedTask, setSelectedTask] = useState(() => {
        const saved = localStorage.getItem('timer_selectedTask');
        return saved ? JSON.parse(saved) : null;
    });
    const intervalRef = useRef(null);
    const lastSaveRef = useRef(Date.now());

    // Persist state to localStorage
    useEffect(() => {
        localStorage.setItem('timer_timeLeft', timeLeft);
        localStorage.setItem('timer_isRunning', isRunning);
        localStorage.setItem('timer_isBreak', isBreak);
        localStorage.setItem('timer_sessionsCompleted', sessionsCompleted);
        if (selectedTask) {
            localStorage.setItem('timer_selectedTask', JSON.stringify(selectedTask));
        } else {
            localStorage.removeItem('timer_selectedTask');
        }
    }, [timeLeft, isRunning, isBreak, sessionsCompleted, selectedTask]);

    // Load state from cloud on mount
    useEffect(() => {
        const fetchState = async () => {
            try {
                const response = await api.get('/user/profile');
                const cloudState = response.data.timer_state;
                if (cloudState) {
                    const timeSinceLastSave = Date.now() - cloudState.lastUpdate;
                    const secondsElapsed = Math.floor(timeSinceLastSave / 1000);

                    setIsBreak(cloudState.isBreak || false);
                    setSessionsCompleted(cloudState.sessionsCompleted || 0);
                    setSelectedTask(cloudState.selectedTask || null);

                    if (cloudState.isRunning) {
                        const adjustedTime = Math.max(0, cloudState.timeLeft - secondsElapsed);
                        setTimeLeft(adjustedTime);
                        setIsRunning(true);
                    } else {
                        setTimeLeft(cloudState.timeLeft || FOCUS_TIME);
                        setIsRunning(false);
                    }
                }
            } catch (error) {
                console.error('Failed to restore timer state from cloud:', error);
            }
        };
        fetchState();
    }, []);

    // Save state to cloud whenever it changes (with debounce/threshold)
    useEffect(() => {
        const state = {
            timeLeft,
            isRunning,
            isBreak,
            sessionsCompleted,
            selectedTask,
            lastUpdate: Date.now()
        };

        // Sync to cloud every 30 seconds or on major state changes
        const shouldSync = !isRunning || timeLeft % 30 === 0 || timeLeft === 0;

        if (shouldSync) {
            api.post('/user/settings', { timer_state: state }).catch(err => {
                console.error('Failed to sync timer to cloud:', err);
            });
        }

        lastSaveRef.current = Date.now();
    }, [timeLeft, isRunning, isBreak, sessionsCompleted, selectedTask]);

    // --- PHASE 2: Real-time Presence Sync ---
    const { updateActivity } = usePresence();
    useEffect(() => {
        const syncPresence = async () => {
            if (isRunning) {
                const activityText = isBreak
                    ? 'Taking a break ☕'
                    : `Studying: ${selectedTask?.title || 'General Focus'}`;

                await updateActivity({
                    status: isBreak ? 'online' : 'studying',
                    activity: activityText
                });
            } else {
                await updateActivity({
                    status: 'online',
                    activity: 'Idle / Planning'
                });
            }
        };
        syncPresence();
    }, [isRunning, isBreak, selectedTask, updateActivity]);

    // Timer countdown effect (Web Worker)
    useEffect(() => {
        let worker = null;

        if (isRunning && timeLeft > 0) {
            // Instantiate worker - Using absolute path relative to basename
            // Since the app is served at /study, and public assets are at root,
            // we need to ensure the worker is found correctly.
            worker = new Worker('/study/timer.worker.js');

            worker.onmessage = (e) => {
                if (e.data === 'TICK') {
                    setTimeLeft(prev => {
                        if (prev <= 1) return 0;
                        return prev - 1;
                    });
                }
            };

            worker.postMessage({ action: 'START' });
        }

        return () => {
            if (worker) {
                worker.postMessage({ action: 'PAUSE' });
                worker.terminate();
            }
        };
    }, [isRunning]); // Re-create worker only when running state changes

    // Watch for 0 to stop
    useEffect(() => {
        if (timeLeft === 0 && isRunning) {
            setIsRunning(false); // Stop immediately so worker is killed by dependency change
        }
    }, [timeLeft, isRunning]);

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
                // 1. Log the session
                await pomodoroService.add({
                    taskId: selectedTask?.id || null,
                    moduleId: selectedTask?.moduleId || null,
                    duration: FOCUS_TIME / 3600, // Recorded in hours for consistency with analytics
                    completedAt: new Date().toISOString()
                });

                // 2. Automation: Mark task as completed if one was selected
                if (selectedTask && selectedTask.id) {
                    await taskService.update(selectedTask.id, {
                        status: 'Completed',
                        completedAt: new Date().toISOString()
                    });
                }

                // 3. Trigger a sync/refresh of user data to update XP/Level
                api.get('/user/profile').then(res => {
                    // This will refresh local state if needed, but the server handles XP gain on log/task update
                }).catch(e => console.error('Failed to refresh profile after session:', e));

            } catch (error) {
                console.error('Failed to log session or update task:', error);
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
