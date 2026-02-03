import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const BackgroundBubbles = () => {
    const { isDarkMode } = useTheme();
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Generate random bubbles with gradient colors
        const bubbleCount = 6;
        const gradients = [
            'from-blue-500/10 to-purple-500/10',
            'from-purple-500/10 to-pink-500/10',
            'from-cyan-500/10 to-blue-500/10',
        ];

        const newBubbles = Array.from({ length: bubbleCount }).map((_, i) => ({
            id: i,
            size: Math.random() * 400 + 300, // 300-700px
            x: Math.random() * 80,
            y: Math.random() * 80,
            duration: Math.random() * 20 + 20, // 20-40s (slower)
            delay: Math.random() * 5,
            gradient: gradients[Math.floor(Math.random() * gradients.length)],
            opacity: Math.random() * 0.3 + 0.1
        }));
        setBubbles(newBubbles);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-500">
            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    className={`absolute rounded-full bg-gradient-to-br ${bubble.gradient}`}
                    style={{
                        width: bubble.size,
                        height: bubble.size,
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                        opacity: bubble.opacity,
                        filter: `blur(${100}px)`, // High blur for softness
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{
                        duration: bubble.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                        delay: bubble.delay
                    }}
                />
            ))}
        </div>
    );
};

export default BackgroundBubbles;
