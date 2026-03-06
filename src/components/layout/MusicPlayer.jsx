import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, SkipForward, Volume2, CloudRain, Coffee, Library, Wind, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TRACKS = [
    { title: "Lofi Hip Hop - Chill", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" },
    { title: "Deep Focus - Ambient", url: "https://www.youtube.com/embed/84S7Kxef3ic?autoplay=1" },
    { title: "Coffee Shop Vibes", url: "https://www.youtube.com/embed/-5KAN9_CzSA?autoplay=1" },
    { title: "Rainy Day Jazz", url: "https://www.youtube.com/embed/2atQ7xm-Gyg?autoplay=1" }
];

const AMBIENT_LAYERS = [
    { id: 'rain', name: 'Rain', icon: CloudRain, url: "https://www.youtube.com/embed/mPZkdNFkNps?autoplay=1&loop=1&playlist=mPZkdNFkNps" },
    { id: 'cafe', name: 'Cafe', icon: Coffee, url: "https://www.youtube.com/embed/gaGrXjS0NNo?autoplay=1&loop=1&playlist=gaGrXjS0NNo" },
    { id: 'library', name: 'Library', icon: Library, url: "https://www.youtube.com/embed/4vL_7K_9fN8?autoplay=1&loop=1&playlist=4vL_7K_9fN8" },
    { id: 'noise', name: 'White Noise', icon: Wind, url: "https://www.youtube.com/embed/nMfPqeZjc2c?autoplay=1&loop=1&playlist=nMfPqeZjc2c" }
];

const SonicStudio = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [activeAmbience, setActiveAmbience] = useState({}); // { id: boolean }
    const [showMixer, setShowMixer] = useState(false);

    const toggleAmbience = (id) => {
        setActiveAmbience(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const nextTrack = () => {
        setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
        setIsPlaying(true);
    };

    return (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Music size={16} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sonic Studio</span>
                </div>
                <button
                    onClick={() => setShowMixer(!showMixer)}
                    className={`p-1.5 rounded-lg transition-all ${showMixer ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    <Settings2 size={14} />
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-1 shadow-xl overflow-hidden group">
                <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-[1.4rem] p-5 text-white relative overflow-hidden">
                    {/* Abstract Animated Background */}
                    <div className="absolute inset-0 opacity-30">
                        <motion.div
                            animate={{
                                scale: isPlaying ? [1, 1.2, 1] : 1,
                                rotate: isPlaying ? [0, 5, -5, 0] : 0
                            }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/20 blur-[100px] rounded-full"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-1 block">Now Playing</span>
                                <h4 className="font-bold text-sm truncate drop-shadow-md">{TRACKS[currentTrackIndex].title}</h4>
                            </div>
                            <div className="flex gap-1">
                                {Object.entries(activeAmbience).map(([id, active]) => active && (
                                    <div key={id} className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-12 h-12 rounded-2xl bg-white text-indigo-600 hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl transition-all"
                                >
                                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                                </button>
                                <button
                                    onClick={nextTrack}
                                    className="p-2 text-white/80 hover:text-white transition-colors"
                                >
                                    <SkipForward size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md rounded-xl p-1">
                                {AMBIENT_LAYERS.map(layer => {
                                    const Icon = layer.icon;
                                    const isActive = activeAmbience[layer.id];
                                    return (
                                        <button
                                            key={layer.id}
                                            onClick={() => toggleAmbience(layer.id)}
                                            className={`p-2 rounded-lg transition-all ${isActive ? 'bg-white text-indigo-600 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                                            title={layer.name}
                                        >
                                            <Icon size={16} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Hidden Audio Drivers */}
                    <div className="absolute opacity-0 pointer-events-none">
                        {isPlaying && (
                            <iframe width="1" height="1" src={TRACKS[currentTrackIndex].url} allow="autoplay"></iframe>
                        )}
                        {AMBIENT_LAYERS.map(layer => activeAmbience[layer.id] && (
                            <iframe key={layer.id} width="1" height="1" src={layer.url} allow="autoplay"></iframe>
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {showMixer && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800"
                        >
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Ambient Mixer</h5>
                            <div className="grid grid-cols-2 gap-3">
                                {AMBIENT_LAYERS.map(layer => (
                                    <div
                                        key={layer.id}
                                        onClick={() => toggleAmbience(layer.id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${activeAmbience[layer.id] ? 'bg-white dark:bg-slate-800 border-indigo-500/30 shadow-md' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${activeAmbience[layer.id] ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                <layer.icon size={12} />
                                            </div>
                                            <span className="text-[10px] font-bold dark:text-slate-300">{layer.name}</span>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${activeAmbience[layer.id] ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <p className="mt-4 text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest px-4 leading-relaxed">
                Create your perfect acoustic focus environment
            </p>
        </div>
    );
};

export default SonicStudio;
