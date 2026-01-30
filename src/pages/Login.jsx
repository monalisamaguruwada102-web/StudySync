import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { GraduationCap, Lock, ArrowRight, User, X, Monitor, Smartphone, Download, HelpCircle } from 'lucide-react';

const Login = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    const users = [
        { name: 'Joshua Mujakari', email: 'joshuamujakari15@gmail.com', role: 'Student' },
        { name: 'Monalisa Maguruwada', email: 'monalisamaguruwada@gmail.com', role: 'Student' }
    ];

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setError('');
        setPassword('');
    };

    const handleBack = () => {
        setSelectedUser(null);
        setError('');
        setPassword('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(selectedUser.email, password);
            await refreshAuth();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log in. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
            <div className="w-full max-w-md z-10 relative">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl text-white shadow-2xl border border-white/20 mb-6 transform hover:scale-105 transition-all duration-300">
                        <GraduationCap size={40} className="drop-shadow-lg" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">StudySync</h1>
                    <p className="text-slate-200 text-lg font-light">Who is studying today?</p>
                </div>

                <Card className="!p-8 shadow-2xl border border-white/20 bg-white/10 backdrop-blur-xl rounded-3xl text-white">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-100 rounded-xl text-sm backdrop-blur-sm flex items-center">
                            <span className="mr-2">⚠️</span> {error}
                        </div>
                    )}

                    {!selectedUser ? (
                        <div className="space-y-4">
                            {users.map((user) => (
                                <button
                                    key={user.email}
                                    onClick={() => handleUserSelect(user)}
                                    className="w-full flex items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/20 transition-all group text-left"
                                >
                                    <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-200 group-hover:bg-primary-500 group-hover:text-white transition-colors mr-4">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-white group-hover:translate-x-1 transition-transform">{user.name}</h3>
                                        <p className="text-sm text-slate-300">{user.email}</p>
                                    </div>
                                    <ArrowRight className="ml-auto text-slate-400 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" size={20} />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white mr-3">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                                        <p className="text-xs text-slate-300">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-[14px] text-slate-300 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-transparent transition-all hover:bg-white/10"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-medium rounded-xl bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-900/40 text-white border-none transition-all hover:shadow-primary-600/50 hover:-translate-y-0.5"
                                    disabled={loading}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {loading ? 'Unlocking...' : 'Unlock Dashboard'}
                                        {!loading && <ArrowRight size={18} />}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>

                {/* Get the App Section */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 text-white group hover:bg-white/15 transition-all">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/30">
                                <Monitor size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-tight">Desktop App</h4>
                                <p className="text-xs text-slate-300 uppercase tracking-widest font-black mt-1">Windows (.exe)</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                            Run StudySync as a native app with offline support and faster performance.
                        </p>
                        <a
                            href="https://drive.google.com/file/d/1GBmkXaIbVZCbVBq9GH6h5-wX_5Mjb_GA/view?usp=sharing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                        >
                            <Download size={16} />
                            Download for Windows
                        </a>
                    </div>

                    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 text-white group hover:bg-white/15 transition-all">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/30">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-lg leading-tight">Mobile App</h4>
                                <p className="text-xs text-slate-300 uppercase tracking-widest font-black mt-1">PWA Sync</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                            Install on iOS or Android instantly via browser for real-time study tracking.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <HelpCircle size={14} />
                            Tap "Add to Home Screen"
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
