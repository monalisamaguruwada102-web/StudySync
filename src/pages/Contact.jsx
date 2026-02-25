import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe, LayoutDashboard, X } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const Contact = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        inquiryType: 'General Information',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');

        try {
            await api.post('/contact', formData);
            setStatus('sent');
            setFormData({
                name: '',
                email: '',
                inquiryType: 'General Information',
                message: ''
            });
            setTimeout(() => setStatus(null), 5000);
        } catch (error) {
            console.error('Submission error:', error);
            setStatus('error');
            setTimeout(() => setStatus(null), 5000);
        }
    };

    return (
        <Layout title="Contact Support">
            <div className="min-h-screen pt-32 pb-12 px-4 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                        {/* Contact Info Side */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="mb-12 border-b-2 border-slate-100 dark:border-slate-900 pb-8">
                                <h1 className="text-5xl lg:text-7xl font-black text-black dark:text-white mb-4 tracking-tighter leading-[0.9]">
                                    Get in <span className="text-rose-700 dark:text-rose-600">Touch</span>
                                </h1>
                                <p className="text-xl font-serif italic text-slate-500 dark:text-slate-400">
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
                                        className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 border-l-4 border-rose-700 dark:border-rose-600 shadow-sm hover:shadow-md transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-rose-700 dark:bg-rose-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <item.icon size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-700 dark:text-rose-500 mb-1">{item.label}</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{item.value}</p>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{item.desc}</p>
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
                            className="bg-slate-50 dark:bg-slate-900 p-8 lg:p-12 border-t-4 border-rose-700 dark:border-rose-600 shadow-xl relative overflow-hidden"
                        >
                            <h3 className="text-2xl font-black text-black dark:text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
                                <MessageSquare className="text-rose-700 dark:text-rose-500" />
                                Send a Message
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="John Doe"
                                            className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-rose-700 dark:focus:border-rose-500 outline-none transition-all dark:text-white font-bold placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="john@example.com"
                                            className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-rose-700 dark:focus:border-rose-500 outline-none transition-all dark:text-white font-bold placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Inquiry Type</label>
                                    <select
                                        name="inquiryType"
                                        value={formData.inquiryType}
                                        onChange={handleChange}
                                        className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-rose-700 dark:focus:border-rose-500 outline-none transition-all dark:text-white font-bold"
                                    >
                                        <option>General Information</option>
                                        <option>Technical Support</option>
                                        <option>Feedback/Suggestions</option>
                                        <option>Business Inquiry</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Message</label>
                                    <textarea
                                        rows="4"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        placeholder="Tell us how we can help..."
                                        className="w-full px-0 py-4 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-rose-700 dark:focus:border-rose-500 outline-none transition-all dark:text-white font-bold placeholder:text-slate-300 resize-none"
                                    ></textarea>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={status === 'sending'}
                                    className={`w-full py-5 flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] transition-all text-xs ${status === 'sent'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-black dark:bg-white text-white dark:text-black hover:bg-rose-700 dark:hover:bg-rose-200'
                                        }`}
                                >
                                    {status === 'sending' ? (
                                        <Clock className="animate-spin" size={16} />
                                    ) : status === 'sent' ? (
                                        <>Sent Successfully <Send size={16} /></>
                                    ) : status === 'error' ? (
                                        <>Error - Try Again <X size={16} /></>
                                    ) : (
                                        <>Send Message <Send size={16} /></>
                                    )}
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Contact;
