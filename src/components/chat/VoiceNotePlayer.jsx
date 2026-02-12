import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

const VoiceNotePlayer = ({ src, duration, isOwn }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration;
        setCurrentTime(current);
        setProgress((current / duration) * 100);
    };

    const handleSeek = (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        if (audioRef.current) {
            audioRef.current.currentTime = percentage * audioRef.current.duration;
        }
    };

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl min-w-[200px] max-w-[280px] ${isOwn ? 'bg-emerald-600/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <button
                onClick={togglePlay}
                className={`p-2 rounded-full transition-all shadow-sm ${isOwn
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
            >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>

            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <div
                    className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer relative overflow-hidden"
                    onClick={handleSeek}
                >
                    <motion.div
                        className={`absolute inset-y-0 left-0 ${isOwn ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration || '0:00'}</span>
                </div>
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(0);
                    setCurrentTime(0);
                }}
                className="hidden"
                muted={isMuted}
            />
        </div>
    );
};

export default VoiceNotePlayer;
