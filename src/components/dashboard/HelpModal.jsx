import React from 'react';
import Modal from '../ui/Modal';
import {
    LayoutDashboard,
    BookOpen,
    CheckSquare,
    Zap,
    TrendingUp,
    Info
} from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
    const steps = [
        {
            icon: <LayoutDashboard className="text-blue-500" />,
            title: "Dashboard Overview",
            description: "View your study statistics, elite league progress, and upcoming tasks at a glance. The heatmap shows your study consistency over time."
        },
        {
            icon: <BookOpen className="text-purple-500" />,
            title: "Modules",
            description: "Create and manage your study modules. Upload resources, set target hours, and generate AI flashcards to master your subjects."
        },
        {
            icon: <CheckSquare className="text-orange-500" />,
            title: "Tasks & Planning",
            description: "Organize your assignments and deadlines. The system prioritizes tasks based on due dates to keep you on track."
        },
        {
            icon: <Zap className="text-yellow-500" />,
            title: "Deep Focus Mode",
            description: "Enter a distraction-free zone with integrated Pomodoro timer and ambient music to maximize your productivity."
        },
        {
            icon: <TrendingUp className="text-emerald-500" />,
            title: "Analytics & Growth",
            description: "Track your detailed progress, earn XP, and climb the Elite Leagues as you consistently meet your study goals."
        }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="How to Use Study Assistance"
            size="default"
        >
            <div className="space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Welcome to your personal study assistant! Here's a quick guide to help you get the most out of the features.
                </p>

                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="mt-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm h-fit">
                                {React.cloneElement(step.icon, { size: 20 })}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">
                                    {step.title}
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500 italic">
                        Need more help? Contact support or check the user guide.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default HelpModal;
