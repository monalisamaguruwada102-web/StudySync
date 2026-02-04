import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { moduleService, studyLogService } from '../services/firestoreService';
import { Plus, Edit2, Trash2, Target, BookOpen, Sparkles, Wand2, RefreshCcw } from 'lucide-react';
import aiService from '../services/aiService';
import { flashcardDeckService, flashcardService } from '../services/firestoreService';

const Modules = () => {
    const { data: modules, loading, refresh } = useFirestore(moduleService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', targetHours: '' });
    const [isGenerating, setIsGenerating] = useState(null); // moduleId being processed

    const handleOpenModal = (mod = null) => {
        if (mod) {
            setCurrentModule(mod);
            setFormData({ name: mod.name, description: mod.description, targetHours: mod.targetHours });
        } else {
            setCurrentModule(null);
            setFormData({ name: '', description: '', targetHours: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = { ...formData, targetHours: parseFloat(formData.targetHours) || 0 };

        if (currentModule) {
            await moduleService.update(currentModule.id, data);
        } else {
            await moduleService.add(data);
        }
        await refresh();
        setIsModalOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this module? All associated data will be affected.')) {
            await moduleService.delete(id);
            await refresh();
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

            alert(`✨ Successfully generated ${newCards.length} flashcards for ${mod.name}! Check your Flashcards page.`);
        } catch (error) {
            console.error('AI Generation failed:', error);
            alert('AI generation failed. Please try again.');
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
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Academic Modules</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track and manage your study modules and targets.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                    <Plus size={20} />
                    <span>Add Module</span>
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-400">Loading modules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod) => {
                        const progress = calculateProgress(mod);
                        return (
                            <Card key={mod.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleGenerateAI(mod)}
                                            className={`!p-2 ${isGenerating === mod.id ? 'text-primary-500 animate-pulse' : 'text-slate-400 hover:text-primary-500'}`}
                                            disabled={isGenerating !== null}
                                            title="Generate AI Flashcards"
                                        >
                                            {isGenerating === mod.id ? <RefreshCcw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                        </Button>
                                        <Button variant="ghost" onClick={() => handleOpenModal(mod)} className="!p-2 text-slate-400 hover:text-primary-600">
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button variant="ghost" onClick={() => handleDelete(mod.id)} className="!p-2 text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{mod.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 h-10">{mod.description}</p>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
                                            <Target size={16} />
                                            <span>{Math.max(0, mod.targetHours - (mod.totalHoursStudied || 0)).toFixed(1)}h Remaining</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-600 rounded-full transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
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
                </form>
            </Modal>
        </Layout>
    );
};

export default Modules;
