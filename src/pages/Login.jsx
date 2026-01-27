import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { GraduationCap, Lock, Mail } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('joshuamujakari15@gmail.com');
    const [password, setPassword] = useState('joshua#$#$');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { authorized, user, refreshAuth } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            await refreshAuth();
            navigate('/');
        } catch (err) {
            setError('Failed to log in. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-50 via-white to-slate-50">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-200 mb-4 transform hover:rotate-6 transition-transform">
                        <GraduationCap size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">StudySync</h1>
                    <p className="text-slate-500">Manage your academic journey with ease.</p>
                </div>

                <Card className="!p-8 shadow-xl border-none">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-[38px] text-slate-400" size={18} />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-[38px] text-slate-400" size={18} />
                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full h-11 text-base mt-2"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-widest font-semibold mb-4">
                            Single User Access
                        </p>
                        <p className="text-sm text-slate-500 italic">
                            "Education is the most powerful weapon which you can use to change the world."
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
