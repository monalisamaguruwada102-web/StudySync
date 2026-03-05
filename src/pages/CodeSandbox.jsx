import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
    Code2,
    Play,
    Terminal,
    Copy,
    Trash2,
    RefreshCcw,
    Settings2,
    Cpu,
    Sparkles,
    Zap,
    ChevronDown,
    Globe,
    CpuIcon
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import codeService from '../services/codeService';
import { motion, AnimatePresence } from 'framer-motion';

const CodeSandbox = () => {
    const { showToast } = useNotification();
    const [selectedLanguage, setSelectedLanguage] = useState(codeService.languages[0]);
    const [code, setCode] = useState(codeService.templates[selectedLanguage.id] || '');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [executionTime, setExecutionTime] = useState(null);
    const [stdin, setStdin] = useState('');
    const [isInputVisible, setIsInputVisible] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        // Load template when language changes
        setCode(codeService.templates[selectedLanguage.id] || '');
        setOutput('');
        setExecutionTime(null);
    }, [selectedLanguage]);

    const handleRunCode = async () => {
        if (!code.trim()) {
            showToast('Please enter some code to execute', 'warning');
            return;
        }

        setIsRunning(true);
        setOutput('');
        const start = performance.now();

        try {
            const result = await codeService.execute(
                selectedLanguage.id,
                selectedLanguage.version,
                code,
                stdin
            );

            const end = performance.now();

            // Priority 1: Check for Compilation Errors
            if (result.compile && result.compile.stderr) {
                setOutput(`[COMPILATION ERROR]\n${result.compile.stderr}`);
                setExecutionTime(null);
                showToast('Compilation Failed', 'error');
                return;
            }

            // Priority 2: Check for Runtime Output
            if (result.run) {
                const stdout = result.run.stdout || '';
                const stderr = result.run.stderr || '';

                // Use Piston's provided execution time if available, otherwise fallback
                const pTime = result.run.time ? result.run.time.toFixed(3) : ((end - start) / 1000).toFixed(2);
                setExecutionTime(pTime);

                if (stderr) {
                    setOutput(`${stdout}\n--- RUNTIME ERROR ---\n${stderr}`);
                } else {
                    setOutput(stdout || '[Process finished with no output]');
                }

                if (result.run.code !== 0) {
                    showToast(`Finished with exit code ${result.run.code}`, 'warning');
                } else {
                    showToast('Executed Successfully', 'success');
                }
            }
        } catch (error) {
            setOutput(`Error: ${error.message}`);
            showToast('Failed to execute code', 'error');
        } finally {
            setIsRunning(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        showToast('Code copied to clipboard!', 'success');
    };

    const handleClearOutput = () => {
        setOutput('');
        setExecutionTime(null);
    };

    const handleResetCode = () => {
        setCode(codeService.templates[selectedLanguage.id] || '');
        showToast('Code reset to template', 'info');
    };

    return (
        <Layout title="Live Polyglot Sandbox">
            {/* Header / Intro */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                            <Code2 size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">Code <span className="text-primary-600">Forge</span></h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Test, prototype and learn across multiple programming languages in real-time.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Language Dropdown (Custom UI) */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-primary-500 transition-all cursor-pointer min-w-[160px]">
                            {selectedLanguage.id.includes('csharp') ? <Cpu size={18} className="text-emerald-500" /> : <Globe size={18} className="text-primary-500" />}
                            <select
                                value={selectedLanguage.id}
                                onChange={(e) => setSelectedLanguage(codeService.languages.find(l => l.id === e.target.value))}
                                className="bg-transparent outline-none font-bold text-sm text-slate-700 dark:text-slate-300 w-full appearance-none pr-4 cursor-pointer"
                            >
                                {codeService.languages.map(lang => (
                                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <Button
                        onClick={handleRunCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isRunning ? (
                            <RefreshCcw size={18} className="animate-spin" />
                        ) : (
                            <Play size={18} fill="currentColor" />
                        )}
                        <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
                        {/* Editor Header */}
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>
                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                    main.{selectedLanguage.extension}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleResetCode} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all" title="Reset to Template">
                                    <RefreshCcw size={16} />
                                </button>
                                <button onClick={handleCopyCode} className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all" title="Copy Code">
                                    <Copy size={16} />
                                </button>
                                <button onClick={() => setCode('')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Clear All">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Editor Textarea */}
                        <div className="relative flex-1 group">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-full p-6 bg-transparent outline-none resize-none font-mono text-sm text-slate-700 dark:text-slate-300 custom-scrollbar leading-relaxed"
                                spellCheck="false"
                                placeholder={`Write your ${selectedLanguage.name} code here...`}
                            />
                            {/* Line numbers dummy (visual only) */}
                            <div className="absolute left-0 top-0 bottom-0 w-4 bg-slate-100/30 dark:bg-slate-800/20 border-r border-slate-200/30 dark:border-slate-800/30 pointer-events-none" />
                        </div>

                        {/* Stdin / Input Section */}
                        <div className={`transition-all duration-300 overflow-hidden ${isInputVisible ? 'h-32 opacity-100' : 'h-0 opacity-0'}`}>
                            <div className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Standard Input (stdin)</label>
                                    <button onClick={() => setStdin('')} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <textarea
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                    className="w-full h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono outline-none focus:border-primary-500 transition-all resize-none custom-scrollbar"
                                    placeholder="Enter program input here (if your code reads from console)..."
                                />
                            </div>
                        </div>

                        {/* Editor Footer */}
                        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 flex items-center justify-between uppercase tracking-widest bg-white/30 dark:bg-slate-900/30">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsInputVisible(!isInputVisible)}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all ${isInputVisible ? 'bg-primary-500/10 text-primary-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Terminal size={12} />
                                    <span>{isInputVisible ? 'Close Input' : 'Add Input (stdin)'}</span>
                                </button>
                                <span>Encoding: UTF-8</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={10} className="text-yellow-500" />
                                <span>Cloud Runner Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="lg:col-span-1 space-y-6">
                    <Card
                        title="Execution Results"
                        icon={<Terminal size={18} />}
                        HeaderAction={
                            <button onClick={handleClearOutput} className="text-slate-400 hover:text-primary-500 p-1 rounded-md transition-colors">
                                <Trash2 size={14} />
                            </button>
                        }
                        className="h-[600px] flex flex-col bg-slate-900 dark:bg-black rounded-[2rem] border-slate-800 shadow-2xl overflow-hidden"
                    >
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-300 custom-scrollbar-dark min-h-0 space-y-2">
                            {isRunning ? (
                                <div className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 border-4 border-primary-500/20 rounded-full animate-ping absolute" />
                                        <div className="w-12 h-12 border-4 border-t-primary-500 rounded-full animate-spin" />
                                    </div>
                                    <p className="text-primary-500 animate-pulse font-black uppercase tracking-[0.2em]">Processing Agent...</p>
                                </div>
                            ) : output ? (
                                <pre className="whitespace-pre-wrap break-words leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">{output}</pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-3">
                                    <CpuIcon size={48} strokeWidth={1} />
                                    <p className="text-center italic uppercase text-[10px] tracking-widest font-black">Waiting for code execution signal...</p>
                                </div>
                            )}
                        </div>

                        {/* Performance Stats */}
                        <AnimatePresence>
                            {executionTime && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-4 bg-primary-500/10 border-t border-primary-500/20 backdrop-blur-md"
                                >
                                    <div className="flex items-center justify-between text-[11px] font-black text-primary-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Zap size={12} fill="currentColor" />
                                            <span>Runtime Metrics</span>
                                        </div>
                                        <span>{executionTime}s execution completion</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* System Status */}
                        <div className="p-4 bg-black/40 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Realtime Terminal</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Sparkles size={10} className="text-primary-500" />
                                <span>Premium Engine</span>
                            </div>
                        </div>
                    </Card>

                    {/* Pro Tips / Stats */}
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Code2 size={120} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Settings2 size={14} />
                                Multi-Lang Support
                            </h4>
                            <p className="text-xs font-medium text-white/80 leading-relaxed">
                                Our forge supports compiled languages like C# and C++ out of the box. Use the templates to get started quickly with production-standard boilerplates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CodeSandbox;
