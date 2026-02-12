import { X, Copy, Check, LogOut, Users, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function GroupInfoDrawer({ isOpen, onClose, group, members, onlineUsers, currentUser, onLeaveGroup }) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !group) return null;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(group.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-[#111b21] border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Info size={18} className="text-slate-500" />
                    <h3 className="font-bold dark:text-slate-100">Group Info</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <X size={20} className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Group Details */}
                <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                        {group.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold dark:text-slate-100 mb-1">{group.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{group.description || 'No description provided.'}</p>

                    <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invite Code</span>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-lg font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">{group.inviteCode}</span>
                            <button onClick={handleCopyCode} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-slate-400" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Member List */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} />
                            Members ({members.length})
                        </h4>
                    </div>
                    <div className="space-y-4">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {onlineUsers.has(member.id) && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#111b21] rounded-full" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold dark:text-slate-100 truncate">
                                            {member.id === currentUser.id ? 'You' : (member.name || member.email?.split('@')[0])}
                                        </p>
                                        {group.creatorId === member.id && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-bold uppercase">Admin</span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {onlineUsers.has(member.id) ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => {
                        if (window.confirm('Are you sure you want to leave this group?')) {
                            onLeaveGroup(group.id);
                        }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <LogOut size={18} />
                    Leave Group
                </button>
            </div>
        </motion.div>
    );
}
