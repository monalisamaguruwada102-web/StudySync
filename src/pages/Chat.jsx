import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Share2, Users, Plus, Search, X, Copy, Check, FileText, Brain, Youtube, ExternalLink, LayoutDashboard, CheckCheck, Play, ArrowDown, RefreshCw, Loader2, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import useChat from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ResourceShareModal from '../components/chat/ResourceShareModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

// Message Bubble Component
function MessageBubble({ message, isOwn, handleOpenResource, formatTime }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
        >
            <div className={`relative max-w-[80%] px-3 py-2 rounded-2xl shadow-sm ${isOwn
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-800 dark:text-slate-100 rounded-tr-none'
                : 'bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}>

                {/* Tail Decoration for WhatsApp Feel */}
                <div className={`absolute top-0 w-3 h-3 ${isOwn
                    ? 'right-[-6px] bg-[#d9fdd3] dark:bg-[#005c4b] [clip-path:polygon(0_0,0_100%,100%_0)]'
                    : 'left-[-6px] bg-white dark:bg-[#202c33] [clip-path:polygon(100%_0,100%_100%,0_0)]'}`}
                />

                {!isOwn && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-1">
                        {message.senderName || message.senderEmail?.split('@')[0]}
                    </span>
                )}

                {message.sharedResource ? (
                    <ChatMessageResourceCard
                        resource={message.sharedResource}
                        onClick={() => handleOpenResource(message.sharedResource)}
                    />
                ) : (
                    <p className="text-[14px] leading-relaxed break-words pr-12">{message.content}</p>
                )}

                <div className="absolute bottom-1 right-2 flex items-center gap-1 opacity-60">
                    <span className="text-[10px] font-medium leading-none">
                        {formatTime(message.timestamp)}
                    </span>
                    {isOwn && (
                        message.read ? (
                            <CheckCheck size={14} className="text-blue-400" />
                        ) : (
                            <Check size={14} />
                        )
                    )}
                </div>
            </div>
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
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    // --- Custom Hooks ---
    const {
        conversations,
        messages,
        activeConversation,
        setActiveConversation,
        sendMessage,
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
        onlineUsers
    } = useChat();

    // --- Derived State ---
    const directChats = conversations.filter(c =>
        c.type === 'direct' && (!c.status || c.status === 'active' || (c.status === 'pending' && c.initiatorId === currentUser.id))
    );
    const joinedGroups = conversations.filter(c => c.type === 'group');
    const pendingRequests = conversations.filter(c =>
        c.status === 'pending' && c.initiatorId !== currentUser.id && c.type === 'direct'
    );

    // Determine which list to show based on tab
    let displayList = [];
    if (activeTab === 'chats') displayList = directChats;
    else if (activeTab === 'groups') displayList = joinedGroups;
    else if (activeTab === 'requests') displayList = pendingRequests;

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    function getConversationDisplay(conv) {
        if (conv.type === 'group') {
            return {
                title: conv.groupName || 'Group Chat',
                status: `${conv.participants?.length || 0} members`,
                isOnline: false
            };
        }

        // Try to find the other participant
        const otherUserId = conv.participants?.find(id => id !== currentUser.id);
        const userInfo = users.find(u => u.id === otherUserId);

        // Prioritize name over email
        const title = userInfo?.name || conv.otherUser?.name || userInfo?.email || conv.otherUser?.email || 'Unknown User';
        const isOnline = otherUserId && onlineUsers.has(otherUserId);

        return {
            title,
            status: isOnline ? 'Online' : 'Offline',
            isOnline
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
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
            }, 200);
        }
    }, [activeConversation?.id]);

    useEffect(() => {
        if (showUserSelector) {
            fetchUsers();
        }
    }, [showUserSelector]);

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
            await joinGroup(invCode);
            alert('Successfully joined group!');
            setActiveTab('chats');
        } catch (error) {
            alert('Failed to join group: ' + error.message);
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
            await sendMessage(activeConversation.id, messageInput);
            setMessageInput('');
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
            alert(errorMsg);
        }
    }

    async function handleJoinGroup() {
        if (!inviteCode.trim()) return;
        try {
            const result = await joinGroup(inviteCode);
            setInviteCode('');
            setShowJoinGroup(false);

            // If the server returned a conversationId, select it
            if (result.conversationId) {
                const joinedConv = conversations.find(c => c.id === result.conversationId);
                if (joinedConv) {
                    setActiveConversation(joinedConv);
                } else {
                    // If not in current list (rare sync issue), the refreshConversations inside joinGroup will help.
                    // We might need a small delay or a retry if it's not immediate.
                    setTimeout(() => {
                        const refreshedConv = conversations.find(c => c.id === result.conversationId);
                        if (refreshedConv) setActiveConversation(refreshedConv);
                    }, 500);
                }
            }

            alert('Successfully joined group!');
        } catch (error) {
            console.error('Error joining group:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to join group';
            alert(errorMsg);
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
            alert(errorMsg);
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
            <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm
                    ${isGroup ? 'bg-emerald-500' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                    {isGroup ? <Users size={24} /> : initials}
                </div>
                {!isGroup && isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                )}
            </div>
        );
    };


    return (
        <div className="flex h-[calc(100vh-120px)] gap-4 p-6">
            {/* Conversations List */}
            <div className="w-80 flex flex-col gap-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <MessageCircle className="text-blue-500" size={24} />
                            Chats
                        </h2>
                        <a href="/" className="flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                            <LayoutDashboard size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Dash</span>
                        </a>
                    </div>

                    <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'chats'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'groups'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Groups
                        </button>
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'explore'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Explore
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === 'requests'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            {pendingRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
                            )}
                            Inbox
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <Button
                            onClick={() => setShowUserSelector(true)}
                            variant="secondary"
                            className="flex-1 text-[11px] h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                            <Plus size={14} />
                            New Chat
                        </Button>
                        <Button
                            onClick={() => setShowJoinGroup(true)}
                            variant="secondary"
                            className="flex-1 text-[11px] h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        >
                            <Users size={14} />
                            Join Group
                        </Button>
                    </div>

                    {isAdmin && (
                        <Button
                            onClick={() => setShowGroupModal(true)}
                            className="w-full mb-4 text-[11px] h-9 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-sm shadow-emerald-500/20"
                        >
                            <Plus size={14} />
                            Create New Group
                        </Button>
                    )}

                    <div className="space-y-1 max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar pr-1">
                        {activeTab === 'explore' ? (
                            availableGroups.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm text-slate-500">No public groups found.</p>
                                </div>
                            ) : (
                                availableGroups.map((group) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={group.id}
                                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group mb-2"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 dark:text-slate-100">{group.name}</div>
                                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
                                                {group.members?.length || 0} MEMBERS
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                            {group.description || 'No description provided.'}
                                        </p>
                                        <Button
                                            onClick={() => handleJoinGroupById(group.inviteCode)}
                                            className="w-full text-[11px] h-8 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none"
                                        >
                                            Join Group
                                        </Button>
                                    </motion.div>
                                ))
                            )
                        ) : displayList.length === 0 ? (
                            <div className="text-center py-16 opacity-30">
                                <MessageCircle size={40} className="mx-auto mb-3" />
                                <p className="text-sm font-medium">No results here.</p>
                            </div>
                        ) : (
                            displayList.map((conv) => {
                                const { title, isOnline } = getConversationDisplay(conv);
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={conv.id}
                                        onClick={() => setActiveConversation(conv)}
                                        className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 relative group
                                            ${activeConversation?.id === conv.id
                                                ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                                            }`}
                                    >
                                        {renderAvatar(title, isOnline, conv.type === 'group')}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h3 className="font-bold text-[14px] text-slate-800 dark:text-slate-100 truncate pr-2">
                                                    {title}
                                                </h3>
                                                {conv.lastMessageTime && (
                                                    <span className={`text-[10px] whitespace-nowrap ${unreadCounts[conv.id] > 0 ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                                                        {formatLastMessageTime(conv.lastMessageTime)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate flex-1">
                                                    {conv.lastMessage || 'No messages yet'}
                                                </p>
                                                {unreadCounts[conv.id] > 0 && (
                                                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ml-2 shadow-sm shadow-emerald-500/30">
                                                        {unreadCounts[conv.id]}
                                                    </span>
                                                )}
                                            </div>
                                            {conv.type === 'group' && conv.inviteCode && (
                                                <div className="text-[9px] font-bold text-blue-500/70 mt-1 uppercase tracking-wider">
                                                    CODE: {conv.inviteCode}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </Card>
            </div>

            {/* Message Window */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl overflow-hidden relative">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {renderAvatar(
                                        getConversationDisplay(activeConversation).title,
                                        getConversationDisplay(activeConversation).isOnline,
                                        activeConversation.type === 'group'
                                    )}
                                    <div className="flex flex-col">
                                        <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                            {getConversationDisplay(activeConversation).title}
                                        </h2>
                                        <p className="text-[11px] text-emerald-500 font-bold">
                                            {activeConversation.type === 'direct'
                                                ? (getConversationDisplay(activeConversation).isOnline ? 'online' : 'last seen recently')
                                                : `Group • ${activeConversation.participants?.length || 0} participants`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Messages Container */}
                        <div
                            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0 relative bg-slate-50/30 dark:bg-slate-900/10"
                            onScroll={handleScroll}
                            ref={scrollContainerRef}
                        >
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <MessageBubble
                                        key={msg.id || idx}
                                        message={msg}
                                        isOwn={msg.senderId === currentUser.id}
                                        handleOpenResource={handleOpenResource}
                                        formatTime={formatMessageTime}
                                    />
                                ))
                            )}
                            {getTypingText() && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-slate-400 italic ml-4 flex items-center gap-1"
                                >
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="ml-1">{getTypingText()}</span>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />

                            {/* New Message Toast (Polished) */}
                            <AnimatePresence>
                                {showNewMessageToast && (
                                    <motion.button
                                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => {
                                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                            setShowNewMessageToast(false);
                                        }}
                                        className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md text-white pl-4 pr-5 py-2.5 rounded-full shadow-xl shadow-blue-500/30 flex items-center gap-3 text-xs font-bold transition-all z-20 border border-white/10"
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                        <span>New messages received</span>
                                        <ArrowDown size={14} className="animate-bounce" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Request Banner / Input */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            {activeConversation.status === 'pending' && activeConversation.initiatorId !== currentUser.id ? (
                                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                        {getConversationDisplay(activeConversation).title} wants to chat with you.
                                    </p>
                                    <div className="flex gap-3 w-full">
                                        <Button
                                            onClick={() => handleRequestResponse('active')}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none"
                                        >
                                            <Check size={18} /> Accept
                                        </Button>
                                        <Button
                                            onClick={() => handleRequestResponse('rejected')}
                                            className="flex-1 bg-transprent border border-slate-300 hover:bg-slate-100 text-slate-600 dark:text-slate-400"
                                        >
                                            <X size={18} /> Decline
                                        </Button>
                                    </div>
                                </div>
                            ) : activeConversation?.status === 'pending' ? (
                                /* Premium Verification Prompt */
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-700/30 shadow-lg shadow-amber-500/10"
                                >
                                    {/* Animated Background */}
                                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400/20 rounded-full blur-2xl animate-pulse"></div>
                                        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-400/20 rounded-full blur-2xl animate-pulse delay-500"></div>
                                    </div>

                                    <div className="relative flex flex-col items-center text-center space-y-3">
                                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform rotate-3">
                                            <Clock size={28} className="text-white animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-1 flex items-center justify-center gap-2">
                                                <Sparkles size={16} className="text-amber-500" />
                                                Awaiting Response
                                                <Sparkles size={16} className="text-amber-500" />
                                            </h4>
                                            <p className="text-sm text-amber-700/80 dark:text-amber-300/80">
                                                Waiting for <span className="font-semibold">{getConversationDisplay(activeConversation).title}</span> to accept your chat request
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-amber-600/60 dark:text-amber-400/60">
                                            <div className="flex space-x-1">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100"></span>
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-200"></span>
                                            </div>
                                            <span>They'll be notified</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex items-end gap-2 bg-slate-50 dark:bg-[#111b21] p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                    <button
                                        onClick={() => setShowResourceShare(true)}
                                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <Plus size={20} />
                                    </button>
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
                                        className="flex-1 bg-white dark:bg-[#2a3942] border-none focus:ring-0 rounded-xl px-4 py-2 text-sm resize-none max-h-32 custom-scrollbar dark:text-slate-100"
                                        style={{ height: 'auto', minHeight: '40px' }}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        className={`p-2.5 rounded-full transition-all shadow-md ${messageInput.trim()
                                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white scale-100'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 scale-95'}`}
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                        {/* Premium Empty State */}
                        <div className="absolute inset-0 pointer-events-none opacity-30">
                            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                        </div>

                        <div className="text-center relative z-10 p-8 glass rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md">
                            <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-6">
                                <MessageCircle size={40} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                                StudySync Chat
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6">
                                Connect with peers, join study groups, and share your knowledge in real-time.
                            </p>
                            <Button onClick={() => setShowUserSelector(true)} variant="primary" className="w-full shadow-lg shadow-blue-500/25">
                                Start New Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Selector Modal */}
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
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={fetchUsers}
                            disabled={isRefreshingUsers}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-md
                                ${isRefreshingUsers
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/30'}`}
                        >
                            {isRefreshingUsers ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <RefreshCw size={16} />
                            )}
                            {isRefreshingUsers ? 'Loading...' : 'Refresh'}
                        </motion.button>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
                        {isRefreshingUsers ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Fetching users...</p>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users size={32} className="text-slate-400" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mb-4">No users found on the server.</p>
                                <button
                                    onClick={fetchUsers}
                                    className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCw size={14} /> Try refreshing
                                </button>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <Search size={32} className="mx-auto mb-2 opacity-50" />
                                <p>No users match your search.</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const isOnline = onlineUsers.has(user.id);
                                return (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ scale: 1.02, x: 4 }}
                                        onClick={() => handleSelectUser(user.id)}
                                        className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/80 rounded-xl cursor-pointer hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all flex items-center justify-between border border-transparent hover:border-blue-200 dark:hover:border-blue-800 group shadow-sm hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {user.email?.substring(0, 2).toUpperCase()}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {user.email?.split('@')[0]}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded font-medium">Lv.{user.level || 1}</span>
                                                    <span>{user.xp || 0} XP</span>
                                                    {isOnline && <span className="text-emerald-500 font-medium">• Online</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <MessageCircle size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-400 text-center">
                            {users.length} user{users.length !== 1 ? 's' : ''} available • Click to start chatting
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Create Group Modal */}
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

            {/* Join Group Modal */}
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

            {/* Resource Share Modal */}
            <ResourceShareModal
                isOpen={showResourceShare}
                onClose={() => setShowResourceShare(false)}
                onShare={async (resource) => {
                    if (activeConversation) {
                        await shareResource(activeConversation.id, resource);
                    }
                }}
            />

            {/* Resource Viewer Modal */}
            <ResourceViewerModal
                isOpen={showResourceViewer}
                onClose={() => setShowResourceViewer(false)}
                resource={selectedResourceData}
                loading={viewerLoading}
                onNavigate={(path) => navigate(path)}
            />
        </div>
    );
};



export default Chat;
