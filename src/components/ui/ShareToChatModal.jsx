import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Search, User, Users, Send, Check } from 'lucide-react';
import useChat from '../../hooks/useChat';

const ShareToChatModal = ({ isOpen, onClose, resource }) => {
    const { conversations, shareResource } = useChat();
    const [searchQuery, setSearchQuery] = useState('');
    const [sharingId, setSharingId] = useState(null);
    const [sharedIds, setSharedIds] = useState(new Set());

    const filteredConversations = conversations.filter(conv => {
        const name = conv.type === 'group'
            ? conv.groupName
            : conv.otherUser?.email;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleShare = async (convId) => {
        setSharingId(convId);
        try {
            await shareResource(convId, resource);
            setSharedIds(prev => new Set(prev).add(convId));
            setTimeout(() => {
                setSharingId(null);
            }, 1000);
        } catch (error) {
            console.error('Error sharing resource:', error);
            setSharingId(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Share ${resource?.type || 'Resource'}`}
        >
            <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Preview</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 line-clamp-1">{resource?.title}</p>
                </div>

                <Input
                    placeholder="Search people or groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                />

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <p className="text-center py-8 text-sm text-slate-500">No conversations found.</p>
                    ) : (
                        filteredConversations.map((conv) => {
                            const isShared = sharedIds.has(conv.id);
                            const isSharing = sharingId === conv.id;

                            return (
                                <div
                                    key={conv.id}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary-500/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                            {conv.type === 'group' ? <Users size={20} /> : <User size={20} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                                                {conv.type === 'group' ? conv.groupName : conv.otherUser?.email}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                                {conv.type}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant={isShared ? "secondary" : "primary"}
                                        onClick={() => handleShare(conv.id)}
                                        disabled={isShared || isSharing}
                                        className="h-8 px-3 rounded-lg"
                                    >
                                        {isSharing ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : isShared ? (
                                            <Check size={16} />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ShareToChatModal;
