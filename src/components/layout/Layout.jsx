import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import BackgroundBubbles from '../ui/BackgroundBubbles';

const Layout = ({ children, title = 'Dashboard' }) => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
            <BackgroundBubbles />
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10">
                <Header title={title} />
                <main className="p-8 flex-1 overflow-x-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={window.location.pathname}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Layout;
