import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import bg1 from '../assets/images/login-bg-1.png';
import bg2 from '../assets/images/login-bg-2.png';
import bg3 from '../assets/images/login-bg-3.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [bgIndex, setBgIndex] = useState(0);
    const navigate = useNavigate();
    const { refreshAuth } = useAuth();

    const backgrounds = [bg1, bg2, bg3];

    // Background Slideshow
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % backgrounds.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            await refreshAuth();
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to log in. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
            {/* Background Slideshow */}
            {backgrounds.map((bg, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${index === bgIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                    style={{ backgroundImage: `url(${bg})` }}
                />
            ))}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

            {/* Content */}
            <div className="w-full max-w-md z-10 relative">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl text-white shadow-2xl border border-white/20 mb-6 transform hover:scale-105 transition-all duration-300">
                        <GraduationCap size={40} className="drop-shadow-lg" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-md">Welcome Back</h1>
                    <p className="text-slate-200 text-lg font-light">Your academic journey continues here.</p>
                </div>

                <Card className="!p-10 shadow-2xl border border-white/20 bg-white/10 backdrop-blur-xl rounded-3xl text-white">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-100 rounded-xl text-sm backdrop-blur-sm flex items-center">
                                <span className="mr-2">⚠️</span> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-[14px] text-slate-300 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-transparent transition-all hover:bg-white/10"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-[14px] text-slate-300 group-focus-within:text-white transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-transparent transition-all hover:bg-white/10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-medium rounded-xl bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-900/40 text-white border-none transition-all hover:shadow-primary-600/50 hover:-translate-y-0.5"
                            disabled={loading}
                        >
                            <span className="flex items-center justify-center gap-2">
                                {loading ? 'Signing in...' : 'Sign In'}
                                {!loading && <ArrowRight size={18} />}
                            </span>
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-xs text-slate-300 leading-relaxed uppercase tracking-widest font-semibold mb-4 opacity-80">
                            StudySync Platform
                        </p>
                        <p className="text-sm text-slate-200 italic font-light opacity-90">
                            "Education is the most powerful weapon which you can use to change the world."
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
