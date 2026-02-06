import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, Share2, Users, Plus, Search, X, Copy, Check, FileText, Brain, Youtube, ExternalLink, LayoutDashboard, CheckCheck, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import useChat from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ResourceShareModal from '../components/chat/ResourceShareModal';
import api from '../services/api';

// Message Bubble Component
const MessageBubble = ({ message, isOwn, handleOpenResource, formatTime }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className="flex items-center gap-2 px-1">
                    {!isOwn && (
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                            {message.senderEmail.split('@')[0]}
                        </span>
                    )}
                </div>
                <div
                    className={`px-4 py-2.5 rounded-2xl shadow-sm ${isOwn
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none border border-blue-400/20'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-slate-200/50 dark:shadow-none'
                        }`}
                >
                    {message.sharedResource ? (
                        <ResourceCard
                            resource={message.sharedResource}
                            onClick={() => handleOpenResource(message.sharedResource)}
                        />
                    ) : (
                        <p className="text-[13px] leading-relaxed break-words">{message.content}</p>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 px-1">
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                        {formatTime(message.timestamp)}
                    </span>
                    {isOwn && (
                        <span className="text-slate-400">
                            {message.read ? (
                                <CheckCheck size={12} className="text-blue-500" />
                            ) : (
                                <Check size={12} />
                            )}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Resource Card Component (for shared items)
const ResourceCard = ({ resource, onClick }) => {
    const getTypeStyles = (type) => {
        switch (type) {
            case 'note': return { icon: <FileText size={14} />, color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' };
            case 'flashcard': return { icon: <Brain size={14} />, color: 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10' };
            case 'tutorial': return { icon: <Youtube size={14} />, color: 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10' };
            default: return { icon: <Share2 size={14} />, color: 'border-slate-500 text-slate-600' };
        }
    };

    const styles = getTypeStyles(resource.type);

    return (
        <motion.div
            whileHover={{ y: -2 }}
            className={`bg-white dark:bg-slate-900/90 p-3 rounded-xl border-l-4 ${styles.color} shadow-sm min-w-[200px] cursor-pointer group`}
            onClick={onClick}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    {styles.icon}
                    <span className="text-[9px] font-bold uppercase tracking-wider">{resource.type}</span>
                </div>
                <ExternalLink size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="font-bold text-slate-800 dark:text-slate-100 text-xs mb-1 line-clamp-1">
                {resource.title}
            </div>
            {resource.preview && (
                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {resource.preview}
                </div>
            )}
        </motion.div>
    );
};

// Resource Viewer Modal
const ResourceViewerModal = ({ isOpen, onClose, resource, loading, onNavigate }) => {
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

const Chat = () => {
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
        onlineUsers,
        typingUsers,
        sendTyping,

        respondToRequest,
        activeConversation: chatActiveConversation,
        availableGroups,
        fetchAvailableGroups
    } = useChat();

    // Group Discovery Effect
    useEffect(() => {
        if (activeTab === 'groups') {
            fetchAvailableGroups();
        }
    }, [activeTab, fetchAvailableGroups]);

    // Handle Join Group
    const handleJoinGroupById = async (inviteCode) => {
        try {
            await joinGroup(inviteCode);
            alert('Successfully joined group!');
            setActiveTab('chats');
        } catch (error) {
            alert('Failed to join group: ' + error.message);
        }
    };

    const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'requests'
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
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.email === (import.meta.env.VITE_ADMIN_EMAIL || 'joshuamujakari15@gmail.com');

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // Update typing status when input changes
    const handleInputChange = (e) => {
        setMessageInput(e.target.value);
        if (activeConversation) {
            sendTyping(activeConversation.id, e.target.value.length > 0);
        }
    };

    // Fetch users for selector
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users/all');
            setUsers(response.data.filter(u => u.id !== currentUser.id));
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (showUserSelector) {
            fetchUsers();
        }
    }, [showUserSelector]);

    // Handle sending message
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeConversation) return;

        try {
            await sendMessage(activeConversation.id, messageInput);
            setMessageInput('');
            sendTyping(activeConversation.id, false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Handle starting a conversation with a user
    const handleSelectUser = async (userId) => {
        try {
            const conversation = await createDirectConversation(userId);
            setActiveConversation(conversation);
            setShowUserSelector(false);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    // Handle creating group
    const handleCreateGroup = async () => {
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
            alert(error.response?.data?.error || 'Failed to create group');
        }
    };

    // Handle joining group
    const handleJoinGroup = async () => {
        if (!inviteCode.trim()) return;

        try {
            await joinGroup(inviteCode);
            setInviteCode('');
            setShowJoinGroup(false);
            alert('Successfully joined group!');
        } catch (error) {
            console.error('Error joining group:', error);
            alert(error.response?.data?.error || 'Failed to join group');
        }
    };

    // Handle copying invite code
    const handleCopyInviteCode = (code) => {
        if (!code) return;
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const navigate = useNavigate();

    // Handle opening a shared resource
    const handleOpenResource = async (resource) => {
        setViewerLoading(true);
        setShowResourceViewer(true);
        setSelectedResourceData(null); // Reset while loading

        try {
            let endpoint = '';
            switch (resource.type) {
                case 'note': endpoint = `/notes/${resource.resourceId}`; break;
                case 'flashcard': endpoint = `/flashcardDecks/${resource.resourceId}`; break;
                case 'tutorial': endpoint = `/tutorials/${resource.resourceId}`; break;
                default: throw new Error('Unknown resource type');
            }

            const response = await api.get(endpoint);
            setSelectedResourceData({ ...response.data, type: resource.type });
        } catch (error) {
            console.error('Error fetching resource details:', error);
            alert('Failed to load resource details. It might have been deleted.');
            setShowResourceViewer(false);
        } finally {
            setViewerLoading(false);
        }
    };

    // Format timestamp
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return format(date, 'h:mm a');
    };

    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isToday(date)) return format(date, 'h:mm a');
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d');
    };

    // Get conversation title & status
    const getConversationDisplay = (conv) => {
        if (conv.type === 'group') {
            return {
                title: conv.groupName || 'Group Chat',
                status: `${conv.participants?.length || 0} members`,
                isOnline: false
            };
        }
        const otherUser = conv.otherUser;
        const isOnline = otherUser && onlineUsers.has(otherUser.id);
        return {
            title: otherUser?.email || 'Unknown User',
            status: isOnline ? 'Online' : 'Offline',
            isOnline
        };
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get typing users text
    const getTypingText = () => {
        if (!activeConversation || typingUsers.size === 0) return null;

        // Filter typing users relevant to this conversation
        const typingInChat = Array.from(typingUsers).filter(uid =>
            activeConversation.participants?.includes(uid) && uid !== currentUser.id
        );

        if (typingInChat.length === 0) return null;
        if (typingInChat.length === 1) return 'Typing...';
        return 'Multiple people typing...';
    };

    // Filter conversations
    const activeChats = conversations.filter(c =>
        !c.status || c.status === 'active' || (c.status === 'pending' && c.initiatorId === currentUser.id)
    );

    const pendingRequests = conversations.filter(c =>
        c.status === 'pending' && c.initiatorId !== currentUser.id && c.type === 'direct'
    );

    const displayList = activeTab === 'chats' ? activeChats : pendingRequests;

    // Handle Request Response
    const handleRequestResponse = async (status) => {
        if (!activeConversation) return;
        try {
            await respondToRequest(activeConversation.id, status);
            if (status === 'rejected') {
                setActiveConversation(null);
            }
        } catch (error) {
            console.error('Error responding:', error);
        }
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

                    <div className="flex gap-2 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'chats'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <MessageCircle size={16} />
                            Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all relative ${activeTab === 'requests'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <Users size={16} />
                            Requests
                            {pendingRequests.length > 0 && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'groups'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                }`}
                        >
                            <Users size={16} />
                            Groups
                        </button>
                    </div>

                    {activeTab === 'chats' && (
                        <div className="flex gap-2 mb-4">
                            <Button
                                onClick={() => setShowUserSelector(true)}
                                variant="primary"
                                className="flex-1 text-sm h-10"
                            >
                                <Plus size={16} />
                                New Chat
                            </Button>
                            <Button
                                onClick={() => setShowJoinGroup(true)}
                                variant="secondary"
                                className="flex-1 text-sm h-10"
                            >
                                <Users size={16} />
                                Join Group
                            </Button>
                        </div>
                    )}

                    {isAdmin && (
                        <Button
                            onClick={() => setShowGroupModal(true)}
                            variant="success"
                            className="w-full mb-4 text-sm"
                        >
                            <Plus size={16} />
                            Create Group
                        </Button>
                    )}

                    <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto custom-scrollbar">
                        {activeTab === 'groups' ? (
                            availableGroups.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <Users size={32} className="mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm text-slate-500">No public groups found.</p>
                                </div>
                            ) : (
                                availableGroups.map((group) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={group.id}
                                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-slate-800 dark:text-slate-100">{group.name}</div>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500">
                                                {group.members?.length || 0} members
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                            {group.description || 'No description provided.'}
                                        </p>
                                        <Button
                                            onClick={() => handleJoinGroupById(group.inviteCode)}
                                            className="w-full text-xs h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border-none"
                                        >
                                            Join Group
                                        </Button>
                                    </motion.div>
                                ))
                            )
                        ) : displayList.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <MessageCircle size={32} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-sm text-slate-500">
                                    {activeTab === 'chats' ? 'No active chats.' : 'No pending requests.'}
                                </p>
                            </div>
                        ) : (
                            displayList.map((conv) => {
                                const { title, isOnline } = getConversationDisplay(conv);
                                return (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={conv.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setActiveConversation(conv)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all ${activeConversation?.id === conv.id
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        {conv.type === 'group' ? (
                                                            <Users size={14} className="text-blue-500 flex-shrink-0" />
                                                        ) : (
                                                            <MessageCircle size={14} className="text-slate-400 flex-shrink-0" />
                                                        )}
                                                        {isOnline && (
                                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-800"></span>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                        {title}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                                    {conv.lastMessage || 'No messages yet'}
                                                </p>
                                            </div>
                                            {conv.lastMessageTime && (
                                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                    {formatLastMessageTime(conv.lastMessageTime)}
                                                </span>
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
            <div className="flex-1 flex flex-col">
                <Card className="flex-1 flex flex-col">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                    {getConversationDisplay(activeConversation).title}
                                                </h2>
                                                {getConversationDisplay(activeConversation).isOnline && (
                                                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></span>
                                                )}
                                            </div>

                                            {activeConversation.type === 'direct' ? (
                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                    {getConversationDisplay(activeConversation).status}
                                                    {activeConversation.otherUser && (
                                                        <span>• Level {activeConversation.otherUser.level}</span>
                                                    )}
                                                </p>
                                            ) : (
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                        Code: {activeConversation.inviteCode || '...'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopyInviteCode(activeConversation.inviteCode)}
                                                        className="text-blue-500 hover:text-blue-600 transition-colors"
                                                        title="Copy Invite Code"
                                                    >
                                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => setShowResourceShare(true)}
                                            variant="secondary"
                                            className="text-xs h-9 px-3"
                                        >
                                            <Share2 size={14} />
                                            Share Resource
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                <div ref={messagesEndRef} />
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
                                    <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <p className="text-sm text-slate-500">
                                            Waiting for {getConversationDisplay(activeConversation).title} to accept your request.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        {/* Invite Code Display for Groups */}
                                        {activeConversation.type === 'group' && activeConversation.inviteCode && (
                                            <div className="flex-1 flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase">Invite Code:</span>
                                                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400 select-all">
                                                        {activeConversation.inviteCode}
                                                    </code>
                                                </div>
                                                <Button
                                                    title="Copy Invite Code"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(activeConversation.inviteCode);
                                                        alert('Invite code copied!');
                                                    }}
                                                    className="h-6 w-6 p-0 flex items-center justify-center bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                                >
                                                    <Copy size={12} />
                                                </Button>
                                            </div>
                                        )}
                                        {/* Added Attachment Button placeholder for future */}
                                        <Input
                                            value={messageInput}
                                            onChange={handleInputChange}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 backdrop-blur-sm bg-white/50 dark:bg-slate-900/50"
                                        />
                                        <Button onClick={handleSendMessage} variant="primary" className="shadow-lg shadow-blue-500/20">
                                            <Send size={18} />
                                        </Button>
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
                </Card>
            </div>

            {/* User Selector Modal */}
            <Modal isOpen={showUserSelector} onClose={() => setShowUserSelector(false)} title="Start a Conversation">
                <div className="space-y-4">
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        icon={Search}
                    />
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {users.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <p>No users found on the server.</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <p>No users match your search.</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => {
                                const isOnline = onlineUsers.has(user.id);
                                return (
                                    <motion.div
                                        key={user.id}
                                        whileHover={{ scale: 1.02 }}
                                        onClick={() => handleSelectUser(user.id)}
                                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                                {user.email}
                                                {isOnline && <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>}
                                            </div>
                                            <div className="text-xs text-slate-500">Level {user.level} • {user.xp} XP</div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
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
