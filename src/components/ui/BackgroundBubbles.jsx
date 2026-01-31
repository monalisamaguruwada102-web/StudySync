import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const BackgroundBubbles = () => {
    const { isDarkMode } = useTheme();
    const [bubbles, setBubbles] = useState([]);

    useEffect(() => {
        // Generate random bubbles with gradient colors
        const bubbleCount = 25;
        const gradients = [
            'from-blue-500/20 to-purple-500/20',
            'from-purple-500/20 to-pink-500/20',
            'from-pink-500/20 to-orange-500/20',
            'from-cyan-500/20 to-blue-500/20',
            'from-indigo-500/20 to-purple-500/20',
            'from-violet-500/20 to-fuchsia-500/20'
        ];

        const newBubbles = Array.from({ length: bubbleCount }).map((_, i) => ({
            id: i,
            size: Math.random() * 150 + 80, // 80-230px
            x: Math.random() * 100, // 0-100%
            y: Math.random() * 100, // 0-100%
            duration: Math.random() * 25 + 15, // 15-40s
            delay: Math.random() * 8,
            gradient: gradients[Math.floor(Math.random() * gradients.length)],
            opacity: Math.random() * 0.3 + 0.2 // 0.2-0.5
        }));
        setBubbles(newBubbles);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
                        filter: `blur(${60 + Math.random() * 40}px)`,
                    }}
                    animate={{
                        x: [0, Math.random() * 150 - 75, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 150 - 75, Math.random() * 100 - 50, 0],
                        scale: [1, 1.3, 0.9, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{
                        duration: bubble.duration,
                        repeat: Infinity,
                        repeatType: "loop",
                        ease: "easeInOut",
                        delay: bubble.delay
                    }}
                />
            ))}
        </div>
    );
};

export default BackgroundBubbles;
