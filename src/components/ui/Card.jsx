import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const Card = ({ children, className = '', title = '', HeaderAction = null }) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;

        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <motion.div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                bg-white dark:bg-slate-900 
                rounded-2xl 
                border border-slate-200/50 dark:border-slate-800
                shadow-xl shadow-slate-200/20 dark:shadow-black/40
                overflow-hidden 
                transition-shadow duration-300 
                relative
                group
                flex flex-col
                ${className}
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -5,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
            {/* Spotlight Effect - Border */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl z-20"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.4), transparent 40%)`
                }}
            />

            {/* Spotlight Effect - Surface */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-2xl z-10"
                style={{
                    opacity,
                    background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.06), transparent 40%)`
                }}
            />

            {(title || HeaderAction) && (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-20 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    {title && (
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                            {title}
                        </h3>
                    )}
                    {HeaderAction && <div>{HeaderAction}</div>}
                </div>
            )}

            <div className="p-5 relative z-20 flex-1">
                {children}
            </div>

            {/* Subtle Gradient Overlay for Texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-purple-500/5 pointer-events-none z-0" />
        </motion.div>
    );
};

export default Card;
