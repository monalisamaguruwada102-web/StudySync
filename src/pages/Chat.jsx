import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Share2, Users, Plus, Search, X, Copy, Check, FileText, Brain, Youtube, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useChat from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ResourceShareModal from '../components/chat/ResourceShareModal';
import api from '../services/api';

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
        joinGroup
    } = useChat();

    const [messageInput, setMessageInput] = useState('');
    const [showUserSelector, setShowUserSelector] = useState(false);
    const [showResourceShare, setShowResourceShare] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showJoinGroup, setShowJoinGroup] = useState(false);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = currentUser.email === 'joshuamujakari15@gmail.com';

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            console.log('Fetching users for selector...');
            fetchUsers();
        }
    }, [showUserSelector]);

    // Handle sending message
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !activeConversation) return;

        try {
            await sendMessage(activeConversation.id, messageInput);
            setMessageInput('');
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

    // Format timestamp
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Get conversation title
    const getConversationTitle = (conv) => {
        if (conv.type === 'group') {
            return conv.groupName || 'Group Chat';
        }
        return conv.otherUser?.email || 'Unknown User';
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        console.log('Chat Mount - User:', currentUser);
    }, []);

    useEffect(() => {
        console.log('Users state updated:', users);
        console.log('Filtered users count:', filteredUsers.length);
    }, [users, filteredUsers.length]);

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
                    </div>

                    <div className="flex gap-2 mb-4">
                        <Button
                            onClick={() => setShowUserSelector(true)}
                            variant="primary"
                            className="flex-1 text-sm"
                        >
                            <Plus size={16} />
                            New Chat
                        </Button>
                        <Button
                            onClick={() => setShowJoinGroup(true)}
                            variant="secondary"
                            className="flex-1 text-sm"
                        >
                            <Users size={16} />
                            Join Group
                        </Button>
                    </div>

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

                    <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                        {conversations.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                No conversations yet. Start chatting!
                            </p>
                        ) : (
                            conversations.map((conv) => (
                                <motion.div
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
                                                {conv.type === 'group' ? (
                                                    <Users size={14} className="text-blue-500 flex-shrink-0" />
                                                ) : (
                                                    <MessageCircle size={14} className="text-slate-400 flex-shrink-0" />
                                                )}
                                                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                                                    {getConversationTitle(conv)}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                                                {conv.lastMessage || 'No messages yet'}
                                            </p>
                                        </div>
                                        {conv.lastMessageTime && (
                                            <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                {formatTime(conv.lastMessageTime)}
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))
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
                                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                                {getConversationTitle(activeConversation)}
                                            </h2>
                                            {activeConversation.type === 'direct' ? (
                                                activeConversation.otherUser && (
                                                    <p className="text-xs text-slate-500">
                                                        Level {activeConversation.otherUser.level} • {activeConversation.otherUser.xp} XP
                                                    </p>
                                                )
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
                                        />
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex gap-2">
                                    <Input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1"
                                    />
                                    <Button onClick={handleSendMessage} variant="primary">
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageCircle size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Choose a chat from the list or start a new one
                                </p>
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
                            filteredUsers.map((user) => (
                                <motion.div
                                    key={user.id}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleSelectUser(user.id)}
                                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className="font-medium text-slate-800 dark:text-slate-100">{user.email}</div>
                                    <div className="text-xs text-slate-500">Level {user.level} • {user.xp} XP</div>
                                </motion.div>
                            ))
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
        </div>
    );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn }) => {
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
                        <ResourceCard resource={message.sharedResource} />
                    ) : (
                        <p className="text-[13px] leading-relaxed break-words">{message.content}</p>
                    )}
                </div>
                <span className="text-[9px] text-slate-400 px-1 mt-0.5 font-medium uppercase tracking-tighter">
                    {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
        </motion.div>
    );
};

// Resource Card Component (for shared items)
const ResourceCard = ({ resource }) => {
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
            onClick={() => {
                // Future: Open resource detail modal/page
            }}
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

export default Chat;
