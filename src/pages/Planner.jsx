import React, { useMemo, useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ComingSoonBadge from '../components/ui/ComingSoonBadge';
import { useFirestore } from '../hooks/useFirestore';
import {
    taskService,
    flashcardService,
    flashcardDeckService,
    moduleService
} from '../services/firestoreService';
import {
    Calendar,
    Clock,
    Brain,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    GraduationCap,
    BookOpen
} from 'lucide-react';
import {
    differenceInDays,
    isPast,
    isToday,
    addDays,
    format,
    parseISO,
    isValid
} from 'date-fns';
import aiService from '../services/aiService';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const Planner = () => {
    const { data: tasks } = useFirestore(taskService.getAll);
    const { data: decks } = useFirestore(flashcardDeckService.getAll);
    const { data: cards } = useFirestore(flashcardService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);

    const [dailyPlan, setDailyPlan] = useState([]);
    const [isLoadingPlan, setIsLoadingPlan] = useState(false);

    // 1. Identify upcoming exams
    const exams = useMemo(() => {
        if (!tasks) return [];
        return tasks
            .filter(t => (t.title.toLowerCase().includes('exam') || t.title.toLowerCase().includes('quiz') || t.title.toLowerCase().includes('midterm')) && !isPast(parseISO(t.dueDate)) && t.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [tasks]);

    // 2. Identify due flashcards (Leitner System)
    const dueReviews = useMemo(() => {
        const now = new Date();
        const dueDecks = [];

        decks.forEach(deck => {
            const deckCards = cards.filter(c => c.deckId === deck.id);
            if (deckCards.length === 0) return;

            // In a real Leitner system, we check 'nextReview' date. 
            // Here we verify if any card in the deck is due or simply has low performance.
            // For demo: count cards with level < 5 as "reviewable"
            const learningCount = deckCards.filter(c => c.level < 5).length;

            // Simple heuristic score for priority
            if (learningCount > 0) {
                dueDecks.push({
                    ...deck,
                    count: learningCount,
                    total: deckCards.length,
                    priority: learningCount / deckCards.length
                });
            }
        });

        return dueDecks.sort((a, b) => b.priority - a.priority).slice(0, 3);
    }, [decks, cards]);

    const generateAIPlan = async () => {
        if (!tasks || !modules || !cards) return;
        setIsLoadingPlan(true);
        try {
            const plan = await aiService.generateStudyPlan(tasks, modules, cards);
            setDailyPlan(plan.map(item => ({
                ...item,
                icon: item.type === 'exam_prep' ? AlertCircle : (item.type === 'review' ? Brain : CheckCircle2),
                color: item.type === 'exam_prep' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : (item.type === 'review' ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20')
            })));
        } catch (error) {
            console.error('Failed to generate AI plan:', error);
            // Fallback to static logic if AI fails
            const fallbackPlan = [
                { type: 'review', title: 'Daily Review', duration: '30m', icon: Brain, color: 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' }
            ];
            setDailyPlan(fallbackPlan);
        } finally {
            setIsLoadingPlan(false);
        }
    };

    useEffect(() => {
        if (tasks && modules && cards && dailyPlan.length === 0) {
            generateAIPlan();
        }
    }, [tasks, modules, cards]);

    const getModuleName = (id) => modules.find(m => m.id === id)?.name || 'General';

    return (
        <Layout title="Auto-Planner">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Daily Plan */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 dark:from-slate-800 dark:via-purple-900/30 dark:to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-white/10"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Today's Mission</h2>
                                        <ComingSoonBadge size="sm" />
                                    </div>
                                    <p className="opacity-80">AI-generated schedule based on your deadlines.</p>
                                </div>
                                <div className="relative">
                                    <Button
                                        variant="secondary"
                                        className="!bg-white/10 !border-white/20 hover:!bg-white/20 text-white hover:scale-105 transition-transform"
                                        onClick={generateAIPlan}
                                        disabled={isLoadingPlan}
                                    >
                                        {isLoadingPlan ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    </Button>
                                    <ComingSoonBadge size="sm" position="top-right" />
                                </div>
                            </div>

                            <div className="space-y-4 mt-6">
                                {dailyPlan.map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/20 hover:scale-[1.02] transition-all cursor-pointer hover:shadow-lg hover:shadow-purple-500/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl bg-white/10 ${item.color.replace('text-', 'text-white ')} group-hover:scale-110 transition-transform`}>
                                                <item.icon size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold">{item.title}</h4>
                                                <span className="text-xs opacity-70 flex items-center gap-1">
                                                    <Clock size={12} /> {item.duration}
                                                </span>
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                ))}
                                {dailyPlan.length === 0 && (
                                    <div className="text-center py-8 opacity-60">
                                        <CheckCircle2 size={48} className="mx-auto mb-2" />
                                        <p>You're all caught up! Enjoy your free time.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 blur-[120px] opacity-20" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500 to-cyan-500 blur-[100px] opacity-15" />
                    </motion.div>

                    <Card title="Exam Countdown">
                        <div className="space-y-4">
                            {exams.length > 0 ? exams.map(exam => {
                                const daysLeft = differenceInDays(parseISO(exam.dueDate), new Date());
                                return (
                                    <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-100">{exam.title}</h4>
                                                <span className="text-xs text-slate-500">{format(parseISO(exam.dueDate), 'PPP')}</span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{daysLeft}</span>
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Days Left</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-8 text-slate-400 text-sm">No upcoming exams found. Add a task with 'Exam' in the title.</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Col: Review Suggestions */}
                <div className="space-y-6">
                    <Card title="Smart Reviews" HeaderAction={<Brain size={18} className="text-primary-500" />}>
                        <div className="space-y-4">
                            {dueReviews.map(deck => (
                                <motion.div
                                    key={deck.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/10 transition-all relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">{getModuleName(deck.moduleId)}</span>
                                        <span className="text-xs font-bold text-slate-400">{deck.count} cards due</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-3">{deck.name}</h4>
                                    <div className="relative">
                                        <Button className="w-full text-xs py-2">Start Session</Button>
                                        <ComingSoonBadge size="sm" position="top-right" />
                                    </div>
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/5 blur-2xl rounded-full" />
                                </motion.div>
                            ))}
                            {dueReviews.length === 0 && (
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    No cards due for review!
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-6 rounded-3xl">
                        <div className="flex items-start gap-4">
                            <GraduationCap className="text-yellow-600 dark:text-yellow-500 shrink-0" size={24} />
                            <div>
                                <h4 className="font-bold text-yellow-800 dark:text-yellow-500 mb-1">Study Tip</h4>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                                    "Interleaved Practice" (mixing different subjects) is more effective than blocking. Try switching between {modules[0]?.name || 'topics'} and {modules[1]?.name || 'other topics'} today.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Planner;
