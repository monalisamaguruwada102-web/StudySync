import React, { useState } from 'react';
import { Music, Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

const TRACKS = [
    { title: "Lofi Hip Hop - Chill", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1" },
    { title: "Deep Focus - Ambient", url: "https://www.youtube.com/embed/84S7Kxef3ic?autoplay=1" },
    { title: "Coffee Shop Vibes", url: "https://www.youtube.com/embed/-5KAN9_CzSA?autoplay=1" },
    { title: "Rainy Day Jazz", url: "https://www.youtube.com/embed/2atQ7xm-Gyg?autoplay=1" }
];

const MusicPlayer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const togglePlayer = () => setIsOpen(!isOpen);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
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
                    <span className="text-xs font-bold uppercase tracking-wider">Focus Radio</span>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group">
                {/* Visualizer Effect */}
                <div className="absolute inset-0 opacity-20 flex items-end justify-center gap-1 pb-1">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-2 bg-white rounded-t-sm"
                            animate={{
                                height: isPlaying ? [10, 40, 20, 50, 15] : 10
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                delay: i * 0.1,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 flex flex-col gap-3">
                    <div>
                        <h4 className="font-bold text-sm truncate">{TRACKS[currentTrackIndex].title}</h4>
                        <p className="text-[10px] text-white/70">Premium Focus Stream</p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                        <button
                            onClick={handlePlayPause}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center backdrop-blur-sm transition-colors"
                        >
                            {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                        </button>

                        <button
                            onClick={nextTrack}
                            className="p-2 text-white/70 hover:text-white transition-colors"
                        >
                            <SkipForward size={16} />
                        </button>

                        <Volume2 size={16} className="text-white/70" />
                    </div>
                </div>

                {/* Invisible YouTube Embed */}
                {isPlaying && (
                    <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden">
                        <iframe
                            width="100"
                            height="100"
                            src={TRACKS[currentTrackIndex].url}
                            title="YouTube video player"
                            allow="autoplay"
                        ></iframe>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicPlayer;
