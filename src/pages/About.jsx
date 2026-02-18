import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Code2, Heart, Sparkles, Globe, LayoutDashboard } from 'lucide-react';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Navigation */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="group mb-8 flex items-center gap-2 text-slate-400 hover:text-primary-500 transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    <LayoutDashboard size={14} className="group-hover:scale-110 transition-transform" />
                    Dashboard
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-12">
                        <div className="inline-flex p-3 bg-primary-500/10 rounded-2xl mb-4">
                            <GraduationCap className="text-primary-500 w-8 h-8" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                            About <span className="text-primary-500">StudySync</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                            Empowering students worldwide with intelligent tools for academic excellence and mental clarity.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <Code2 className="text-primary-500" />
                                The Visionary
                            </h2>
                            <div className="space-y-4">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    StudySync was envisioned and developed by <span className="font-bold text-primary-500">joshwebs</span>,
                                    a passionate developer dedicated to creating high-impact educational technology.
                                </p>
                                <div className="pt-4 space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                                        <Mail size={18} className="text-primary-500" />
                                        <span>joshwebsinfo@gmail.com</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                                        <MapPin size={18} className="text-primary-500" />
                                        <span>6945 BINDURA, ZIMBABWE</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                                        <Globe size={18} className="text-primary-500" />
                                        <span>Developed by JoshWebs Digital Solutions</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="p-8 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl"
                        >
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                                <Sparkles className="text-purple-500" />
                                Our Mission
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                To democratize advanced study techniques through a unified, aesthetic, and AI-powered platform.
                                We believe that with the right data and structure, every student can unlock their full academic potential.
                            </p>
                            <div className="mt-8 p-4 bg-primary-500/5 rounded-2xl border border-primary-500/10">
                                <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400 font-bold mb-2">
                                    <Heart size={16} fill="currentColor" />
                                    <span>Built for Students</span>
                                </div>
                                <p className="text-xs text-slate-500 italic">
                                    Crafted with precision in Bindura, Zimbabwe.
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-12 p-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <GraduationCap size={120} />
                        </div>
                        <div className="relative z-10 max-w-2xl">
                            <h3 className="text-2xl font-black mb-4 uppercase tracking-wider">The StudySync Promise</h3>
                            <p className="text-white/80 leading-relaxed text-lg">
                                We are committed to data privacy, continuous innovation, and providing a distraction-free
                                environment for your most important work. Welcome to the future of learning.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
