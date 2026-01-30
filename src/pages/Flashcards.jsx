import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { flashcardDeckService, flashcardService, moduleService } from '../services/firestoreService';
import { Plus, Book, Brain, ChevronRight, ChevronLeft, RotateCcw, Check, X, Layers, Play } from 'lucide-react';

const Flashcards = () => {
    const { data: decks, refresh: refreshDecks } = useFirestore(flashcardDeckService.getAll);
    const { data: cards, refresh: refreshCards } = useFirestore(flashcardService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);

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
            alert('Add some cards to this deck first!');
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
            alert('Study session complete!');
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
        </Layout>
    );
};

export default Flashcards;
