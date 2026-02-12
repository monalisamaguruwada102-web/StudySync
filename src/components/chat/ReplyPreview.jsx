import { X } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Inline quoted preview shown inside a sent reply message.
 */
export function QuotedMessage({ replyTo, onClickScroll }) {
    if (!replyTo) return null;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClickScroll?.(replyTo.messageId);
            }}
            className="mb-1 px-3 py-1.5 rounded-lg border-l-4 border-blue-500 bg-black/5 dark:bg-white/5 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
            <p className="text-[10px] font-bold text-blue-500 truncate">
                {replyTo.senderName || 'Unknown'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                {replyTo.content}
            </p>
        </div>
    );
}

/**
 * Banner shown above the message input when replying to a message.
 */
export function ReplyBanner({ replyTo, onCancel }) {
    if (!replyTo) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-t-xl"
        >
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Replying to {replyTo.senderName || 'Unknown'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {replyTo.content}
                </p>
            </div>
            <button
                onClick={onCancel}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}
