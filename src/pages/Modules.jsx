import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, studyLogService, taskService, pomodoroService, flashcardDeckService, flashcardService } from '../services/firestoreService';
import { useAnalytics } from '../hooks/useAnalytics';
import { Plus, Edit2, Trash2, Target, BookOpen, Sparkles, Wand2, RefreshCcw } from 'lucide-react';
import aiService from '../services/aiService';
import { useNotification } from '../context/NotificationContext';

const Modules = () => {
    const { showToast, confirm } = useNotification();
    const { data: modules, loading, refresh } = useFirestore(moduleService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    const { data: sessions } = useFirestore(pomodoroService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);
    const stats = useAnalytics(logs, modules, tasks, sessions);
    const [formData, setFormData] = useState({ name: '', description: '', targetHours: '', totalHoursStudied: '' });
    const [isGenerating, setIsGenerating] = useState(null); // moduleId being processed

    const handleOpenModal = (mod = null) => {
        if (mod) {
            setCurrentModule(mod);
            setFormData({
                name: mod.name,
                description: mod.description,
                targetHours: mod.targetHours,
                totalHoursStudied: mod.totalHoursStudied || 0
            });
        } else {
            setCurrentModule(null);
            setFormData({ name: '', description: '', targetHours: '', totalHoursStudied: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            targetHours: parseFloat(formData.targetHours) || 0,
            totalHoursStudied: parseFloat(formData.totalHoursStudied) || 0
        };

        if (currentModule) {
            await moduleService.update(currentModule.id, data);
        } else {
            await moduleService.add(data);
        }
        await refresh();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Module',
            message: 'Are you sure you want to delete this module? All associated data will be affected.',
            type: 'warning',
            confirmLabel: 'Delete Module'
        });
        if (isConfirmed) {
            await moduleService.delete(id);
            await refresh();
            showToast('Module deleted', 'info');
        }
    };

    const handleGenerateAI = async (mod) => {
        setIsGenerating(mod.id);
        try {
            // 1. Generate cards via AI
            const newCards = await aiService.generateFlashcards(mod.name, mod.description);

            // 2. Find or create an "AI Generated" deck for this module
            const decks = await flashcardDeckService.getAll((data) => { }); // Get all decks
            // Note: getAll in this service implementation actually returns a fetcher/unsub, 
            // but the mock here is a bit complex. For simplicity, we'll try to add a deck directly.

            const deck = await flashcardDeckService.add({
                name: `AI: ${mod.name}`,
                moduleId: mod.id,
                description: `Auto-generated flashcards for ${mod.name}`
            });

            // 3. Add cards to the deck
            for (const card of newCards) {
                await flashcardService.add({
                    ...card,
                    deckId: deck.id
                });
            }

            showToast(`✨ Successfully generated ${newCards.length} flashcards for ${mod.name}!`, 'success');
        } catch (error) {
            console.error('AI Generation failed:', error);
            showToast('AI generation failed. Please try again.', 'error');
        } finally {
            setIsGenerating(null);
        }
    };

    const calculateProgress = (mod) => {
        const target = mod.targetHours;
        if (!target || target === 0) return 0;
        const total = parseFloat(mod.totalHoursStudied || 0);
        return Math.min((total / target) * 100, 100).toFixed(0);
    };

    return (
        <Layout title="Module Management">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Academic Modules</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track and manage your study modules and targets.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <Plus size={20} />
                    <span>Add Module</span>
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading modules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stats.moduleData.map((mod) => {
                        const progress = mod.progress.toFixed(0);
                        return (
                            <Card key={mod.id} className="group relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-inner">
                                            <BookOpen size={28} />
                                        </div>
                                        <div className="flex gap-1 bg-white/50 dark:bg-black/20 rounded-lg p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleGenerateAI(mod)}
                                                className={`!p-2 h-8 w-8 ${isGenerating === mod.id ? 'text-primary-500 animate-pulse' : 'text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}
                                                disabled={isGenerating !== null}
                                                title="Generate AI Flashcards"
                                            >
                                                {isGenerating === mod.id ? <RefreshCcw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                            </Button>
                                            <Button variant="ghost" onClick={() => handleOpenModal(mod)} className="!p-2 h-8 w-8 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                                                <Edit2 size={14} />
                                            </Button>
                                            <Button variant="ghost" onClick={() => handleDelete(mod.id)} className="!p-2 h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{mod.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 font-medium leading-relaxed">{mod.description || 'No description provided'}</p>

                                    <div className="mt-6 space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-widest">
                                                    <Target size={12} />
                                                    <span>{mod.remaining}h Left</span>
                                                </div>
                                                <span className="text-xs text-slate-400 font-bold">{mod.hours.toFixed(1)} / {mod.target} Hours</span>
                                            </div>
                                            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{progress}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                    {modules.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-medium text-slate-600">No modules yet</h3>
                            <p className="text-slate-400">Click "Add Module" to start tracking your subjects.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentModule ? 'Edit Module' : 'Create New Module'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {currentModule ? 'Update Module' : 'Create Module'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Module Name"
                        placeholder="e.g. Data Structures & Algorithms"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Description"
                        placeholder="Short overview of the module"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <Input
                        label="Target Hours"
                        type="number"
                        placeholder="e.g. 50"
                        value={formData.targetHours}
                        onChange={(e) => setFormData({ ...formData, targetHours: e.target.value })}
                        required
                    />
                    <Input
                        label="Current Studied Hours (Legacy/Existing)"
                        type="number"
                        placeholder="e.g. 10"
                        value={formData.totalHoursStudied}
                        onChange={(e) => setFormData({ ...formData, totalHoursStudied: e.target.value })}
                    />
                </form>
            </Modal>
        </Layout>
    );
};

export default Modules;
