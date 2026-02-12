import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, MessageSquare, Trophy, Star, Share2, Plus, Send, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import useChat from '../hooks/useChat';

const StudyGroups = () => {
    const { user } = useAuth();
    const { showToast } = useNotification();
    const {
        conversations,
        messages,
        activeConversation,
        setActiveConversation,
        sendMessage,
        fetchAvailableGroups,
        joinGroup
    } = useChat();

    const [activeTab, setActiveTab] = useState('groups');
    const [message, setMessage] = useState('');
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const groupConversations = conversations.filter(c => c.type === 'group');

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !activeConversation) return;

        try {
            await sendMessage(activeConversation.id, message);
            setMessage('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const handleJoinGroup = async () => {
        try {
            await joinGroup(inviteCode);
            setShowJoinModal(false);
            setInviteCode('');
        } catch (err) {
            showToast(err.message || 'Failed to join group', 'error');
        }
    };

    useEffect(() => {
        fetchAvailableGroups();
    }, [fetchAvailableGroups]);

    return (
        <Layout title="Community & Groups">
            <div className="flex gap-4 mb-6 overflow-x-auto pb-2 sm:pb-0">
                <Button
                    variant={activeTab === 'groups' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('groups')}
                    className="gap-2 whitespace-nowrap"
                >
                    <Users size={18} /> Groups
                </Button>
                <Button
                    variant={activeTab === 'leaderboard' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('leaderboard')}
                    className="gap-2 whitespace-nowrap"
                >
                    <Trophy size={18} /> Leaderboard
                </Button>
            </div>

            {activeTab === 'groups' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] lg:h-[calc(100vh-140px)]">
                    {/* Groups List - Hidden on mobile if group selected */}
                    <div className={`lg:col-span-1 space-y-4 overflow-y-auto ${activeConversation ? 'hidden lg:block' : 'block'}`}>


                        {groupConversations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <p>You haven't joined any groups yet.</p>
                                <Button
                                    variant="primary"
                                    className="mt-4"
                                    onClick={() => setShowJoinModal(true)}
                                >
                                    Join a Group
                                </Button>
                            </div>
                        ) : (
                            groupConversations.map(conv => (
                                <Card
                                    key={conv.id}
                                    className={`p-4 border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all ${activeConversation?.id === conv.id ? 'border-l-primary-500 bg-slate-50 dark:bg-slate-800/50' : 'border-l-transparent'}`}
                                    onClick={() => setActiveConversation(conv)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{conv.groupName || 'Unnamed Group'}</h3>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 truncate">{conv.lastMessage || 'No messages yet'}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Users size={14} /> {conv.participants?.length || 0} Members
                                    </div>
                                </Card>
                            ))
                        )}

                        <Button
                            className="w-full gap-2 border-dashed border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-500 bg-transparent"
                            onClick={() => setShowJoinModal(true)}
                        >
                            <Plus size={18} /> Join New Group
                        </Button>
                    </div>

                    {/* Chat Area - Hidden on mobile if NO group selected */}
                    <Card className={`lg:col-span-2 flex-col h-full overflow-hidden !p-0 ${activeConversation ? 'flex' : 'hidden lg:flex'}`}>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="lg:hidden p-1 -ml-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                    {activeConversation ? activeConversation.groupName?.substring(0, 2).toUpperCase() : '??'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{activeConversation ? activeConversation.groupName : 'Select a Group'}</h3>
                                    <p className="text-xs text-slate-500">{activeConversation?.participants?.length || 0} members</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm"><Share2 size={18} /></Button>
                                <Button variant="ghost" size="sm"><Users size={18} /></Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-black/10">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                    <MessageSquare size={48} className="mb-4" />
                                    <p>No messages in this group yet.</p>
                                    <p className="text-xs">Say hi to your study group!</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 ${isMe
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <div className={`text-[10px] mt-1 ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                                    {!isMe && <span className="font-bold mr-2">{msg.senderEmail || 'Member'}</span>}
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500/50 outline-none dark:text-white"
                            />
                            <Button type="submit" variant="primary" className="rounded-xl px-4">
                                <Send size={18} />
                            </Button>
                        </form>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-500" /> Global Leaderboard
                        </h2>

                        <div className="space-y-2">
                            {[
                                { rank: 1, name: 'Sarah Connor', xp: 12500, level: 12, avatar: 'SC' },
                                { rank: 2, name: 'You', xp: user?.xp || 0, level: user?.level || 1, avatar: 'ME', isMe: true },
                                { rank: 3, name: 'John Doe', xp: 8900, level: 8, avatar: 'JD' },
                                { rank: 4, name: 'Emily Chen', xp: 7200, level: 7, avatar: 'EC' },
                                { rank: 5, name: 'Michael Ross', xp: 5400, level: 5, avatar: 'MR' },
                            ].map((player) => (
                                <div
                                    key={player.rank}
                                    className={`flex items-center gap-4 p-4 rounded-xl border ${player.isMe
                                        ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'
                                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                                        }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${player.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                        player.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                            player.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                                'text-slate-400'
                                        }`}>
                                        {player.rank}
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500">
                                        {player.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{player.name}</h4>
                                            {player.isMe && <span className="text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                                        </div>
                                        <p className="text-xs text-slate-500">Level {player.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-primary-600">{player.xp.toLocaleString()} XP</div>
                                        <div className="text-[10px] text-slate-400">Total Score</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
            {showJoinModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-sm p-6 space-y-4 shadow-2xl border-none">
                        <h2 className="text-xl font-bold">Join a Study Group</h2>
                        <p className="text-sm text-slate-500">Enter the invite code provided by your group admin.</p>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                            placeholder="Invite Code (e.g. STUDY123)"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" className="flex-1 text-slate-500" onClick={() => setShowJoinModal(false)}>Cancel</Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleJoinGroup}
                                disabled={!inviteCode.trim()}
                            >
                                Join Group
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </Layout>
    );
};

export default StudyGroups;
