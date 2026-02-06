import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Share2, Users, Plus, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useChat from '../hooks/useChat';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ResourceShareModal from '../components/chat/ResourceShareModal';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/users/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

    console.log('Current users state:', users);
    console.log('Filtered users:', filteredUsers);
    console.log('Current UI user:', currentUser);

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
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                            {getConversationTitle(activeConversation)}
                                        </h2>
                                        {activeConversation.type === 'direct' && activeConversation.otherUser && (
                                            <p className="text-xs text-slate-500">
                                                Level {activeConversation.otherUser.level} • {activeConversation.otherUser.xp} XP
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => setShowResourceShare(true)}
                                        variant="secondary"
                                        className="text-sm"
                                    >
                                        <Share2 size={16} />
                                        Share
                                    </Button>
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
            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!isOwn && (
                    <span className="text-xs text-slate-500 px-2">{message.senderEmail}</span>
                )}
                <div
                    className={`px-4 py-2 rounded-2xl ${isOwn
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm'
                        }`}
                >
                    {message.sharedResource ? (
                        <ResourceCard resource={message.sharedResource} />
                    ) : (
                        <p className="text-sm break-words">{message.content}</p>
                    )}
                </div>
                <span className="text-[10px] text-slate-400 px-2">
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
    return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                📎 Shared {resource.type}
            </div>
            <div className="font-medium text-slate-800 dark:text-slate-100 text-sm mb-1">
                {resource.title}
            </div>
            {resource.preview && (
                <div className="text-xs text-slate-500 truncate">
                    {resource.preview}
                </div>
            )}
        </div>
    );
};

export default Chat;
