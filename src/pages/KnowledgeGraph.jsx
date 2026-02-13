import React, { useCallback, useMemo, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import Layout from '../components/layout/Layout';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, taskService, noteService } from '../services/firestoreService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ZoomIn, ZoomOut, Expand } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getModuleColor } from '../utils/colors';

const KnowledgeGraph = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    const { data: notes } = useFirestore(noteService.getAll);

    const [selectedNode, setSelectedNode] = useState(null);
    const [graphRef, setGraphRef] = useState(null);

    // Prepare Graph Data
    const graphData = useMemo(() => {
        const nodes = [];
        const links = [];

        // 1. Module Nodes (Central Hubs)
        modules.forEach(mod => {
            nodes.push({
                id: `module-${mod.id}`,
                name: mod.name,
                type: 'module',
                val: 20, // Size
                color: getModuleColor(mod.id)
            });
        });

        // 2. Task Nodes
        tasks.forEach(task => {
            nodes.push({
                id: `task-${task.id}`,
                name: task.title,
                type: 'task',
                val: 10,
                color: isDarkMode ? '#ec4899' : '#db2777' // Pink
            });

            // Link to Module
            if (task.moduleId) {
                links.push({
                    source: `module-${task.moduleId}`,
                    target: `task-${task.id}`,
                    color: isDarkMode ? 'rgba(236, 72, 153, 0.3)' : 'rgba(219, 39, 119, 0.2)'
                });
            }
        });

        // 3. Note Nodes
        notes.forEach(note => {
            nodes.push({
                id: `note-${note.id}`,
                name: note.title,
                type: 'note',
                val: 8,
                color: isDarkMode ? '#22c55e' : '#16a34a' // Green
            });

            // Link to Module
            if (note.moduleId) {
                links.push({
                    source: `module-${note.moduleId}`,
                    target: `note-${note.id}`,
                    color: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.2)'
                });
            }
        });

        return { nodes, links };
    }, [modules, tasks, notes, isDarkMode]);

    const handleNodeClick = useCallback(node => {
        setSelectedNode(node);
        // Zoom to node
        if (graphRef) {
            graphRef.centerAt(node.x, node.y, 1000);
            graphRef.zoom(6, 2000);
        }
    }, [graphRef]);

    const handleBackgroundClick = useCallback(() => {
        setSelectedNode(null);
        if (graphRef) {
            graphRef.zoomToFit(1000, 50);
        }
    }, [graphRef]);

    // Custom Node Painting
    const paintNode = useCallback((node, ctx, globalScale) => {
        const label = node.name;
        const fontSize = 12 / globalScale;

        // Draw Core
        ctx.beginPath();
        const r = node.val / 2;
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw Glow (Premium Effect)
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Draw Label on Hover or Selection
        if (node === selectedNode || globalScale > 2.5) {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = isDarkMode ? 'white' : '#1e293b';
            ctx.fillText(label, node.x, node.y + r + fontSize);
        }
    }, [selectedNode, isDarkMode]);

    return (
        <Layout title="Knowledge Graph">
            <div className="relative h-[calc(100vh-140px)] w-full overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-inner">

                {/* Graph Canvas */}
                <ForceGraph2D
                    ref={setGraphRef}
                    graphData={graphData}
                    nodeLabel="name"
                    nodeRelSize={6}
                    linkColor={link => link.color}
                    nodeCanvasObject={paintNode}
                    onNodeClick={handleNodeClick}
                    onBackgroundClick={handleBackgroundClick}
                    backgroundColor={isDarkMode ? '#0f172a' : '#f8fafc'} // Slate-900 or Slate-50
                    d3AlphaDecay={0.02} // Slower physics stabilization
                    d3VelocityDecay={0.3} // Damping
                    cooldownTicks={100}
                />

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-slate-500 hover:text-primary-500 shadow-lg" onClick={() => graphRef?.zoomIn()}>
                        <ZoomIn size={20} />
                    </button>
                    <button className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-slate-500 hover:text-primary-500 shadow-lg" onClick={() => graphRef?.zoomOut()}>
                        <ZoomOut size={20} />
                    </button>
                    <button className="p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-slate-500 hover:text-primary-500 shadow-lg" onClick={() => graphRef?.zoomToFit(1000)}>
                        <Expand size={20} />
                    </button>
                </div>

                {/* Legend */}
                <div className="absolute top-4 left-4 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Legend</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Modules</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Tasks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Notes</span>
                        </div>
                    </div>
                </div>

                {/* Active Node Info Panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute bottom-4 right-4 w-80 p-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${selectedNode.type === 'module' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' :
                                        selectedNode.type === 'task' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' :
                                            'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        {selectedNode.type}
                                    </span>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-2 leading-tight">
                                        {selectedNode.name}
                                    </h2>
                                </div>
                                <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <Info size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                This node is connected to { // Find connected links
                                    graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length
                                } items.
                            </p>

                            <button
                                onClick={() => {
                                    if (selectedNode.type === 'module') navigate(`/modules`);
                                    else if (selectedNode.type === 'task') navigate(`/tasks`);
                                    else if (selectedNode.type === 'note') navigate(`/notes`);
                                }}
                                className="w-full py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300"
                            >
                                Open Details
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default KnowledgeGraph;
