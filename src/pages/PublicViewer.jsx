import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ExternalLink, Book, Layers, Play, VideoOff, AlertCircle } from 'lucide-react';
import api from '../services/api';

const PublicViewer = () => {
    const { collection, id } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // For Flashcards
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Determine collection from path if not in params (e.g. /share/tutorials/:id)
                let targetCollection = collection;
                let targetId = id;

                // If using specific routes like /share/tutorials/:id
                if (!collection) {
                    const pathParts = window.location.pathname.split('/');
                    if (pathParts.includes('tutorials')) targetCollection = 'tutorials';
                    else if (pathParts.includes('flashcards')) targetCollection = 'flashcardDecks';
                    targetId = pathParts[pathParts.length - 1];
                }

                // If flashcards route, map to flashcardDecks for API
                if (targetCollection === 'flashcards') targetCollection = 'flashcardDecks';

                const response = await api.get(`/public/${targetCollection}/${targetId}`);
                setItem(response.data);
                document.title = `StudySync - ${response.data.title}`;
            } catch (err) {
                console.error('Failed to load shared content:', err);
                setError('Content not found or is private.');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [collection, id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Unavailable</h1>
                <p className="text-slate-600 dark:text-slate-400 text-center mb-6">{error || 'Item not found'}</p>
                <Link to="/">
                    <Button variant="primary">Go to StudySync</Button>
                </Link>
            </div>
        );
    }

    // --- RENDERERS ---

    const renderFlashcards = () => {
        const cards = item.cards || [];
        if (cards.length === 0) return <div className="text-center p-10">No cards in this deck.</div>;

        const currentCard = cards[currentIndex];

        return (
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div className="text-sm font-bold text-slate-500">
                        Card {currentIndex + 1} of {cards.length}
                    </div>
                </div>

                <div
                    className="relative h-[400px] w-full cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`w-full h-full transition-all duration-500 transform-style-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-900 border-2 border-primary-100 dark:border-primary-900/30 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 md:p-12 text-center overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] uppercase font-bold text-primary-500 mb-4 tracking-widest shrink-0">Question</p>
                            <h3 className="text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 break-words w-full">{currentCard.front}</h3>
                            <p className="mt-8 text-xs text-slate-400 italic shrink-0">Click to flip</p>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 md:p-12 text-center overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 mb-4 tracking-widest shrink-0">Answer</p>
                            <h3 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 break-words w-full">{currentCard.back}</h3>
                            <p className="mt-8 text-xs text-slate-400 italic shrink-0">Click to flip back</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between mt-8 gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }}
                        disabled={currentIndex === 0}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => { setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1)); setIsFlipped(false); }}
                        disabled={currentIndex === cards.length - 1}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };

    const renderTutorial = () => {
        const getYouTubeId = (url) => {
            if (!url) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        const videoId = item.videoId || getYouTubeId(item.url);

        return (
            <div className="max-w-4xl mx-auto w-full">
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl mb-8">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={item.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-4">{item.title}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">{item.description}</p>
                {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700 font-semibold">
                        <ExternalLink size={16} />
                        Watch on YouTube
                    </a>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                            SS
                        </div>
                        <span className="font-bold text-lg text-slate-800 dark:text-white">StudySync</span>
                    </div>
                    <Link to="/login">
                        <Button variant="primary" size="sm">Log In / Sign Up</Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {item.cards ? renderFlashcards() : renderTutorial()}
            </main>
        </div>
    );
};

export default PublicViewer;
