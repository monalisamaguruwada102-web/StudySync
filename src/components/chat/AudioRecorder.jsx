import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AudioRecorder = ({ onSend, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const handleSend = async () => {
        if (!audioBlob) return;
        setIsUploading(true);
        try {
            await onSend(audioBlob, recordingTime);
            handleCancel();
        } catch (err) {
            console.error('Error uploading voice note:', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setRecordingTime(0);
        setIsPlaying(false);
        onCancel();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner w-full">
            {!audioBlob ? (
                <div className="flex-1 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        {isRecording ? (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-3 h-3 bg-red-500 rounded-full"
                            />
                        ) : (
                            <Mic size={18} className="text-slate-400" />
                        )}
                        <span className="text-sm font-mono dark:text-slate-100">
                            {isRecording ? formatTime(recordingTime) : '0:00'}
                        </span>
                        {isRecording && (
                            <span className="text-xs text-slate-500 italic animate-pulse">Recording...</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        {isRecording ? (
                            <button
                                onClick={stopRecording}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-md"
                            >
                                <Square size={18} fill="currentColor" />
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-md"
                            >
                                <Mic size={18} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-between px-2">
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            onClick={togglePlayback}
                            className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: isPlaying ? '100%' : '0%' }}
                                transition={{ duration: recordingTime, ease: "linear" }}
                            />
                        </div>
                        <span className="text-[11px] font-mono dark:text-slate-300">{formatTime(recordingTime)}</span>
                        <audio
                            ref={audioRef}
                            src={audioUrl}
                            onEnded={() => setIsPlaying(false)}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={handleCancel}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isUploading}
                            className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-md flex items-center justify-center min-w-[40px]"
                        >
                            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;
