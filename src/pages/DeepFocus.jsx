import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useTimer } from '../context/TimerContext';
import Layout from '../components/layout/Layout';
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
    X,
    Music,
    Wind,
    CloudRain,
    Sparkles,
    Eye,
    EyeOff,
    LayoutDashboard,
    List,
    ChevronRight,
    Check
} from 'lucide-react';

const SOUNDS = {
    lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Example URL
    rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Example URL
    white: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'  // Example URL
};

// Particle System Component to keep Math.random purely in useEffect
const ParticleSystem = ({ theme, themes }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const generateParticles = () => {
            if (!theme || !themes[theme]) return [];

            return [...Array(themes[theme].count)].map((_, i) => ({
                id: i,
                // General props
                initialX: Math.random() * window.innerWidth,
                initialY: theme === 'starfield' ? Math.random() * window.innerHeight : -20,
                // Starfield specifics
                opacity: Math.random(),
                duration: theme === 'starfield' ? 2 + Math.random() * 4 :
                    theme === 'rain' ? 0.5 + Math.random() * 0.5 :
                        5 + Math.random() * 10,
                // Rain/Leaves specifics
                delay: Math.random() * 2,
                // Leaves specifics
                xStart: `${Math.random() * 100}%`,
                xEnd: `${Math.random() * 100}%`,
            }));
        };

        setParticles(generateParticles());
    }, [theme, themes]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {theme === 'starfield' && particles.map(p => (
                <motion.div
                    key={`star-${p.id}`}
                    className="absolute w-[1px] h-[1px] bg-white rounded-full"
                    initial={{ x: p.initialX, y: p.initialY, opacity: p.opacity }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
                />
            ))}
            {theme === 'rain' && particles.map(p => (
                <motion.div
                    key={`drop-${p.id}`}
                    className="absolute w-[1px] h-4 bg-blue-400/30"
                    initial={{ x: p.initialX, y: -20 }}
                    animate={{ y: window.innerHeight + 20 }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'linear', delay: p.delay }}
                />
            ))}
            {theme === 'leaves' && particles.map(p => (
                <motion.div
                    key={`leaf-${p.id}`}
                    className="absolute w-2 h-2 bg-green-500/10 rounded-full"
                    initial={{ x: p.initialX, y: window.innerHeight + 20 }}
                    animate={{ x: [p.xStart, p.xEnd], y: -20, rotate: 360 }}
                    transition={{ duration: p.duration, repeat: Infinity, ease: 'linear' }}
                />
            ))}
        </div>
    );
};

