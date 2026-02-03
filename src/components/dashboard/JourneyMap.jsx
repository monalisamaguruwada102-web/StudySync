import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, Lock, MapPin, Star } from 'lucide-react';
import { useFirestore } from '../../hooks/useFirestore';
import { moduleService } from '../../services/firestoreService';
import { useNavigate } from 'react-router-dom';

const JourneyMap = () => {
    const navigate = useNavigate();
    const { data: modules } = useFirestore(moduleService.getAll);

    // Sort modules randomly or by ID to create a consistent order "path"
    const orderedModules = useMemo(() => {
        return [...modules].sort((a, b) => a.created_at?.localeCompare(b.created_at));
    }, [modules]);

    // Generate Path Points (Winding Snake Layout)
    const points = useMemo(() => {
        return orderedModules.map((mod, index) => {
            const row = Math.floor(index / 3);
            const isReverse = row % 2 === 1;
            const col = index % 3;

            // X position (10 to 90%)
            const x = isReverse
                ? 90 - (col * 40)
                : 10 + (col * 40);

            // Y position gets lower with each row
            const y = 50 + (row * 120);

            return { x, y, mod, id: mod.id };
        });
    }, [orderedModules]);

    const pathData = useMemo(() => {
        if (points.length === 0) return '';

        let d = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Simple straight lines for now, or curves
            const midY = (current.y + next.y) / 2;

            // Bezier curve for smoother path
            d += ` C ${current.x} ${midY}, ${next.x} ${midY}, ${next.x} ${next.y}`;
        }

        return d;
    }, [points]);

    return (
        <div className="relative w-full h-full min-h-[500px] bg-[#1a1b26] rounded-3xl overflow-hidden p-8 flex items-center justify-center">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative w-full max-w-2xl h-[600px] overflow-y-auto no-scrollbar">
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
                    {/* Path Shadow */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    {/* Main Path */}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="url(#pathGradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray="10 10"
                        className="animate-[dash_20s_linear_infinite]"
                    />
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="50%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                    </defs>
                </svg>

                {points.map((point, index) => {
                    // Logic for lock/unlock state (simplified: unlock first, or others if previous is "done")
                    // For demo, let's say active is the last one, others are done
                    const isCompleted = index < points.length - 1;
                    const isActive = index === points.length - 1;
                    const isLocked = false; // We won't lock for this demo

                    return (
                        <motion.div
                            key={point.id}
                            className="absolute flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${point.x}%`, top: `${point.y}px` }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, y: -5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => navigate(`/modules/${point.mod.id}`)}
                                className={`
                                    w-16 h-16 rounded-2xl rotate-45 flex items-center justify-center shadow-xl z-10 relative
                                    transition-all duration-300
                                    ${isActive
                                        ? 'bg-gradient-to-br from-primary-500 to-purple-600 shadow-primary-500/50'
                                        : isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/40'
                                            : 'bg-slate-700 border-2 border-slate-600'
                                    }
                                `}
                            >
                                <div className="-rotate-45 text-white">
                                    {isCompleted ? <Check size={24} strokeWidth={4} /> :
                                        isActive ? <Star size={24} fill="currentColor" className="animate-pulse" /> :
                                            <Lock size={20} className="text-slate-400" />}
                                </div>

                                {/* Ripple Effect for Active */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-2xl bg-primary-500/30 animate-ping -z-10" />
                                )}
                            </motion.button>

                            {/* Label */}
                            <div className={`
                                mt-4 px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg border text-xs font-bold whitespace-nowrap z-20
                                ${isActive
                                    ? 'bg-primary-500 text-white border-primary-400'
                                    : 'bg-white/90 text-slate-800 border-white/50'
                                }
                            `}>
                                {point.mod.name}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes dash {
                    to {
                        stroke-dashoffset: -1000;
                    }
                }
            `}</style>
        </div>
    );
};

export default JourneyMap;
