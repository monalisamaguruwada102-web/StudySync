import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Check, Rocket, Zap, MessageCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const steps = [
    {
        id: 'welcome',
        title: 'Welcome to StudySync!',
        description: 'Your all-in-one platform for mastering your studies. Let\'s get you set up for success.',
        icon: <Rocket size={48} className="text-blue-500" />,
        color: 'from-blue-500 to-indigo-600'
    },
    {
        id: 'modules',
        title: 'Track Your Modules',
        description: 'Organize your subjects, track progress, and visualize your journey with our interactive maps.',
        icon: <Zap size={48} className="text-amber-500" />,
        color: 'from-amber-500 to-orange-600'
    },
    {
        id: 'notes',
        title: 'Smart Notes & Flashcards',
        description: 'Create rich notes, convert them to flashcards, and use Spaced Repetition to retain everything.',
        icon: <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}><MessageCircle size={48} className="text-emerald-500" /></motion.div>,
        color: 'from-emerald-500 to-teal-600'
    },
    {
        id: 'collab',
        title: 'Collaborate & Chat',
        description: 'Join study groups, share resources, and chat in real-time with peers.',
        icon: <MessageCircle size={48} className="text-purple-500" />,
        color: 'from-purple-500 to-pink-600'
    }
];

export default function OnboardingTutorial() {
    const { user, login, updateUser } = useAuth(); // login used to update user state locally if needed
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Only show tutorial if user is newly registered and hasn't completed it
        if (user && user.newly_registered && !user.tutorial_completed) {
            // Small delay for better UX
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        try {
            await api.post('/users/tutorial-status', { visited: true });

            // Update local user state immediately via context
            if (user) {
                updateUser({ tutorial_completed: true, newly_registered: false });

                // Also update localStorage as a backup
                const updatedUser = { ...user, tutorial_completed: true, newly_registered: false };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            setIsOpen(false);
        } catch (error) {
            console.error('Error completing tutorial:', error);
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative"
                >
                    {/* Header Image/Pattern */}
                    <div className={`h-32 bg-gradient-to-br ${step.color} relative overflow-hidden flex items-center justify-center`}>
                        <div className="absolute inset-0 bg-white/10 noise-bg opacity-20"></div>
                        <motion.div
                            key={step.id}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/20 p-6 rounded-full backdrop-blur-md shadow-lg"
                        >
                            {step.icon}
                        </motion.div>

                        <button
                            onClick={handleComplete}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                        <motion.h2
                            key={step.title}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-slate-800 dark:text-white mb-3"
                        >
                            {step.title}
                        </motion.h2>
                        <motion.p
                            key={step.description}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed"
                        >
                            {step.description}
                        </motion.p>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? `w-8 bg-gradient-to-r ${step.color}` : 'w-2 bg-slate-200 dark:bg-slate-700'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={handleComplete}
                                className="flex-1"
                            >
                                Skip
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleNext}
                                className={`flex-[2] bg-gradient-to-r ${step.color} border-none shadow-lg shadow-blue-500/20`}
                            >
                                {isLast ? (
                                    <span className="flex items-center gap-2 justify-center">
                                        Get Started <Rocket size={18} />
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 justify-center">
                                        Next <ChevronRight size={18} />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
