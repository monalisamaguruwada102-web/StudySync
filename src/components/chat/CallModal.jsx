import React, { useEffect, useState, useRef } from 'react';
import Peer from 'simple-peer';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

// Polyfill for simple-peer in Vite
// import * as process from 'process';
// window.global = window;
// window.process = process;
// window.Buffer = []; 

const CallModal = ({ socket, currentUser, activeCall, incomingCall, onEndCall, onAnswerCall }) => {
    const [stream, setStream] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        if (activeCall) {
            startCall();
        } else if (incomingCall) {
            setName(incomingCall.name);
        }
    }, [activeCall, incomingCall]);

    const startCall = async () => {
        try {
            const currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setStream(currentStream);
            if (myVideo.current) {
                myVideo.current.srcObject = currentStream;
            }

            if (incomingCall) {
                // We are answering
                answerCall(currentStream);
            } else if (activeCall) {
                // We are calling
                const peer = new Peer({
                    initiator: true,
                    trickle: false,
                    stream: currentStream
                });

                peer.on('signal', (data) => {
                    socket.emit('call-user', {
                        userToCall: activeCall.recipientId,
                        signalData: data,
                        from: currentUser.id,
                        name: currentUser.name
                    });
                });

                peer.on('stream', (userStream) => {
                    if (userVideo.current) {
                        userVideo.current.srcObject = userStream;
                    }
                });

                socket.on('call-answered', (signal) => {
                    setCallAccepted(true);
                    peer.signal(signal);
                });

                connectionRef.current = peer;
            }
        } catch (err) {
            console.error("Error accessing media devices:", err);
            onEndCall();
        }
    };

    const answerCall = (currentStream) => {
        setCallAccepted(true);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: currentStream
        });

        peer.on('signal', (data) => {
            socket.emit('make-answer', { signal: data, to: incomingCall.from });
        });

        peer.on('stream', (userStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = userStream;
            }
        });

        peer.signal(incomingCall.signal);
        connectionRef.current = peer;
    };

    const leaveCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        socket.off('call-answered');
        onEndCall();
    };

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
            setIsMuted(!stream.getAudioTracks()[0].enabled);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
            setIsVideoOff(!stream.getVideoTracks()[0].enabled);
        }
    };

    if (!activeCall && !incomingCall) return null;

    // Incoming Call UI
    if (incomingCall && !callAccepted) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center border border-slate-200 dark:border-slate-700">
                        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                            <Phone size={40} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{incomingCall.name || 'Unknown User'}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">Incoming Video Call...</p>

                        <div className="flex justify-center gap-6">
                            <button
                                onClick={onEndCall}
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                            >
                                <PhoneOff size={24} />
                            </button>
                            <button
                                onClick={startCall}
                                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-bounce"
                            >
                                <Phone size={24} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Active Call UI
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`fixed z-50 transition-all duration-300 ${isMinimized
                    ? 'bottom-4 right-4 w-64 h-48 rounded-2xl overflow-hidden shadow-2xl border border-slate-700'
                    : 'inset-0 bg-slate-900'}`}
            >
                {/* Main Video Area */}
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                    {callAccepted && !callEnded ? (
                        <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-2xl font-bold text-slate-400">
                                    {activeCall?.recipientName?.[0] || incomingCall?.name?.[0] || '?'}
                                </span>
                            </div>
                            <p className="text-slate-400">Calling...</p>
                        </div>
                    )}

                    {/* My Video (PiP) */}
                    {stream && (
                        <div className={`absolute transition-all duration-300 ${isMinimized ? 'hidden' : 'top-4 right-4 w-32 h-48 md:w-48 md:h-64'}`}>
                            <video
                                playsInline
                                ref={myVideo}
                                autoPlay
                                muted
                                className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-slate-800 bg-slate-900"
                            />
                        </div>
                    )}

                    {/* Controls */}
                    {!isMinimized && (
                        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>

                            <button
                                onClick={leaveCall}
                                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transform hover:scale-105 transition-all"
                            >
                                <PhoneOff size={32} />
                            </button>

                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full backdrop-blur-md transition-all ${isVideoOff ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>
                        </div>
                    )}

                    {/* Minimize/Maximize Button */}
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="absolute top-4 left-4 p-2 rounded-lg bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
                    >
                        {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CallModal;
