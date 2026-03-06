import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, File, Shield, HardDrive, Download, Trash2, Search, Filter, MoreVertical, Plus, Lock, FolderPlus } from 'lucide-react';

const Vault = () => {
    const { user } = useAuth();
    const [view, setView] = useState('grid');
    const [files] = useState([
        { id: 1, name: 'Advanced Calculus Notes.pdf', size: '2.4 MB', type: 'PDF', folder: 'Math', date: '2024-03-01' },
        { id: 2, name: 'Neuroscience Final Review.docx', size: '1.1 MB', type: 'DOCX', folder: 'Medical', date: '2024-03-05' },
        { id: 3, name: 'System Architecture.png', size: '4.5 MB', type: 'Image', folder: 'CS', date: '2024-02-28' },
        { id: 4, name: 'Python Scripts.zip', size: '12.8 MB', type: 'Archive', folder: 'CS', date: '2024-03-10' },
        { id: 5, name: 'Constitutional Law.pdf', size: '3.2 MB', type: 'PDF', folder: 'Law', date: '2024-03-12' },
    ]);

    const folders = ['Math', 'Medical', 'CS', 'Law', 'Research'];

    return (
        <Layout title="The Vault">
            <div className="max-w-6xl mx-auto space-y-10 py-6">
                {/* Vault Header Stat */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 blur-[130px] rounded-full -mr-64 -mt-64" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-2xl">
                                    <Shield className="text-primary-400" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight uppercase italic">The Vault</h1>
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">Premium Asset Management</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-lg font-medium leading-relaxed max-w-xl">
                                Your secure, centralized repository for all academic assets. Organized, encrypted, and accessible anywhere.
                            </p>
                            <div className="flex gap-6 items-center">
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Storage Used</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-primary-500 w-[42%]" />
                                        </div>
                                        <span className="text-xs font-black">4.2 GB / 10 GB</span>
                                    </div>
                                </div>
                                <div className="h-10 w-[1px] bg-white/10 mx-2" />
                                <div className="space-y-1">
                                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">Total Items</span>
                                    <span className="text-xl font-black">128</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 w-full lg:w-auto">
                            <button className="px-10 py-5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3">
                                <Plus size={18} strokeWidth={3} />
                                Upload Files
                            </button>
                            <button className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3">
                                <FolderPlus size={18} />
                                New Folder
                            </button>
                        </div>
                    </div>
                </div>

                {/* File Explorer */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Sidebar Filters */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Quick Access</h3>
                            <div className="space-y-2">
                                {['Recent Files', 'Starred', 'Shared', 'Trash'].map(item => (
                                    <button key={item} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-primary-500 transition-colors" />
                                        {item}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Folders</h3>
                            <div className="space-y-2">
                                {folders.map(folder => (
                                    <button key={folder} className="w-full flex items-center justify-between px-6 py-4 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                        <div className="flex items-center gap-3">
                                            <Folder size={16} className="text-primary-500" />
                                            {folder}
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-black">12</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main File View */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search the vault..."
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl pl-12 pr-4 py-3 text-xs font-medium focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                {['grid', 'list'].map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setView(m)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === m ? 'bg-white dark:bg-slate-900 text-primary-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`grid ${view === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                            {files.map((file) => (
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    key={file.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl relative group overflow-hidden"
                                >
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500">
                                            {file.type === 'PDF' ? <File size={24} /> : <HardDrive size={24} />}
                                        </div>
                                        <button className="p-2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>

                                    <div className="mt-6 mb-8">
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{file.name}</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 px-2 py-1 bg-primary-50 dark:bg-primary-900/10 rounded-md">
                                                {file.folder}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{file.size}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 py-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-500 rounded-xl transition-all flex items-center justify-center gap-2">
                                            <Download size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Download</span>
                                        </button>
                                        <button className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Security Indicator */}
                                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Lock size={12} className="text-emerald-500" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Vault;
