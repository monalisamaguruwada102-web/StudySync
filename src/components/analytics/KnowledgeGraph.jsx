import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Brain, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KnowledgeGraph = ({ modules = [], logs = [] }) => {
    const navigate = useNavigate();

    // Generate nodes and links based on modules
    const nodes = useMemo(() => {
        return modules.map((m, i) => ({
            id: m.id,
            name: m.name,
            x: 150 + Math.cos(i * (Math.PI * 2 / modules.length)) * 100,
            y: 150 + Math.sin(i * (Math.PI * 2 / modules.length)) * 100,
            color: i % 2 === 0 ? '#6366f1' : '#ec4899',
            mastery: Math.min(100, (logs.filter(l => l.moduleId === m.id).length * 10))
        }));
    }, [modules, logs]);

    const center = { x: 150, y: 150 };

    if (modules.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Brain size={48} className="mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No modules to map</p>
            </div>
        );
    }

    return (
        <div className="relative w-full aspect-square max-w-[300px] mx-auto bg-slate-900 rounded-full border-4 border-slate-800 shadow-2xl overflow-hidden group">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <svg viewBox="0 0 300 300" className="w-full h-full relative z-10">
                {/* Connections to Central Hub */}
                {nodes.map((node) => (
                    <motion.line
                        key={`line-${node.id}`}
                        x1={center.x}
                        y1={center.y}
                        x2={node.x}
                        y2={node.y}
                        stroke={node.color}
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                    />
                ))}

                {/* Central Hub */}
                <motion.circle
                    cx={center.x}
                    cy={center.y}
                    r="12"
                    fill="#fff"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shadow-lg"
                />
                <foreignObject x={center.x - 10} y={center.y - 10} width="20" height="20">
                    <div className="flex items-center justify-center text-slate-900">
                        <Target size={12} />
                    </div>
                </foreignObject>

                {/* Module Nodes */}
                {nodes.map((node, i) => (
                    <motion.g
                        key={node.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="cursor-pointer"
                        whileHover={{ scale: 1.1 }}
                        onClick={() => navigate(`/modules/${node.id}`)}
                    >
                        {/* Glow Effect */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="15"
                            fill={node.color}
                            className="opacity-20 blur-sm"
                        />

                        {/* Outer Progress Ring */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="10"
                            fill="none"
                            stroke={node.color}
                            strokeWidth="2"
                            strokeDasharray="62.8"
                            strokeDashoffset={62.8 - (62.8 * node.mastery / 100)}
                            className="transition-all duration-1000"
                        />

                        {/* Node Core */}
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r="6"
                            fill={node.color}
                        />

                        {/* Tooltip-like label (visible on group hover) */}
                        <text
                            x={node.x}
                            y={node.y + 20}
                            textAnchor="middle"
                            className="text-[8px] font-black fill-white opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter"
                            style={{ pointerEvents: 'none' }}
                        >
                            {node.name.length > 10 ? node.name.substring(0, 8) + '...' : node.name}
                        </text>
                    </motion.g>
                ))}
            </svg>

            {/* Overlays */}
            <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                    <Zap size={10} className="text-yellow-400" />
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Active Sync</span>
                </div>
            </div>

            {/* Scanning Effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-primary-500/20 to-transparent h-1/2 pointer-events-none"
                animate={{ y: ['0%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
};

export default KnowledgeGraph;
