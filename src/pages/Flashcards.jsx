import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { flashcardDeckService, flashcardService, moduleService } from '../services/firestoreService';
import api from '../services/api';
import { Plus, Book, Brain, ChevronRight, ChevronLeft, RotateCcw, Check, X, Layers, Play, Sparkles, Globe } from 'lucide-react';
import aiService from '../services/aiService';
import { useNotification } from '../context/NotificationContext';

const Flashcards = () => {
    const { showToast } = useNotification();
    const { data: decks, refresh: refreshDecks } = useFirestore(flashcardDeckService.getAll);
    const { data: cards, refresh: refreshCards } = useFirestore(flashcardService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);

    const [searchParams] = useSearchParams();
    const revealId = searchParams.get('id');

    const [selectedDeck, setSelectedDeck] = useState(null);
    const [isStudyMode, setIsStudyMode] = useState(false);
    const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);

    const [deckFormData, setDeckFormData] = useState({ name: '', moduleId: '' });
    const [cardFormData, setCardFormData] = useState({ front: '', back: '' });

    // Study state
    const [studyCards, setStudyCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // AI Generation state
    const [isAIGenModalOpen, setIsAIGenModalOpen] = useState(false);
    const [aiContext, setAiContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Deep link handling
    useEffect(() => {
        if (revealId && cards.length > 0) {
            const card = cards.find(c => String(c.id) === String(revealId));
            if (card) {
                const deck = decks.find(d => d.id === card.deckId);
                if (deck) {
                    setSelectedDeck(deck);
                    setStudyCards([card]);
                    setCurrentIndex(0);
                    setIsStudyMode(true);
                    setIsFlipped(true);
                }
            }
        }
    }, [revealId, cards, decks]);

    const handleCreateDeck = async (e) => {
        e.preventDefault();
        await flashcardDeckService.add(deckFormData);
        await refreshDecks();
        setIsDeckModalOpen(false);
        setDeckFormData({ name: '', moduleId: '' });
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        await flashcardService.add({
            ...cardFormData,
            deckId: selectedDeck.id,
            level: 1, // Start at level 1
            nextReview: new Date().toISOString()
        });
        await refreshCards();
        setIsCardModalOpen(false);
        setCardFormData({ front: '', back: '' });
    };

    const startStudy = (deck) => {
        const deckCards = cards.filter(c => c.deckId === deck.id);
        if (deckCards.length === 0) {
            showToast('Add some cards to this deck first!', 'warning');
            return;
        }
        // Simple spaced repetition filter: lower levels prioritized
        // In a real app, nextReview would be used.
        setStudyCards([...deckCards].sort((a, b) => a.level - b.level));
        setCurrentIndex(0);
        setSelectedDeck(deck);
        setIsStudyMode(true);
        setIsFlipped(false);
    };

    const handleAnswer = async (correct) => {
        const card = studyCards[currentIndex];
        let newLevel = card.level;

        if (correct) {
            newLevel = Math.min(card.level + 1, 5);
        } else {
            newLevel = Math.max(card.level - 1, 1);
        }

        await flashcardService.update(card.id, { level: newLevel });
        await refreshCards();

        if (currentIndex < studyCards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            setIsStudyMode(false);
            showToast('Study session complete!', 'success');
        }
    };

    const handleAIGenerateCards = async () => {
        if (!aiContext.trim()) {
            showToast('Please provide some context text for AI generation.', 'warning');
            return;
        }

        setIsGenerating(true);
        try {
            const moduleName = modules.find(m => m.id === selectedDeck.moduleId)?.name || 'General';
            const generatedCards = await aiService.generateFlashcards(moduleName, aiContext);

            // Add all generated cards to the current deck
            for (const card of generatedCards) {
                await flashcardService.add({
                    front: card.question,
                    back: card.answer,
                    deckId: selectedDeck.id,
                    level: card.level || 1,
                    nextReview: new Date().toISOString()
                });
            }

            await refreshCards();
            setIsAIGenModalOpen(false);
            setAiContext('');
            showToast(`Successfully generated ${generatedCards.length} cards!`, 'success');
        } catch (error) {
            console.error('AI Generation failed:', error);
            showToast('AI Service failed. Please check your API key.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyExternalLink = async (deck) => {
        try {
            const response = await api.post(`/public/flashcardDecks/${deck.id}/toggle`);
            if (response.data.isPublic) {
                const url = `${window.location.origin}/share/flashcards/${deck.id}`;
                const shareText = `Check out this flashcard deck on StudySync: ${deck.name}\n${url}`;
                await navigator.clipboard.writeText(shareText);
                showToast('Link copied & made public!', 'success');
            } else {
                showToast('Deck is now private.', 'info');
            }
            await refreshDecks();
        } catch (error) {
            console.error('Failed to share:', error);
            showToast('Failed to generate share link', 'error');
        }
    };

    if (isStudyMode) {
        const currentCard = studyCards[currentIndex];
        return (
            <Layout title={`Studying: ${selectedDeck.name}`}>
                <div className="max-w-2xl mx-auto py-12">
                    <div className="flex justify-between items-center mb-8">
                        <Button variant="ghost" onClick={() => setIsStudyMode(false)} className="flex items-center gap-2">
                            <ChevronLeft size={20} />
                            <span>Exit Session</span>
                        </Button>
                        <div className="text-sm font-bold text-slate-500">
                            Card {currentIndex + 1} of {studyCards.length}
                        </div>
                    </div>

                    <div
                        className="relative h-[400px] w-full cursor-pointer perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className={`w-full h-full transition-all duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                            {/* Front */}
                            <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-primary-900/30 rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center">
                                <p className="text-[10px] uppercase font-bold text-primary-500 mb-4 tracking-widest">Question</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentCard.front}</h3>
                                <p className="mt-8 text-xs text-slate-400 italic">Click to flip</p>
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-12 text-center">
                                <p className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 mb-4 tracking-widest">Answer</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{currentCard.back}</h3>
                                <p className="mt-8 text-xs text-slate-400 italic">Click to flip back</p>
                            </div>
                        </div>
                    </div>

                    {isFlipped && (
                        <div className="flex gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
                            <Button
                                variant="danger"
                                className="flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 h-16"
                                onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
                            >
                                <X size={24} />
                                <span>Still Learning</span>
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1 py-4 rounded-2xl bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 h-16"
                                onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
                            >
                                <Check size={24} />
                                <span>Mastered It</span>
                            </Button>
                        </div>
                    )}
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Spaced Repetition Flashcards">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Study Decks</h1>
                    <p className="text-slate-500 dark:text-slate-400">Master complex IT concepts with the Leitner System.</p>
                </div>
                <Button onClick={() => setIsDeckModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={20} />
                    <span>Create Deck</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map(deck => {
                    const deckCards = cards.filter(c => c.deckId === deck.id);
                    const avgLevel = deckCards.length > 0
                        ? (deckCards.reduce((acc, c) => acc + c.level, 0) / deckCards.length).toFixed(1)
                        : 0;

                    return (
                        <Card
                            key={deck.id}
                            title={deck.name}
                            HeaderAction={
                                <div className="flex items-center gap-2 text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg text-xs font-bold">
                                    <Layers size={14} />
                                    <span>{deckCards.length} Cards</span>
                                </div>
                            }
                        >
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">Mastery Progress</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-100">Avg. Level {avgLevel} / 5</span>
                                </div>
                                <div className="flex gap-1 h-2">
                                    {[1, 2, 3, 4, 5].map(lvl => {
                                        const count = deckCards.filter(c => c.level === lvl).length;
                                        const width = deckCards.length > 0 ? (count / deckCards.length) * 100 : 0;
                                        return (
                                            <div
                                                key={lvl}
                                                className={`h-full rounded-full transition-all duration-500 ${lvl === 1 ? 'bg-red-400' :
                                                    lvl === 2 ? 'bg-orange-400' :
                                                        lvl === 3 ? 'bg-yellow-400' :
                                                            lvl === 4 ? 'bg-blue-400' : 'bg-green-500'
                                                    }`}
                                                style={{ width: `${width}%` }}
                                            />
                                        );
                                    })}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        className="flex-1 flex items-center justify-center gap-2"
                                        onClick={() => startStudy(deck)}
                                        disabled={deckCards.length === 0}
                                    >
                                        <Play size={16} />
                                        <span>Study Now</span>
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="px-3"
                                        title="AI Generate Cards"
                                        onClick={() => { setSelectedDeck(deck); setIsAIGenModalOpen(true); }}
                                    >
                                        <Sparkles size={16} className="text-purple-500" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className={`px-3 ${deck.isPublic ? 'text-primary-500 bg-primary-50' : ''}`}
                                        title={deck.isPublic ? "Public (Click to toggle)" : "Share Externally"}
                                        onClick={() => handleCopyExternalLink(deck)}
                                    >
                                        <Globe size={16} />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="px-3"
                                        onClick={() => { setSelectedDeck(deck); setIsCardModalOpen(true); }}
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Deck Modal */}
            <Modal
                isOpen={isDeckModalOpen}
                onClose={() => setIsDeckModalOpen(false)}
                title="Create New Deck"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsDeckModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateDeck}>Create Deck</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Deck Name"
                        placeholder="e.g. Networking Fundamentals"
                        value={deckFormData.name}
                        onChange={(e) => setDeckFormData({ ...deckFormData, name: e.target.value })}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
                        <select
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                            value={deckFormData.moduleId}
                            onChange={(e) => setDeckFormData({ ...deckFormData, moduleId: e.target.value })}
                            required
                        >
                            <option value="">Select a module</option>
                            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </form>
            </Modal>

            {/* Card Modal */}
            <Modal
                isOpen={isCardModalOpen}
                onClose={() => setIsCardModalOpen(false)}
                title={`Add Card to ${selectedDeck?.name}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCardModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddCard}>Add Card</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Front (Question)</label>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100 min-h-[100px]"
                            value={cardFormData.front}
                            onChange={(e) => setCardFormData({ ...cardFormData, front: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Back (Answer)</label>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100 min-h-[100px]"
                            value={cardFormData.back}
                            onChange={(e) => setCardFormData({ ...cardFormData, back: e.target.value })}
                            required
                        />
                    </div>
                </form>
            </Modal>

            {/* AI Generation Modal */}
            <Modal
                isOpen={isAIGenModalOpen}
                onClose={() => setIsAIGenModalOpen(false)}
                title={`AI Flashcard Generator (Deck: ${selectedDeck?.name})`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAIGenModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleAIGenerateCards}
                            disabled={isGenerating || !aiContext.trim()}
                            className="bg-gradient-to-r from-purple-600 to-primary-600 h-11"
                        >
                            {isGenerating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Generating...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} />
                                    <span>Generate with AI</span>
                                </div>
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl flex gap-3">
                        <Brain className="text-purple-500 shrink-0" size={20} />
                        <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
                            Paste your study notes, a chapter summary, or technical documentation below.
                            StudySync AI will convert it into a set of high-quality flashcards for your deck.
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Context Text</label>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-slate-100 min-h-[200px]"
                            placeholder="Paste notes here..."
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            disabled={isGenerating}
                        />
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default Flashcards;
