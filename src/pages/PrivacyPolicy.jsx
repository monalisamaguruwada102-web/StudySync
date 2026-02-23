import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, Lock, Globe, Server, UserCheck, LayoutDashboard } from 'lucide-react';

const PrivacyPolicy = () => {
    const navigate = useNavigate();
    const lastUpdated = "February 17, 2026";

    const sections = [
        {
            icon: Eye,
            title: "Data Collection",
            content: "We collect information you provide directly to us, such as when you create an account, create a study group, or use our analytics features. This includes email, display names, and study metrics."
        },
        {
            icon: Server,
            title: "Local-First Storage",
            content: "StudySync uses a multi-layer persistence model. Data is stored on your local device (IndexedDB) for speed and offline availability, then synced to our secure primary cloud (Supabase) via encrypted channels."
        },
        {
            icon: Lock,
            title: "Security Measures",
            content: "We implement industry-standard security headers (Helmet) and rate limiting to protect your account. Your data is protected by Row Level Security (RLS) ensuring that only you can access your personal study data."
        },
        {
            icon: UserCheck,
            title: "Your Rights",
            content: "You have the right to access, correct, or delete your data at any time through the Settings panel. We also allow you to export your data in JSON format for your own records."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 pt-32 pb-12 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="group mb-12 flex items-center gap-2 text-slate-400 hover:text-rose-700 dark:hover:text-rose-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform" />
                    Dashboard
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-20">
                        <div className="inline-flex p-4 bg-rose-50 dark:bg-rose-900/20 mb-6">
                            <ShieldAlert className="text-rose-700 dark:text-rose-500 w-10 h-10" />
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black text-black dark:text-white mb-6 tracking-tighter uppercase">
                            Privacy <span className="text-rose-700 dark:text-rose-600">Policy</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">
                            Last Updated: {lastUpdated}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-8 bg-white dark:bg-slate-900 border-l-4 border-rose-700 dark:border-rose-600 shadow-sm"
                            >
                                <div className="flex items-start gap-8">
                                    <div className="w-12 h-12 bg-black dark:bg-white flex items-center justify-center text-white dark:text-black shrink-0">
                                        <section.icon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-black dark:text-white mb-3 uppercase tracking-wide">
                                            {section.title}
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 p-8 bg-black dark:bg-slate-900 text-white text-center border-t-4 border-rose-700">
                        <p className="max-w-xl mx-auto text-sm leading-relaxed font-medium">
                            StudySync is operated by JoshWebs Digital Solutions. For any privacy-related inquiries,
                            please contact our Data Protection Officer at
                            <span className="text-rose-500 font-black ml-1 uppercase">joshwebsinfo@gmail.com</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
