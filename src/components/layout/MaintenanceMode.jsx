import React from 'react';
import { motion } from 'framer-motion';

const MaintenanceMode = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-500/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-2xl px-6 text-center"
            >
                <div className="mb-8 flex justify-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="relative"
                    >
                        <div className="h-24 w-24 rounded-full border-t-2 border-b-2 border-primary-500/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                    </motion.div>
                </div>

                <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                    Site <span className="gradient-text-premium">Under Maintenance</span>
                </h1>

                <p className="mb-10 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                    We're currently performing some scheduled maintenance to improve your experience.
                    The academic command center will be back online shortly. Thank you for your patience.
                </p>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <div className="glass dark:glass-dark flex items-center gap-3 rounded-2xl px-6 py-3">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">System Status: Offline for Maintenance</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="mt-16 text-sm text-slate-400"
                >
                    Estimated time remaining: <span className="font-semibold text-slate-600 dark:text-slate-300">Evaluating...</span>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default MaintenanceMode;
