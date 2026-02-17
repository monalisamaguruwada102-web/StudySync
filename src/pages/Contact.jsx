import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';

const Contact = () => {
    const [status, setStatus] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('sending');
        setTimeout(() => setStatus('sent'), 1500);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Contact Info Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="mb-12">
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                                Get in <span className="text-primary-500">Touch</span>
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-lg">
                                Have questions? We're here to help you sync your success.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: 'Email Us', value: 'joshwebsinfo@gmail.com', desc: 'Direct support line' },
                                { icon: Phone, label: 'Call Us', value: '0789932832', desc: 'Mon - Fri, 8am - 5pm' },
                                { icon: MapPin, label: 'Location', value: '6945 Bindura, Zimbabwe', desc: 'JoshWebs Digital HQ' },
                                { icon: Globe, label: 'Digital', value: 'joshwebs.dev', desc: 'Visit our web presence' }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ x: 10 }}
                                    className="flex items-center gap-6 p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-lg group"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <item.icon size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-1">{item.label}</p>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{item.value}</p>
                                        <p className="text-xs text-slate-400">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Contact Form Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-white/20 dark:bg-slate-900/60 backdrop-blur-2xl p-8 lg:p-12 rounded-[3rem] border border-white/20 dark:border-white/10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500" />

                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                            <MessageSquare className="text-primary-500" />
                            Send a Message
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-500 ml-2 tracking-widest">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="John Doe"
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white backdrop-blur-md"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-slate-500 ml-2 tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="john@example.com"
                                        className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white backdrop-blur-md"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-500 ml-2 tracking-widest">Inquiry Type</label>
                                <select className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 outline-none transition-all dark:text-white">
                                    <option>General Information</option>
                                    <option>Technical Support</option>
                                    <option>Feedback/Suggestions</option>
                                    <option>Business Inquiry</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-slate-500 ml-2 tracking-widest">Message</label>
                                <textarea
                                    rows="4"
                                    required
                                    placeholder="Tell us how we can help..."
                                    className="w-full px-6 py-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white backdrop-blur-md resize-none"
                                ></textarea>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={status === 'sending'}
                                className={`w-full py-5 rounded-3xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all shadow-xl ${status === 'sent'
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                        : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/30'
                                    }`}
                            >
                                {status === 'sending' ? (
                                    <Clock className="animate-spin" size={20} />
                                ) : status === 'sent' ? (
                                    <>Success! <Send size={20} /></>
                                ) : (
                                    <>Send Message <Send size={20} /></>
                                )}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
