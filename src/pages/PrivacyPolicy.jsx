import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Eye, Lock, Globe, Server, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
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
        <div className="min-h-screen pt-24 pb-12 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-16">
                        <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl mb-4">
                            <ShieldAlert className="text-emerald-500 w-8 h-8" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            Privacy <span className="text-emerald-500">Policy</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
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
                                className="p-8 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl"
                            >
                                <div className="flex items-start gap-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                                        <section.icon size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                                            {section.title}
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-16 p-8 bg-slate-900 dark:bg-black rounded-[3rem] border border-white/5 text-slate-400 text-center">
                        <p className="max-w-xl mx-auto text-sm leading-relaxed">
                            StudySync is operated by JoshWebs Digital Solutions. For any privacy-related inquiries,
                            please contact our Data Protection Officer at
                            <span className="text-emerald-400 font-bold ml-1">joshwebsinfo@gmail.com</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