const DeepFocus = () => {
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const {
        timeLeft,
        isRunning,
        isBreak,
        sessionsCompleted,
        selectedTask,
        start,
        pause,
        reset,
        setSelectedTask,
        skipToBreak,
        formatTime,
        progress
    } = useTimer();
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeSound, setActiveSound] = useState(null);
    const [activeTheme, setActiveTheme] = useState('starfield');
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [isMusicEnabled, setIsMusicEnabled] = useState(true);
    const [activePlaylist, setActivePlaylist] = useState('lofi');
    const [musicSource, setMusicSource] = useState('spotify'); // 'spotify' or 'youtube'
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const audioRef = useRef(null);

    // Extract YouTube video ID from URL
    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const playlistUrls = {
        lofi: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRv9oySqS4?utm_source=generator&theme=0",
        beats: "https://open.spotify.com/embed/playlist/37i9dQZF1DX8UOn96Z99yS?utm_source=generator&theme=0",
        ambient: "https://open.spotify.com/embed/playlist/37i9dQZF1DWWvH96YI77Y6?utm_source=generator&theme=0"
    };

    const fetchTasks = useCallback(async () => {
        try {
            setLoadingTasks(true);
            const response = await api.get('/tasks');
            setTasks(response.data || []);
        } catch (error) {
            console.error('Failed to fetch tasks for Deep Focus:', error);
        } finally {
            setLoadingTasks(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const pendingTasks = (tasks || []).filter(t => t.status !== 'Completed');

    useEffect(() => {
        if (activeSound && !isMuted) {
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
        } else {
            audioRef.current.pause();
        }
    }, [activeSound, isMuted]);

    const toggleTimer = () => isRunning ? pause() : start();

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    const themes = {
        starfield: { color: 'bg-primary-500', count: 40, icon: Sparkles },
        rain: { color: 'bg-blue-400', count: 60, icon: CloudRain },
        leaves: { color: 'bg-green-500', count: 30, icon: Wind }
    };

    return (
        <Layout title="Deep Focus Mode">
            <div className="fixed inset-0 bg-[#020408] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden flex">
                <audio ref={audioRef} src={activeSound ? SOUNDS[activeSound] : ''} loop />

                {/* Immersive Background Particles */}
                <ParticleSystem theme={activeTheme} themes={themes} />

                {/* Gradient Orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col h-screen overflow-hidden">
                    {/* Header Controls (Hidden in Ghost Mode) */}
                    <AnimatePresence>
                        {!isGhostMode && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 px-4"
                            >
                                <div className="flex items-center gap-3">
                                    <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                        <LayoutDashboard size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest text-[10px]">Dashboard</span>
                                    </a>
                                    <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                        <X size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest text-[10px]">End Session</span>
                                    </a>
                                </div>

                                <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/5">
                                    {/* Sound Presets */}
                                    <div className="flex items-center border-r border-white/10 pr-2 mr-1">
                                        {Object.keys(SOUNDS).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => setActiveSound(activeSound === s ? null : s)}
                                                className={`p-2 rounded-full transition-all ${activeSound === s ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                                title={`Toggle ${s}`}
                                            >
                                                {s === 'lofi' ? <Music size={16} /> : s === 'rain' ? <CloudRain size={16} /> : <Wind size={16} />}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Theme Presets */}
                                    <div className="flex items-center border-r border-white/10 pr-2 mr-1">
                                        {Object.entries(themes).map(([key, value]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveTheme(key)}
                                                className={`p-2 rounded-full transition-all ${activeTheme === key ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                                title={`Theme: ${key}`}
                                            >
                                                <value.icon size={16} />
                                            </button>
                                        ))}
                                    </div>

                                    <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                    <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <Maximize size={16} />
                                    </button>
                                    <button
                                        onClick={() => setIsMusicEnabled(!isMusicEnabled)}
                                        className={`p-2 rounded-full transition-all ${isMusicEnabled ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                        title="Toggle Study Music"
                                    >
                                        <Music size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMusicSource(musicSource === 'spotify' ? 'youtube' : 'spotify');
                                            if (musicSource === 'spotify') {
                                                setShowYoutubeInput(true);
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${musicSource === 'youtube' ? 'bg-red-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                        title="Toggle between Spotify and YouTube"
                                    >
                                        {musicSource === 'spotify' ? 'SPOT' : 'YT'}
                                    </button>
                                </div>

                                {/* Sidebar Toggle Button */}
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={`p-3 rounded-full border transition-all ${isSidebarOpen ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-black/20 backdrop-blur-md text-slate-400 border-white/10 hover:text-white'}`}
                                >
                                    <List size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Ghost Mode Toggle */}
                    <button
                        onClick={() => setIsGhostMode(!isGhostMode)}
                        className={`fixed top-6 right-1/2 translate-x-1/2 z-[60] p-3 rounded-full border transition-all ${isGhostMode ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-black/20 backdrop-blur-md text-slate-400 border-white/10'}`}
                        title={isGhostMode ? "Disable Ghost Mode" : "Enable Ghost Mode"}
                    >
                        {isGhostMode ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>

                    {/* Music Player Float (Always mounted but hidden in Ghost Mode) */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{
                            opacity: isMusicEnabled && !isGhostMode ? 1 : 0,
                            x: isMusicEnabled && !isGhostMode ? 0 : -50
                        }}
                        className="fixed bottom-6 left-6 z-50 w-80 overflow-hidden rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-black/40"
                        style={{
                            display: isMusicEnabled ? 'block' : 'none',
                            pointerEvents: isMusicEnabled && !isGhostMode ? 'auto' : 'none'
                        }}
                    >
                        <div className="p-3 border-b border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Study Stream</span>
                            {musicSource === 'spotify' ? (
                                <div className="flex gap-1">
                                    {Object.keys(playlistUrls).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setActivePlaylist(p)}
                                            className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${activePlaylist === p ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    {showYoutubeInput ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                placeholder="Paste YouTube URL"
                                                value={youtubeUrl}
                                                onChange={(e) => setYoutubeUrl(e.target.value)}
                                                className="px-2 py-1 rounded-lg text-[9px] bg-white/10 border border-white/5 text-white placeholder-slate-500 outline-none focus:border-primary-500 w-40"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        setShowYoutubeInput(false);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => setShowYoutubeInput(false)}
                                                className="px-2 py-1 bg-primary-500 text-white rounded-lg text-[9px] font-bold hover:bg-primary-600"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowYoutubeInput(true)}
                                            className="px-2 py-1 bg-white/5 text-slate-400 hover:text-white rounded-lg text-[9px] font-bold"
                                        >
                                            Change URL
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {musicSource === 'spotify' ? (
                            <iframe
                                src={playlistUrls[activePlaylist]}
                                width="100%"
                                height="152"
                                frameBorder="0"
                                allowFullScreen=""
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="opacity-80 hover:opacity-100 transition-opacity"
                            ></iframe>
                        ) : (
                            getYouTubeId(youtubeUrl) ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeId(youtubeUrl)}?autoplay=1&loop=1&playlist=${getYouTubeId(youtubeUrl)}`}
                                    width="100%"
                                    height="152"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="opacity-80 hover:opacity-100 transition-opacity"
                                ></iframe>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-xs text-slate-400">Paste a YouTube URL above</p>
                                </div>
                            )
                        )}
                    </motion.div>

                    {/* Main Content */}
                    <div className={`relative z-10 flex-1 flex flex-col items-center justify-center transition-all duration-700 ${isGhostMode ? 'scale-110' : ''}`}>
                        {/* Mode Indicator */}
                        {!isGhostMode && (
                            <motion.div
                                key={isBreak ? 'break' : 'focus'}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full mb-8 backdrop-blur-xl border border-white/10 shadow-2xl ${isBreak
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-primary-500/10 text-primary-400'
                                    }`}
                            >
                                {isBreak ? <Coffee size={18} className="animate-bounce" /> : <Brain size={18} className="animate-pulse" />}
                                <span className="text-xs font-black uppercase tracking-[0.3em] font-sans">
                                    {isBreak ? 'Break Time' : 'Deep Focus'}
                                </span>
                            </motion.div>
                        )}

                        {/* Task Selector Dropdown (Hidden in Ghost Mode) */}
                        <AnimatePresence>
                            {!isGhostMode && !isBreak && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="relative mb-8 z-[60]"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                                            <List size={14} className="text-primary-400" />
                                            <select
                                                value={selectedTask?.id || ''}
                                                onChange={(e) => {
                                                    const task = pendingTasks.find(t => t.id === e.target.value);
                                                    setSelectedTask(task || null);
                                                }}
                                                className="bg-transparent text-[11px] font-bold uppercase tracking-wider text-slate-200 outline-none cursor-pointer min-w-[200px]"
                                            >
                                                <option value="" className="bg-slate-900 text-slate-400">Select Mission Target...</option>
                                                {pendingTasks.map(task => (
                                                    <option key={task.id} value={task.id} className="bg-slate-900 text-slate-200">
                                                        {task.title} ({task.priority})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedTask && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex items-center gap-2 px-3 py-1 bg-primary-500/20 rounded-full border border-primary-500/30"
                                            >
                                                <Check size={10} className="text-primary-400" />
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-primary-400">Active Mission Locked</span>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Timer Display */}
                        <div className="relative mb-12">
                            {/* Progress Rings (Layered for Glow) */}
                            <svg className="w-[340px] h-[340px] transform -rotate-90">
                                <circle
                                    cx="170"
                                    cy="170"
                                    r="160"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.03)"
                                    strokeWidth="2"
                                />
                                {/* Outer Glow Ring */}
                                <motion.circle
                                    cx="170"
                                    cy="170"
                                    r="160"
                                    fill="none"
                                    stroke={isBreak ? 'rgba(34, 197, 94, 0.4)' : 'rgba(99, 102, 241, 0.4)'}
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 160}
                                    strokeDashoffset={2 * Math.PI * 160 * (1 - progress / 100)}
                                    style={{ filter: 'blur(15px)' }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 160 * (1 - progress / 100) }}
                                />
                                {/* Main Ring */}
                                <motion.circle
                                    cx="170"
                                    cy="170"
                                    r="160"
                                    fill="none"
                                    stroke={isBreak ? '#22c55e' : '#6366f1'}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 160}
                                    strokeDashoffset={2 * Math.PI * 160 * (1 - progress / 100)}
                                    initial={false}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 160 * (1 - progress / 100) }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </svg>

                            {/* Time Display */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <motion.span
                                    className="text-[100px] font-black tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    key={timeLeft}
                                >
                                    {formatTime(timeLeft)}
                                </motion.span>
                                <AnimatePresence>
                                    {selectedTask && !isGhostMode && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-slate-400 mt-2 max-w-[200px] text-center uppercase tracking-widest font-bold opacity-60"
                                        >
                                            {selectedTask.title}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Controls (Hidden in Ghost Mode) */}
                        {!isGhostMode && (
                            <div className="flex items-center gap-8 mb-12">
                                <button
                                    onClick={reset}
                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 hover:border-white/20 active:scale-95 text-slate-400"
                                    title="Reset Timer"
                                >
                                    <RotateCcw size={20} />
                                </button>
                                <motion.button
                                    onClick={toggleTimer}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.3)] transition-all ${isRunning
                                        ? 'bg-white/10 border border-white/20'
                                        : 'bg-primary-600 border border-primary-500'
                                        }`}
                                >
                                    {isRunning ? <Pause size={36} /> : <Play size={36} className="ml-2" />}
                                </motion.button>
                                <button
                                    onClick={skipToBreak}
                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 hover:border-white/20 active:scale-95 text-slate-400"
                                    title="Skip to break"
                                >
                                    {isBreak ? <Check size={20} /> : <CheckCircle size={20} />}
                                </button>

                                {selectedTask && !isBreak && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => {
                                            // Trigger automation via TimerContext's handleSessionComplete mechanism
                                            // or a direct call if we expose it, but for now we'll just stop and finish.
                                            skipToBreak();
                                        }}
                                        className="p-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-full transition-all border border-green-500/20 active:scale-95"
                                        title="Finish Task Now"
                                    >
                                        <Sparkles size={20} />
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {/* Session Stats (Hidden in Ghost Mode) */}
                        <AnimatePresence>
                            {!isGhostMode && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 text-[10px] text-slate-500 font-bold uppercase tracking-widest"
                                >
                                    <div className="flex items-center gap-2 px-6 py-3 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
                                        <Zap size={14} className="text-yellow-500" />
                                        <span>{sessionsCompleted} Sprints today</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-6 py-3 bg-black/20 backdrop-blur-md rounded-full border border-white/5">
                                        <Brain size={14} className="text-primary-500" />
                                        <span>{sessionsCompleted * 25} Mins Focused</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Sidebar for Tasks */}
                <AnimatePresence>
                    {isSidebarOpen && !isGhostMode && (
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="w-80 h-screen bg-slate-900/80 backdrop-blur-xl border-l border-white/10 p-6 relative z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white">Mission Control</h3>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Priority Targets</h4>
                                {pendingTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border group ${selectedTask?.id === task.id
                                            ? 'bg-indigo-500/20 border-indigo-500/50'
                                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h5 className={`text-sm font-bold ${selectedTask?.id === task.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                                                {task.title}
                                            </h5>
                                            {selectedTask?.id === task.id && (
                                                <div className="p-1 bg-indigo-500 rounded-full">
                                                    <Check size={10} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <div className={`w-1.5 h-1.5 rounded-full ${task.priority === 'High' ? 'bg-red-500' :
                                                task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`} />
                                            <span className="uppercase tracking-wider">{task.priority} Priority</span>
                                        </div>
                                    </button>
                                ))}

                                {pendingTasks.length === 0 && (
                                    <div className="text-center py-12 text-slate-500">
                                        <p className="text-sm">No Active Missions</p>
                                        <p className="text-[10px] opacity-60 mt-2">All targets neutralized. Good work.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default DeepFocus;
