import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '../hooks/useFirestore';
import { taskService } from '../services/firestoreService';
import { useTimer } from '../context/TimerContext';
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
    EyeOff
} from 'lucide-react';

const SOUNDS = {
    lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Example URL
    rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Example URL
    white: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'  // Example URL
};

const DeepFocus = () => {
    const { data: tasks } = useFirestore(taskService.getAll);
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

    const pendingTasks = tasks.filter(t => t.status !== 'Completed');

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
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
            <audio ref={audioRef} src={activeSound ? SOUNDS[activeSound] : ''} loop />

            {/* Immersive Background Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {activeTheme === 'starfield' && [...Array(themes.starfield.count)].map((_, i) => (
                    <motion.div
                        key={`star-${i}`}
                        className="absolute w-[1px] h-[1px] bg-white rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            opacity: Math.random(),
                        }}
                        animate={{
                            opacity: [0.2, 1, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 4,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}

                {activeTheme === 'rain' && [...Array(themes.rain.count)].map((_, i) => (
                    <motion.div
                        key={`drop-${i}`}
                        className="absolute w-[1px] h-4 bg-blue-400/30"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: -20,
                        }}
                        animate={{
                            y: window.innerHeight + 20,
                        }}
                        transition={{
                            duration: 0.5 + Math.random() * 0.5,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: Math.random() * 2,
                        }}
                    />
                ))}

                {activeTheme === 'leaves' && [...Array(themes.leaves.count)].map((_, i) => (
                    <motion.div
                        key={`leaf-${i}`}
                        className="absolute w-2 h-2 bg-green-500/10 rounded-full"
                        initial={{
                            x: Math.random() * window.innerWidth,
                            y: window.innerHeight + 20,
                        }}
                        animate={{
                            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
                            y: -20,
                            rotate: 360,
                        }}
                        transition={{
                            duration: 5 + Math.random() * 10,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
            </div>

            {/* Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[150px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />

            {/* Header / Sidebar Controls (Hidden in Ghost Mode) */}
            <AnimatePresence>
                {!isGhostMode && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-6 left-6 right-6 flex justify-between items-center z-50 px-4"
                    >
                        <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                            <X size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">End Session</span>
                        </a>

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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Music Player Float (Hidden in Ghost Mode) */}
            <AnimatePresence>
                {isMusicEnabled && !isGhostMode && (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="fixed bottom-6 left-6 z-50 w-80 overflow-hidden rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl bg-black/40"
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

            {/* Main Content */}
            <div className={`relative z-10 flex flex-col items-center justify-center min-h-screen px-4 transition-all duration-700 ${isGhostMode ? 'scale-110' : ''}`}>
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
                            <CheckCircle size={20} />
                        </button>
                    </div>
                )}

                {/* Task Selector (Hidden in Ghost Mode) */}
                <AnimatePresence>
                    {!isGhostMode && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="w-full max-w-md"
                        >
                            <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] mb-4 text-center font-bold">Priority Mission</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {pendingTasks.slice(0, 4).map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all border ${selectedTask?.id === task.id
                                            ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20'
                                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border-white/5'
                                            }`}
                                    >
                                        {task.title}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
    );
};

export default DeepFocus;
