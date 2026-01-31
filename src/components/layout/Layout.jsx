import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import BackgroundBubbles from '../ui/BackgroundBubbles';
import FloatingParticles from '../ui/FloatingParticles';

const Layout = ({ children, title = 'Dashboard' }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-transparent flex transition-colors duration-300">
            <BackgroundBubbles />
            <FloatingParticles count={15} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative z-10 transition-all duration-300">
                <Header title={title} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-transparent to-purple-50/20 dark:from-primary-900/5 dark:via-transparent dark:to-purple-900/10 pointer-events-none z-0" />
                <main className="p-4 lg:p-8 flex-1 overflow-x-hidden relative z-10">
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
