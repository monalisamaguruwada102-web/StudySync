import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const BackgroundBubbles = () => {
    const { isDarkMode } = useTheme();
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Generate random bubbles
        const bubbleCount = 15;
        const newBubbles = Array.from({ length: bubbleCount }).map((_, i) => ({
            id: i,
            size: Math.random() * 100 + 50, // 50-150px
            x: Math.random() * 100, // 0-100%
            y: Math.random() * 100, // 0-100%
            duration: Math.random() * 20 + 10, // 10-30s
            delay: Math.random() * 5
        }));
        setBubbles(newBubbles);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    className={`absolute rounded-full blur-3xl opacity-30 ${isDarkMode
                            ? 'bg-primary-900/20'
                            : 'bg-primary-200/40'
                        }`}
                    style={{
                        width: bubble.size,
                        height: bubble.size,
                        left: `${bubble.x}%`,
                        top: `${bubble.y}%`,
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        scale: [1, 1.2, 1],
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
