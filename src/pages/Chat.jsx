import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Share2, Users, Plus, Search, X, Copy, Check, FileText, Brain, Youtube, ExternalLink, LayoutDashboard, CheckCheck, Play, ArrowDown, RefreshCw, Loader2, Clock, Sparkles, Reply, Bot, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import useChat from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ResourceShareModal from '../components/chat/ResourceShareModal';
import { QuotedMessage, ReplyBanner } from '../components/chat/ReplyPreview';
import { ReactionPicker, MessageReactions } from '../components/chat/ReactionPicker';
import { GroupInfoDrawer } from '../components/chat/GroupInfoDrawer';
import AudioRecorder from '../components/chat/AudioRecorder';
import VoiceNotePlayer from '../components/chat/VoiceNotePlayer';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Image, Paperclip, Mic, Smile, MoreVertical, Phone, Video, Hash } from 'lucide-react';
import '../styles/chat_system.css';

// Resource Card Component (for shared items)
function ChatMessageResourceCard({ resource, onClick }) {
    const getTypeStyles = (type) => {
        switch (type) {
            case 'note': return { icon: <FileText size={16} />, color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10', label: 'Note' };
            case 'flashcard': return { icon: <Brain size={16} />, color: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10', label: 'Flashcard' };
            case 'tutorial': return { icon: <Youtube size={16} />, color: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10', label: 'Tutorial' };
            default: return { icon: <Share2 size={16} />, color: 'border-slate-500 text-slate-600', label: 'Resource' };
        }
    };

    const styles = getTypeStyles(resource.type);

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`p-3 rounded-xl border-l-4 ${styles.color} shadow-sm min-w-[220px] max-w-full cursor-pointer group mb-1`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {styles.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{styles.label}</span>
                </div>
                <ExternalLink size={12} className="opacity-40" />
            </div>
            <div className="font-bold text-sm mb-1 truncate">
                {resource.title}
            </div>
            {resource.preview && (
                <div className="text-[11px] opacity-70 line-clamp-2 leading-snug">
                    {resource.preview}
                </div>
            )}
        </motion.div>
    );
}

// Highlighted Text Component
function HighlightedText({ text, highlight }) {
    if (!highlight?.trim()) return <span>{text}</span>;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-300 dark:bg-yellow-600/50 text-slate-800 dark:text-slate-100 rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}

// Message Bubble Component
function MessageBubble({ message, isOwn, handleOpenResource, formatTime, onReply, onScrollToMessage, messageRef, highlightQuery, onReact }) {
    const isSystem = message.type === 'system';
    const [showPicker, setShowPicker] = useState(false);

    if (isSystem) {
        return (
            <div className="flex justify-center mb-4">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1 rounded-full font-medium">
                    {message.content}
                </span>
            </div>
        );
    }

    return (
        <motion.div
            ref={messageRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4 px-4`}
        >
            <div className={`message-bubble ${isOwn ? 'message-sent' : 'message-received'} group/bubble relative`}>
                <div className="flex flex-col gap-1">
                    {/* Reply Context */}
                    {message.replyTo && (
                        <div
                            className={`mb-2 p-2 rounded-lg text-xs border-l-4 cursor-pointer hover:opacity-80 transition-opacity bg-black/5 dark:bg-white/5 ${isOwn ? 'border-white/40' : 'border-blue-500/40'}`}
                            onClick={() => onScrollToMessage(message.replyTo.messageId)}
                        >
                            <p className="font-bold opacity-70 mb-0.5">{message.replyTo.senderName}</p>
                            <p className="line-clamp-1 opacity-60 italic whitespace-pre-wrap">{message.replyTo.content}</p>
                        </div>
                    )}

                    {/* Shared Resource */}
                    {message.sharedResource && (
                        <ChatMessageResourceCard
                            resource={message.sharedResource}
                            onClick={() => handleOpenResource(message.sharedResource)}
                        />
                    )}

                    {/* Content Logic */}
                    {message.type === 'voice' ? (
                        <VoiceNotePlayer
                            src={message.content.startsWith('http') ? message.content : `${api.defaults.baseURL.replace('/api', '')}${message.content}`}
                            duration={message.metadata?.duration}
                            isOwn={isOwn}
                        />
                    ) : message.type === 'image' || message.type === 'attachment' ? (
                        <div className="space-y-2">
                            <div className="rounded-lg overflow-hidden border border-white/10 mb-1">
                                <img
                                    src={message.content}
                                    alt="attachment"
                                    className="max-h-60 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(message.content, '_blank')}
                                />
                            </div>
                            {message.metadata?.caption && (
                                <p className="text-sm">{message.metadata.caption}</p>
                            )}
                        </div>
                    ) : (
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                            <HighlightedText text={message.content} highlight={highlightQuery} />
                        </p>
                    )}

                    {/* Meta info row */}
                    <div className="flex items-center justify-end gap-1.5 mt-1 opacity-60 text-[10px]">
                        <span>{formatTime(message.timestamp || message.created_at)}</span>
                        {isOwn && (
                            <div className="flex items-center">
                                {message.read ? (
                                    <CheckCheck size={12} className="text-blue-300" />
                                ) : message.status === 'delivered' ? (
                                    <CheckCheck size={12} />
                                ) : (
                                    <Check size={12} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Bubble Actions Overlay */}
                <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1 flex items-center gap-1`}>
                    <button onClick={() => onReply(message)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                        <Reply size={14} />
                    </button>
                    <button onClick={() => setShowPicker(!showPicker)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                        <Smile size={14} />
                    </button>
                </div>
            </div>

            {/* Reactions Bar */}
            <MessageReactions reactions={message.reactions} onReact={onReact} messageId={message.id} isOwn={isOwn} />

            <AnimatePresence>
                {showPicker && (
                    <div className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'}`}>
                        <ReactionPicker
                            onSelect={(emoji) => {
                                onReact(message.id, emoji);
                                setShowPicker(false);
                            }}
                            onClose={() => setShowPicker(false)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}



// Resource Viewer Modal
function ResourceViewerModal({ isOpen, onClose, resource, loading, onNavigate }) {
    if (!isOpen) return null;

    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={resource ? `Viewing ${resource.type}: ${resource.title || resource.name}` : 'Loading...'}
            size="lg"
        >
            <div className="min-h-[300px] max-h-[60vh] overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-48 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-slate-500 text-sm">Fetching resource details...</p>
                    </div>
                ) : resource ? (
                    <div className="space-y-6 p-2">
                        {/* Note View */}
                        {resource.type === 'note' && (
                            <div className="space-y-4 text-slate-800 dark:text-slate-200">
                                <p className="text-sm border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-r-lg">
                                    {resource.content || 'No content provided.'}
                                </p>
                                {resource.pdfPath && (
                                    <a
                                        href={resource.pdfPath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl hover:bg-blue-100 transition-colors"
                                    >
                                        <FileText size={18} />
                                        <span>View Attached PDF Document</span>
                                    </a>
                                )}
                                <Button
                                    variant="secondary"
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
                                    onClick={() => onNavigate('/notes')}
                                >
                                    <ExternalLink size={18} />
                                    <span>Open in Notes Manager</span>
                                </Button>
                            </div>
                        )}

                        {/* Tutorial View */}
                        {resource.type === 'tutorial' && (
                            <div className="space-y-4">
                                {getYouTubeId(resource.url) ? (
                                    <div className="aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
                                        <iframe
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${getYouTubeId(resource.url)}`}
                                            title="YouTube video player"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                        <Youtube size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-500">This tutorial is a direct link.</p>
                                    </div>
                                )}
                                <Button
                                    variant="primary"
                                    className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
                                    onClick={() => window.open(resource.url, '_blank')}
                                >
                                    <ExternalLink size={18} />
                                    <span>Open Resource Link</span>
                                </Button>
                            </div>
                        )}

                        {/* Flashcard View */}
                        {resource.type === 'flashcard' && (
                            <div className="space-y-6 py-4">
                                <div className="text-center p-8 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30">
                                    <Brain size={48} className="mx-auto text-purple-500 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                        {resource.name || resource.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Master this deck using Spaced Repetition.
                                    </p>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                    onClick={() => onNavigate('/flashcards')}
                                >
                                    <Play size={20} />
                                    <span className="text-lg">Start Study Session</span>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <X size={48} className="mx-auto text-red-500/50 mb-4" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Resource not found.</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

function Chat() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { showToast } = useNotification();
    const isAdmin = currentUser?.email === (import.meta.env.VITE_ADMIN_EMAIL || 'joshuamujakari15@gmail.com');

    // --- State & Refs ---
    const [activeTab, setActiveTab] = useState('chats'); // 'chats', 'groups', 'explore', 'requests'
    const [messageInput, setMessageInput] = useState('');
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showResourceShare, setShowResourceShare] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [showResourceViewer, setShowResourceViewer] = useState(false);
    const [selectedResourceData, setSelectedResourceData] = useState(null);
    const [viewerLoading, setViewerLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [showNewMessageToast, setShowNewMessageToast] = useState(false);
    const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
    const [replyTo, setReplyTo] = useState(null); // { messageId, content, senderName }
    const [showSearchInChat, setShowSearchInChat] = useState(false);
    const [searchInChatQuery, setSearchInChatQuery] = useState('');
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [isRecordingVoice, setIsRecordingVoice] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionDuration, setSessionDuration] = useState('00:00');
    const messagesEndRef = useRef(null);
    const messageRefs = useRef({});
    const searchInputRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Custom Hooks ---
    const {
        conversations,
        messages,
        activeConversation,
        setActiveConversation,
        sendMessage,
        toggleReaction,
        leaveGroup,
        createDirectConversation,
        shareResource,
        createGroup,
        joinGroup,
        typingUsers,
        sendTyping,
        respondToRequest,
        availableGroups,
        fetchAvailableGroups,
        unreadCounts,
        onlineUsers,
        deleteConversation
    } = useChat();

    // --- State for Deletion ---
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Derived State ---
    const directChats = conversations.filter(c =>
        c.type === 'direct' && (!c.status || c.status === 'active' || (c.status === 'pending' && c.initiatorId === currentUser.id))
    );
    const joinedGroups = conversations.filter(c => c.type === 'group');
    const pendingRequests = conversations.filter(c =>
        c.status === 'pending' &&
        (c.initiatorId || c.initiator_id) !== currentUser.id &&
        c.type === 'direct'
    );

    // Sorting helper: Move most recent to top
    const sortConversations = (list) => {
        return [...list].sort((a, b) => {
            const timeA = new Date(a.lastMessageTime || 0).getTime();
            const timeB = new Date(b.lastMessageTime || 0).getTime();
            return timeB - timeA;
        });
    };

    // Determine which list to show based on tab
    let displayList = [];
    if (activeTab === 'chats') displayList = sortConversations(directChats);
    else if (activeTab === 'groups') displayList = sortConversations(joinedGroups);
    else if (activeTab === 'requests') displayList = sortConversations(pendingRequests);

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Reply & Scroll Helpers ---
    const handleReply = useCallback((message) => {
        setReplyTo({
            messageId: message.id,
            content: message.content?.substring(0, 120) || '',
            senderName: message.senderName || message.senderEmail?.split('@')[0] || 'Unknown'
        });
        // Focus the input
        document.querySelector('textarea[placeholder="Type a message..."]')?.focus();
    }, []);

    const scrollToMessage = useCallback((messageId) => {
        const el = messageRefs.current[messageId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash highlight
            el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2', 'rounded-2xl');
            setTimeout(() => {
                el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2', 'rounded-2xl');
            }, 1500);
        }
    }, []);

    // --- Hoisted Functions ---
    function formatMessageTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return format(date, 'h:mm a');
    }

    function formatLastMessageTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    }

    function getInitials(userOrName) {
        if (!userOrName) return 'S';
        const email = typeof userOrName === 'string' ? userOrName : (userOrName.email || userOrName.name || 'S');
        const emailPrefix = email.split('@')[0];
        const parts = emailPrefix.split(/[\s.@_-]+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return emailPrefix.substring(0, 2).toUpperCase();
    }

    function formatLastSeen(timestamp) {
        if (!timestamp) return 'Offline';
        const date = new Date(timestamp);
        const distance = formatDistanceToNow(date, { addSuffix: true });
        return `Active ${distance}`;
    }

    function getConversationDisplay(conv) {
        if (!conv) return { title: 'Unknown', status: '', isOnline: false, otherUser: null };
        if (conv.type === 'group') {
            return {
                title: conv.groupName || 'Group Chat',
                status: `${conv.participants?.length || 0} members`,
                isOnline: false,
                otherUser: null
            };
        }

        // Try to find the other participant
        const otherUserId = conv.participants?.find(id => id !== currentUser.id);
        const userInfo = users.find(u => u.id === otherUserId);
        const finalUser = userInfo || conv.otherUser;

        // Prioritize email as requested by the user
        const title = finalUser?.email || finalUser?.name || 'Unknown User';
        const isOnline = otherUserId && onlineUsers.has(otherUserId);

        return {
            title,
            status: isOnline ? 'Online' : 'Offline',
            isOnline,
            otherUser: finalUser
        };
    }

    function getTypingText() {
        if (!activeConversation || typingUsers.size === 0) return null;
        const typingInChat = Array.from(typingUsers).filter(uid =>
            activeConversation.participants?.includes(uid) && uid !== currentUser.id
        );
        if (typingInChat.length === 0) return null;
        if (typingInChat.length === 1) return 'Typing...';
        return 'Multiple people typing...';
    }

    // --- Effects ---
    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === 'groups') {
            fetchAvailableGroups();
        }
    }, [activeTab, fetchAvailableGroups]);

    // Scroll tracking
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Increase threshold to 150px for better reliability
        const atBottom = scrollHeight - scrollTop - clientHeight < 150;
        setIsAtBottom(atBottom);
        if (atBottom) setShowNewMessageToast(false);
    };

    useEffect(() => {
        if (isAtBottom) {
            // Use a small timeout to ensure DOM is updated and layout stable
            const timer = setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
            return () => clearTimeout(timer);
        } else if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== currentUser.id) {
                setShowNewMessageToast(true);
            }
        }
    }, [messages, isAtBottom]);

    // Initial scroll to bottom when switching conversations
    useEffect(() => {
        if (activeConversation) {
            setIsAtBottom(true);
            setSessionStartTime(new Date());
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            }, 200);
        } else {
            setSessionStartTime(null);
            setSessionDuration('00:00');
        }
    }, [activeConversation?.id]);

    useEffect(() => {
        if (!sessionStartTime) return;

        const timer = setInterval(() => {
            const now = new Date();
            const diff = Math.floor((now - sessionStartTime) / 1000);
            const mins = Math.floor(diff / 60).toString().padStart(2, '0');
            const secs = (diff % 60).toString().padStart(2, '0');
            setSessionDuration(`${mins}:${secs}`);
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionStartTime]);

    useEffect(() => {
        if (showUserSelector) {
            fetchUsers();
        }
    }, [showUserSelector]);

    const searchResults = showSearchInChat && searchInChatQuery.trim()
        ? messages.reduce((acc, msg, idx) => {
            if (msg.content?.toLowerCase().includes(searchInChatQuery.toLowerCase())) {
                acc.push({ id: msg.id, index: idx });
            }
            return acc;
        }, [])
        : [];

    const handleSearchNavigate = useCallback((direction) => {
        if (searchResults.length === 0) return;
        let nextIndex = direction === 'next' ? currentSearchIndex + 1 : currentSearchIndex - 1;

        if (nextIndex >= searchResults.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = searchResults.length - 1;

        setCurrentSearchIndex(nextIndex);
        scrollToMessage(searchResults[nextIndex].id);
    }, [searchResults, currentSearchIndex, scrollToMessage]);

    // --- Handlers ---
    async function fetchUsers() {
        setIsRefreshingUsers(true);
        try {
            const response = await api.get('/users/all');
            setUsers(response.data.filter(u => u.id !== currentUser.id));
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsRefreshingUsers(false);
        }
    }

    async function handleJoinGroupById(invCode) {
        try {
            const result = await joinGroup(invCode);
            showToast('Successfully joined group!', 'success'); // Use toast instead of alert for consistency

            // Switch to groups tab
            setActiveTab('groups');

            // Select the conversation
            if (result.conversationId) {
                // We use a small timeout to allow useChat to refresh conversations
                setTimeout(() => {
                    const joinedConv = result.group ? {
                        id: result.conversationId,
                        type: 'group',
                        groupId: result.group.id,
                        groupName: result.group.name,
                        participants: result.group.members
                    } : null;

                    if (joinedConv) {
                        setActiveConversation(joinedConv);
                    }
                }, 100);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to join group';
            showToast(errorMsg, 'error');
        }
    }

    function handleInputChange(e) {
        setMessageInput(e.target.value);
        if (activeConversation) {
            sendTyping(activeConversation.id, e.target.value.length > 0);
        }
    }

    async function handleSendMessage() {
        if (!messageInput.trim() || !activeConversation) return;
        try {
            await sendMessage(activeConversation.id, messageInput, 'text', null, replyTo || undefined);
            setMessageInput('');
            setReplyTo(null);
            sendTyping(activeConversation.id, false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async function handleSelectUser(userId) {
        try {
            const conversation = await createDirectConversation(userId);
            setActiveConversation(conversation);
            setShowUserSelector(false);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    }

    async function handleSendVoice(blob, durationInSeconds) {
        if (!activeConversation) return;

        const formatDuration = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        try {
            const formData = new FormData();
            formData.append('file', blob, 'voice-note.webm');

            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await sendMessage(
                activeConversation.id,
                uploadRes.data.filePath,
                'voice',
                null,
                replyTo || undefined,
                { duration: formatDuration(durationInSeconds || 0) }
            );
            setReplyTo(null);
        } catch (err) {
            console.error('Error sending voice note:', err);
            showToast('Failed to send voice note', 'error');
        }
    }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file || !activeConversation) return;

        setUploadingAttachment(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            let type = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('audio/')) type = 'voice';

            await sendMessage(
                activeConversation.id,
                uploadRes.data.filePath,
                type,
                null,
                replyTo || undefined,
                {
                    fileName: file.name,
                    fileSize: (file.size / 1024).toFixed(1) + ' KB',
                    mimeType: file.type
                }
            );
            setReplyTo(null);
        } catch (err) {
            console.error('Error uploading file:', err);
            showToast('Failed to upload file', 'error');
        } finally {
            setUploadingAttachment(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    async function handleCreateGroup() {
        if (!groupName.trim()) return;
        try {
            const result = await createGroup(groupName, groupDescription);
            setActiveConversation(result.conversation);
            setGroupName('');
            setGroupDescription('');
            setShowGroupModal(false);
            alert(`Group "${groupName}" created successfully!\n\nInvite Code: ${result.group.inviteCode}\n\nShare this code with your friends so they can join!`);
        } catch (error) {
            console.error('Error creating group:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to create group';
            showToast(errorMsg, 'error');
        }
    }

    async function handleJoinGroup() {
        if (!inviteCode.trim()) return;
        try {
            const result = await joinGroup(inviteCode);
            setInviteCode('');
            setShowJoinGroup(false);

            // 1. Success feedback
            if (result.alreadyMember) {
                showToast('You are already a member of this group!', 'info');
            } else {
                showToast('Successfully joined group!', 'success');
            }

            // 2. Switch to groups tab
            setActiveTab('groups');

            // 3. Select the conversation
            if (result.conversationId) {
                // We use a small timeout to allow useChat to refresh conversations
                setTimeout(() => {
                    const joinedConv = result.group ? {
                        id: result.conversationId,
                        type: 'group',
                        groupId: result.group.id,
                        groupName: result.group.name,
                        participants: result.group.members
                    } : null;

                    if (joinedConv) {
                        setActiveConversation(joinedConv);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error joining group:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to join group';
            showToast(errorMsg, 'error');
        }
    }

    function handleCopyInviteCode(code) {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleOpenResource(resource) {
        setViewerLoading(true);
        setShowResourceViewer(true);
        setSelectedResourceData(null);
        try {
            let endpoint = '';
            switch (resource.type) {
                case 'note': endpoint = `/notes/shared/${resource.resourceId}`; break;
                case 'flashcard': endpoint = `/flashcardDecks/shared/${resource.resourceId}`; break; // Assuming flashcards also need shared endpoint, verifying next
                case 'tutorial': endpoint = `/tutorials/shared/${resource.resourceId}`; break;
                default: throw new Error('Unknown resource type');
            }
            const response = await api.get(endpoint);
            setSelectedResourceData({ ...response.data, type: resource.type });
        } catch (error) {
            console.error('Error fetching resource details:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to load resource details. It might have been deleted.';
            showToast(errorMsg, 'error');
            setShowResourceViewer(false);
        } finally {
            setViewerLoading(false);
        }
    }

    async function handleRequestResponse(status) {
        if (!activeConversation) return;
        try {
            await respondToRequest(activeConversation.id, status);
            if (status === 'rejected') {
                setActiveConversation(null);
            } else if (status === 'active') {
                setActiveConversation(prev => ({ ...prev, status: 'active' }));
            }
        } catch (error) {
            console.error('Error responding:', error);
        }
    }

    async function handleDeleteConversation() {
        if (!activeConversation) return;
        setIsDeleting(true);
        try {
            await deleteConversation(activeConversation.id);
            showToast('Conversation deleted', 'success');
            setShowDeleteConfirm(false);
        } catch (err) {
            showToast('Failed to delete conversation', 'error');
        } finally {
            setIsDeleting(false);
        }
    }

    // --- Derived ---
    // --- Avatar Helper ---
    const renderAvatar = (name, isOnline = false, isGroup = false) => {
        let initials = '?';
        if (name) {
            if (name.includes('@')) {
                initials = name.split('@')[0].substring(0, 2).toUpperCase();
            } else {
                initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }
        }
        return (
            <div className="relative flex-shrink-0 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-105
                    ${isGroup ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'}`}>
                    {isGroup ? <Users size={24} /> : initials}
                </div>
                {!isGroup && isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                )}
            </div>
        );
    };


    return (
        <div className="chat-app-container">
            {/* 1. Sidebar */}
            <aside className={`chat-sidebar ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                {/* Sidebar Header */}
                <div className="p-6 border-b border-chat-border">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-primary-500/30 relative overflow-hidden group hover:scale-105 transition-transform duration-300">
                                <GraduationCap size={24} className="relative z-10" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
                            </div>
                            <span className="font-bold text-lg tracking-tight dark:text-white">StudySync</span>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-chat-bg rounded-lg transition-colors text-chat-text-muted"
                        >
                            <LayoutDashboard size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-chat-bg dark:bg-slate-800 border border-chat-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-chat-primary/20 outline-none transition-all dark:text-white"
                        />
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-chat-text-muted" />
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-chat-bg dark:bg-slate-800 rounded-xl gap-1">
                        {['chats', 'groups', 'explore', 'requests'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all tab-btn ${activeTab === tab
                                    ? 'bg-chat-surface dark:bg-slate-700 shadow-sm text-chat-primary active'
                                    : 'text-chat-text-muted hover:text-chat-text-primary'}`}
                            >
                                {tab === 'requests' ? 'Inbox' : tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {activeTab === 'explore' ? (
                        <div className="p-2 space-y-3">
                            {availableGroups.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Users size={32} className="mx-auto mb-2 dark:text-slate-400" />
                                    <p className="text-xs dark:text-slate-500">No public groups</p>
                                </div>
                            ) : (
                                availableGroups.map(group => (
                                    <div key={group.id} className="p-4 bg-chat-bg dark:bg-slate-800 rounded-2xl border border-chat-border hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm dark:text-white">{group.name}</span>
                                            <span className="text-[10px] bg-chat-primary/10 text-chat-primary px-2 py-0.5 rounded-full font-bold uppercase">
                                                {group.members?.length || 0} Members
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-chat-text-muted mb-3 line-clamp-2 leading-relaxed">{group.description}</p>
                                        <button
                                            onClick={() => handleJoinGroupById(group.inviteCode)}
                                            className="w-full py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 shadow-md shadow-purple-500/10 transition-colors"
                                        >
                                            Join Group
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : displayList.length === 0 ? (
                        <div className="text-center py-16 opacity-20">
                            <MessageCircle size={40} className="mx-auto mb-2 dark:text-slate-400" />
                            <p className="text-sm font-medium dark:text-slate-500">Clear for now</p>
                        </div>
                    ) : (
                        displayList.map((conv) => {
                            const display = getConversationDisplay(conv);
                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 mb-1 group relative ${activeConversation?.id === conv.id
                                        ? 'bg-chat-primary/5 border-chat-primary/20 border'
                                        : 'hover:bg-chat-bg dark:hover:bg-slate-800 border-transparent border'}`}
                                >
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-sm ${conv.type === 'group' ? 'bg-emerald-500 text-white' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                            {conv.type === 'group' ? <Users size={20} /> : getInitials(display.title)}
                                        </div>
                                        {display.otherUser?.id && onlineUsers.has(display.otherUser.id) && (
                                            <span className="absolute -bottom-1 -right-1 block h-3.5 w-3.5 rounded-full bg-chat-success border-2 border-chat-surface dark:border-slate-800 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-sm font-bold truncate ${activeConversation?.id === conv.id ? 'text-red-600 font-black' : 'text-red-500'}`}>
                                                {display.title}
                                            </span>
                                            {conv.lastMessageTime && (
                                                <span className="text-[10px] text-chat-text-muted whitespace-nowrap">
                                                    {formatLastMessageTime(conv.lastMessageTime)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className={`text-[12px] truncate text-chat-text-muted ${unreadCounts[conv.id] > 0 ? 'font-bold text-chat-text-primary dark:text-white' : ''}`}>
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                            {unreadCounts[conv.id] > 0 && (
                                                <span className="bg-chat-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg min-w-[18px] text-center shadow-md shadow-blue-500/20">
                                                    {unreadCounts[conv.id]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {activeConversation?.id === conv.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-chat-primary rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.4)]" />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-chat-border bg-chat-bg/30 dark:bg-slate-900/30">
                    <button
                        onClick={() => setShowUserSelector(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 shadow-lg shadow-purple-500/10 transition-all active:scale-[0.98]"
                    >
                        <Plus size={18} />
                        New Message
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 bg-chat-surface dark:bg-slate-800 text-chat-primary border border-chat-primary/20 rounded-xl font-bold text-[13px] hover:bg-chat-bg transition-all"
                        >
                            <Plus size={16} />
                            Create Group
                        </button>
                    )}
                </div>
            </aside>

            {/* 2. Main Panel */}
            <main className="chat-main-panel">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <header className="px-6 py-4 bg-chat-surface dark:bg-slate-900 border-b border-chat-border flex items-center justify-between sticky top-0 z-10 shadow-sm shadow-black/5">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveConversation(null)} className="md:hidden p-2 -ml-2 text-chat-text-muted hover:text-chat-text-primary">
                                    <ArrowDown size={20} className="rotate-90" />
                                </button>
                                <div className="relative cursor-pointer" onClick={() => activeConversation.type === 'group' && setShowGroupInfo(true)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${activeConversation.type === 'group' ? 'bg-blue-100 dark:bg-blue-900/30 text-chat-primary' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                                        {activeConversation.type === 'group' ? <Users size={20} /> : getInitials(getConversationDisplay(activeConversation).title)}
                                    </div>
                                    {activeConversation.type !== 'group' && onlineUsers.has(getConversationDisplay(activeConversation).otherUser?.id) && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-chat-success border-2 border-white dark:border-slate-900 rounded-full" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-red-600 dark:text-red-400 text-base truncate leading-none mb-1">
                                        {getConversationDisplay(activeConversation).title}
                                    </h2>
                                    <div className="flex items-center gap-1.5 h-4">
                                        {activeConversation.type === 'group' ? (
                                            <span className="text-[11px] text-chat-text-muted font-medium">{activeConversation.participants?.length} members</span>
                                        ) : onlineUsers.has(getConversationDisplay(activeConversation).otherUser?.id) ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-chat-success animate-pulse" />
                                                <span className="text-[11px] text-chat-success font-bold uppercase tracking-wider">Online</span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] text-chat-text-muted font-medium italic">
                                                {formatLastSeen(getConversationDisplay(activeConversation).otherUser?.last_seen_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {sessionStartTime && (
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-chat-bg dark:bg-slate-800 rounded-full border border-chat-border mr-2">
                                        <Clock size={12} className="text-chat-primary" />
                                        <span className="text-[11px] font-mono font-bold text-chat-primary">{sessionDuration}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setShowSearchInChat(!showSearchInChat);
                                        if (!showSearchInChat) {
                                            setTimeout(() => searchInputRef.current?.focus(), 100);
                                        }
                                    }}
                                    className={`p-2 rounded-lg transition-colors btn-hover-lift ${showSearchInChat ? 'bg-chat-primary/20 text-chat-primary shadow-sm' : 'text-chat-text-muted hover:text-chat-primary hover:bg-chat-bg'}`}
                                >
                                    <Search size={20} />
                                </button>
                                <button className="p-2 text-chat-text-muted btn-call btn-hover-lift rounded-lg transition-colors"><Phone size={20} /></button>
                                <button className="p-2 text-chat-text-muted btn-video btn-hover-lift rounded-lg transition-colors"><Video size={20} /></button>
                                <div className="relative group/menu">
                                    <button className="p-2 text-chat-text-muted hover:text-chat-text-primary btn-hover-lift rounded-lg transition-colors"><MoreVertical size={20} /></button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-2 hidden group-hover/menu:block z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 font-medium"
                                        >
                                            <X size={16} />
                                            Delete Conversation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* In-Chat Search Bar */}
                        <AnimatePresence>
                            {showSearchInChat && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 py-2 bg-chat-bg dark:bg-slate-800 border-b border-chat-border overflow-hidden"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                placeholder="Search messages..."
                                                value={searchInChatQuery}
                                                onChange={(e) => {
                                                    setSearchInChatQuery(e.target.value);
                                                    setCurrentSearchIndex(-1);
                                                }}
                                                className="w-full h-8 bg-chat-surface dark:bg-slate-900 border border-chat-border rounded-lg pl-8 pr-4 text-sm focus:ring-1 focus:ring-chat-primary outline-none dark:text-white"
                                            />
                                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-chat-text-muted" />
                                        </div>
                                        {searchResults.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-medium text-chat-text-muted">
                                                    {currentSearchIndex + 1} of {searchResults.length}
                                                </span>
                                                <div className="flex items-center border border-chat-border rounded-lg overflow-hidden bg-chat-surface dark:bg-slate-900">
                                                    <button
                                                        onClick={() => handleSearchNavigate('prev')}
                                                        className="p-1 hover:bg-chat-bg text-chat-text-muted transition-colors"
                                                    >
                                                        <ArrowDown className="rotate-180" size={14} />
                                                    </button>
                                                    <div className="w-[1px] h-4 bg-chat-border" />
                                                    <button
                                                        onClick={() => handleSearchNavigate('next')}
                                                        className="p-1 hover:bg-chat-bg text-chat-text-muted transition-colors"
                                                    >
                                                        <ArrowDown size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => {
                                                setShowSearchInChat(false);
                                                setSearchInChatQuery('');
                                                setCurrentSearchIndex(-1);
                                            }}
                                            className="text-[11px] font-bold text-chat-text-muted hover:text-chat-text-primary"
                                        >
                                            CANCEL
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Messages Area */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar relative"
                            ref={scrollContainerRef}
                            onScroll={handleScroll}
                        >
                            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `radial-gradient(var(--chat-primary) 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-4">
                                    <div className="w-16 h-16 bg-chat-bg rounded-3xl flex items-center justify-center">
                                        <MessageCircle size={32} className="dark:text-slate-400" />
                                    </div>
                                    <p className="text-sm font-medium dark:text-slate-500">No messages yet</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <MessageBubble
                                        key={msg.id || idx}
                                        message={msg}
                                        isOwn={msg.senderId === currentUser.id}
                                        handleOpenResource={handleOpenResource}
                                        formatTime={formatMessageTime}
                                        onReply={handleReply}
                                        onScrollToMessage={scrollToMessage}
                                        messageRef={(el) => { if (msg.id) messageRefs.current[msg.id] = el; }}
                                        highlightQuery={searchInChatQuery}
                                        onReact={toggleReaction}
                                    />
                                ))
                            )}

                            {getTypingText() && (
                                <div className="flex items-center gap-2 ml-4 mb-4 text-xs text-chat-text-muted italic animate-pulse">
                                    <div className="flex gap-0.5">
                                        <div className="w-1 h-1 bg-chat-text-muted rounded-full"></div>
                                        <div className="w-1 h-1 bg-chat-text-muted rounded-full animate-bounce"></div>
                                        <div className="w-1 h-1 bg-chat-text-muted rounded-full"></div>
                                    </div>
                                    {getTypingText()}
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />

                            {/* Scroll to Bottom Button */}
                            <AnimatePresence>
                                {!isAtBottom && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                        className="fixed bottom-24 right-8 p-3 bg-chat-surface dark:bg-slate-800 border border-chat-border rounded-full shadow-lg text-chat-primary hover:bg-chat-bg transition-colors z-20"
                                    >
                                        <ArrowDown size={20} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Input Area */}
                        <div className="chat-input-container">
                            {activeConversation.status === 'pending' ? (
                                <div className="p-6 bg-chat-bg dark:bg-slate-800 rounded-2xl border border-chat-border text-center">
                                    {activeConversation.initiatorId !== currentUser.id ? (
                                        <>
                                            <p className="text-sm font-medium mb-4">
                                                {activeConversation.type === 'direct' ? (activeConversation.otherUser?.name || 'This user') : 'This group'} wants to connect with you.
                                            </p>
                                            <div className="flex gap-3 justify-center">
                                                <button onClick={() => handleRequestResponse('active')} className="px-6 py-2 bg-chat-success text-white rounded-xl font-bold hover:opacity-90 transition-all">Accept</button>
                                                <button onClick={() => handleRequestResponse('rejected')} className="px-6 py-2 bg-chat-surface dark:bg-slate-900 border border-chat-border text-chat-text-muted rounded-xl font-bold hover:bg-chat-bg transition-all">Decline</button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 opacity-60">
                                            <Clock size={24} className="animate-pulse text-chat-primary" />
                                            <p className="text-sm font-medium">Waiting for them to accept your request...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <AnimatePresence>
                                        {replyTo && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mb-3 p-3 bg-chat-bg dark:bg-slate-800 rounded-xl border-l-4 border-chat-primary flex items-center justify-between overflow-hidden"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-chat-primary uppercase tracking-wider mb-0.5">Replying to {replyTo.senderName}</p>
                                                    <p className="text-xs text-chat-text-muted truncate">{replyTo.content}</p>
                                                </div>
                                                <button onClick={() => setReplyTo(null)} className="p-1.5 hover:bg-chat-border rounded-full text-chat-text-muted">
                                                    <X size={14} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="chat-input-pill">
                                        <button className="p-2 text-chat-text-muted btn-attach btn-hover-lift transition-colors" title="Attach file" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip size={20} />
                                        </button>
                                        <button onClick={() => setShowResourceShare(true)} className="p-2 text-chat-text-muted btn-resource btn-hover-lift transition-colors" title="Share resource">
                                            <Hash size={20} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={messageInput}
                                                onChange={handleInputChange}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage();
                                                    }
                                                }}
                                                placeholder="Type a message..."
                                                rows={1}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 py-2 dark:text-white"
                                                style={{ height: 'auto', minHeight: '32px' }}
                                            />
                                            <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2">
                                                <button className="p-2 text-chat-text-muted hover:text-chat-primary">
                                                    <Smile size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {isRecordingVoice ? (
                                                <AudioRecorder onSend={handleSendVoice} onCancel={() => setIsRecordingVoice(false)} />
                                            ) : messageInput.trim() ? (
                                                <motion.button
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={handleSendMessage}
                                                    className="w-10 h-10 bg-chat-primary text-white rounded-full flex items-center justify-center shadow-lg active:bg-chat-primary-hover transition-all hover:scale-105"
                                                >
                                                    <Send size={18} />
                                                </motion.button>
                                            ) : (
                                                <button onClick={() => setIsRecordingVoice(true)} className="w-10 h-10 text-chat-text-muted hover:bg-chat-bg rounded-full btn-hover-lift transition-all flex items-center justify-center">
                                                    <Mic size={20} className={isRecordingVoice ? 'btn-mic-active' : ''} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-chat-bg dark:bg-slate-900/50">
                        <div className="w-24 h-24 bg-chat-surface dark:bg-slate-800 rounded-[32px] flex items-center justify-center shadow-xl shadow-black/5 mb-8 rotate-3 transition-transform hover:rotate-0">
                            <MessageCircle size={48} className="text-chat-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-chat-text-primary dark:text-white mb-3">StudySync Messaging</h3>
                        <p className="text-chat-text-muted max-w-sm mb-8 leading-relaxed">
                            Collaborate with your study groups or message peers directly in real-time. Select a conversation to start.
                        </p>
                        <button
                            onClick={() => setShowUserSelector(true)}
                            className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                        >
                            Start New Conversation
                        </button>
                    </div>
                )}
            </main>

            {/* Modals Container */}
            <div id="modals-container">
                <Modal isOpen={showUserSelector} onClose={() => setShowUserSelector(false)} title="Start a Conversation">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    icon={Search}
                                />
                            </div>
                            <button
                                onClick={fetchUsers}
                                disabled={isRefreshingUsers}
                                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                {isRefreshingUsers ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                                Refresh
                            </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => handleSelectUser(user.id)}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center font-bold">
                                            {getInitials(user.email)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold dark:text-slate-100">{user.name || user.email?.split('@')[0]}</p>
                                            <p className="text-[11px] text-slate-500 italic">{user.email}</p>
                                        </div>
                                    </div>
                                    <Plus size={18} className="text-slate-300 group-hover:text-blue-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>

                {isAdmin && (
                    <Modal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} title="Create Group">
                        <div className="space-y-4">
                            <Input
                                placeholder="Group name"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                            />
                            <Button onClick={handleCreateGroup} variant="primary" className="w-full">
                                Create Group
                            </Button>
                        </div>
                    </Modal>
                )}

                <GroupInfoDrawer
                    isOpen={showGroupInfo}
                    onClose={() => setShowGroupInfo(false)}
                    group={activeConversation}
                    members={activeConversation ? users.filter(u => activeConversation.participants?.includes(u.id)) : []}
                    onlineUsers={onlineUsers}
                    currentUser={currentUser}
                    onLeaveGroup={async (id) => {
                        await leaveGroup(id);
                        setShowGroupInfo(false);
                    }}
                />

                <Modal isOpen={showJoinGroup} onClose={() => setShowJoinGroup(false)} title="Join Group">
                    <div className="space-y-4">
                        <Input
                            placeholder="Enter invite code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        />
                        <Button onClick={handleJoinGroup} variant="primary" className="w-full">
                            Join Group
                        </Button>
                    </div>
                </Modal>

                <ResourceShareModal
                    isOpen={showResourceShare}
                    onClose={() => setShowResourceShare(false)}
                    onShare={async (resource) => {
                        if (activeConversation) {
                            await shareResource(activeConversation.id, resource);
                        }
                    }}
                />

                <ResourceViewerModal
                    isOpen={showResourceViewer}
                    onClose={() => setShowResourceViewer(false)}
                    resource={selectedResourceData}
                    loading={viewerLoading}
                    onNavigate={(path) => navigate(path)}
                />

                <Modal
                    isOpen={showDeleteConfirm}
                    onClose={() => !isDeleting && setShowDeleteConfirm(false)}
                    title="Delete Conversation"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-chat-text-muted leading-relaxed">
                            Are you sure you want to delete this conversation? This action will permanently remove all messages for you and cannot be undone.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={handleDeleteConversation}
                                loading={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};



export default Chat;
