import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Search, ChevronDown, HelpCircle, BookOpen, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

const HELP_TOPICS = [
    { id: 'modules', label: 'How to add modules?', query: 'How do I add a new module?' },
    { id: 'notes', label: 'Creating notes', query: 'How do I create a note?' },
    { id: 'groups', label: 'Join a group', query: 'How do I join a study group?' },
    { id: 'flashcards', label: 'Using flashcards', query: 'How do flashcards work?' }
];

const KNOWLEDGE_BASE = {
    'module': 'To add a module, go to the Dashboard and click the "Add Module" button. You can then set your target hours and color code it.',
    'note': 'Navigate to the "Notes" section from the sidebar. Click "New Note" to start writing. You can format text, add code blocks, and even attach PDFs.',
    'group': 'Go to the "Chat" section. Select "Join Group" and enter the invite code provided by a group admin. Or create your own group!',
    'flashcard': 'Flashcards use Spaced Repetition. Create a deck in the "Flashcards" section, add cards, and then hit "Study Now" to start a session.',
    'default': 'I can help you with Features, Navigation, and Study Tips. Try asking about Modules, Notes, or Chats!'
};

export default function HelpAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, type: 'bot', content: 'Hi! I\'m your Study Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        // User Message
        const userMsg = { id: Date.now(), type: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simple Keyword Matching Logic
        setTimeout(() => {
            const lowerText = text.toLowerCase();
            let response = KNOWLEDGE_BASE.default;

            if (lowerText.includes('module') || lowerText.includes('subject')) response = KNOWLEDGE_BASE.module;
            else if (lowerText.includes('note') || lowerText.includes('write')) response = KNOWLEDGE_BASE.note;
            else if (lowerText.includes('group') || lowerText.includes('chat') || lowerText.includes('friend')) response = KNOWLEDGE_BASE.group;
            else if (lowerText.includes('flash') || lowerText.includes('card') || lowerText.includes('study')) response = KNOWLEDGE_BASE.flashcard;

            const botMsg = { id: Date.now() + 1, type: 'bot', content: response };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000); // Simulate network delay
    };

    const handleTopicClick = (query) => {
        handleSend(query);
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl shadow-blue-500/30 transition-colors ${isOpen ? 'bg-slate-800 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    }`}
            >
                {isOpen ? <ChevronDown size={24} /> : <HelpCircle size={24} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">Help Assistant</h3>
                                    <p className="text-[10px] opacity-80 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                            {messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.type === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggested Topics (if default view) */}
                        {messages.length < 3 && !isTyping && (
                            <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                                {HELP_TOPICS.map(topic => (
                                    <button
                                        key={topic.id}
                                        onClick={() => handleTopicClick(topic.query)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-900/30"
                                    >
                                        {topic.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask for help..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            />
                            <Button
                                onClick={() => handleSend()}
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white p-0 disabled:opacity-50"
                            >
                                <Send size={18} />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
