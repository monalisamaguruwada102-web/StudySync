import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Users, MessageSquare, Trophy, Star, Share2, Plus, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StudyGroups = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('groups');
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([
        { id: 1, user: 'Alice', text: 'Hey everyone, anyone studying for the SQL exam?', time: '10:30 AM' },
        { id: 2, user: 'Bob', text: 'Yes! I created a flashcard deck for Joins.', time: '10:32 AM' },
        { id: 3, user: 'You', text: 'That sounds great, can you share it?', time: '10:33 AM', isMe: true },
    ]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        setChatHistory([...chatHistory, {
            id: Date.now(),
            user: 'You',
            text: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: true
        }]);
        setMessage('');
    };

    return (
        <Layout title="Community & Groups">
            <div className="flex gap-4 mb-6">
                <Button
                    variant={activeTab === 'groups' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('groups')}
                    className="gap-2"
                >
                    <Users size={18} /> Groups
                </Button>
                <Button
                    variant={activeTab === 'leaderboard' ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab('leaderboard')}
                    className="gap-2"
                >
                    <Trophy size={18} /> Leaderboard
                </Button>
            </div>

            {activeTab === 'groups' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                    {/* Groups List */}
                    <div className="lg:col-span-1 space-y-4 overflow-y-auto">
                        <Card className="p-4 border-l-4 border-l-primary-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Database Wizards</h3>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">Mastering SQL, NoSQL and normalization.</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Users size={14} /> 5 Members
                            </div>
                        </Card>

                        <Card className="p-4 opacity-70 hover:opacity-100 cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">React Developers</h3>
                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">2h ago</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">Frontend architecture and hooks.</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Users size={14} /> 12 Members
                            </div>
                        </Card>

                        <Button className="w-full gap-2 border-dashed border-2 border-slate-300 dark:border-slate-700 text-slate-500 hover:text-primary-600 hover:border-primary-500 bg-transparent">
                            <Plus size={18} /> Create New Group
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden !p-0">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    DW
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Database Wizards</h3>
                                    <p className="text-xs text-slate-500">5 members online</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm"><Share2 size={18} /></Button>
                                <Button variant="ghost" size="sm"><Users size={18} /></Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-black/10">
                            {chatHistory.map(msg => (
                                <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl p-3 ${msg.isMe
                                            ? 'bg-primary-600 text-white rounded-br-none'
                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                                        }`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <div className={`text-[10px] mt-1 ${msg.isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                            {!msg.isMe && <span className="font-bold mr-2">{msg.user}</span>}
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
        </Layout>
    );
};

export default StudyGroups;
