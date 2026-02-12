import { motion, AnimatePresence } from 'framer-motion';
import { Smile } from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];

/**
 * A simple emoji reaction picker that appears on hover/click.
 */
export function ReactionPicker({ onSelect, isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-50 bottom-full mb-2 left-0 bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 rounded-full py-1.5 px-3 flex items-center gap-1.5"
        >
            {COMMON_EMOJIS.map((emoji) => (
                <button
                    key={emoji}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(emoji);
                        onClose();
                    }}
                    className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                    {emoji}
                </button>
            ))}
        </motion.div>
    );
}

/**
 * Displays grouped reactions at the bottom of a message bubble.
 */
export function MessageReactions({ reactions, onReact }) {
    if (!reactions || Object.keys(reactions).length === 0) return null;

    // Filter and count reactions: { "👍": ["user1", "user2"], "❤️": ["user3"] }
    // Note: We expect reactions to be an object where keys are emojis and values are arrays of userIds

    return (
        <div className="absolute -bottom-3 left-2 flex flex-wrap gap-1">
            {Object.entries(reactions).map(([emoji, userIds]) => {
                if (!userIds || userIds.length === 0) return null;
                return (
                    <button
                        key={emoji}
                        onClick={(e) => {
                            e.stopPropagation();
                            onReact(emoji);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                        <span className="text-xs">{emoji}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {userIds.length}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
