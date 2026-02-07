import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const images = [
    "https://img.freepik.com/free-photo/friends-people-group-teamwork-diversity_53876-31488.jpg",
    "https://t4.ftcdn.net/jpg/01/40/21/85/360_F_140218536_OlVwQboj3LQv0YXWnk8BXJjtM9QvbwLp.jpg",
    "https://thumbs.dreamstime.com/b/multi-ethnic-group-young-people-studying-laptop-computer-three-white-desk-beautiful-girls-men-working-toghether-92786746.jpg",
    "https://media.istockphoto.com/id/1867285878/photo/engineering-students-learning-about-diagrams-to-connect-plc-devices.jpg?s=612x612&w=0&k=20&c=PU31Ui2oxn5miSNqHhrc0Tq2kmbV5eP6XKIqO_dyVxY="
];

const ImageSlideshow = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 12000); // 12 seconds per image

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                >
                    <div
                        className="w-full h-full bg-cover bg-center bg-no-repeat transition-transform duration-[12000ms] ease-linear transform scale-[1.05]"
                        style={{ backgroundImage: `url(${images[currentIndex]})` }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Theme-aware overlay for contrast */}
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/60 backdrop-blur-[2px] transition-colors duration-500" />

            {/* Vignette effect */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-white/10 dark:to-black/20" />
        </div>
    );
};

export default ImageSlideshow;
