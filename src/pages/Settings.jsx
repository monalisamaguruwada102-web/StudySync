import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import api from '../services/api';
import {
    Download,
    Upload,
    ShieldCheck,
    AlertTriangle,
    RefreshCcw,
    Database,
    HardDrive,
    Save,
    Moon,
    Sun,
    Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState(null); // 'success', 'error', 'pending'
    const [errorMessage, setErrorMessage] = useState('');

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `StudySync-Backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.confirm('WARNING: This will overwrite your current database. Are you sure?')) {
            event.target.value = null;
            return;
        }

        setIsImporting(true);
        setImportStatus('pending');
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('/admin/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportStatus('success');
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            setImportStatus('error');
            setErrorMessage(error.response?.data?.error || 'Import failed');
            console.error('Import failed:', error);
        } finally {
            setIsImporting(false);
            event.target.value = null;
        }
    };

    return (
        <Layout title="Settings & Security">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col gap-2 mb-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <Database className="text-primary-500" />
                        System Administration
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Manage your local data, backups, and security settings to ensure your study progress is never lost.
                    </p>
                </div>

                {/* Appearance Card */}
                <Card title="Appearance" HeaderAction={<Palette size={18} className="text-primary-500" />}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                </div>
                                <div>
                                    <h5 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Theme Mode</h5>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-primary-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDarkMode ? 'translate-x-7' : ''}`} />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Data Persistence Card */}
                <Card className="border-2 border-primary-500/20 bg-primary-500/5 backdrop-blur-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <ShieldCheck size={120} />
                    </div>

                    <div className="p-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/30">
                                <HardDrive size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Emergency Data Tools</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Local Database Management</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Export Section */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Download size={18} className="text-primary-500" />
                                    Export Database
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Download a complete snapshot of your StudySync database. Keep this file safe to restore your data on another device or after an update.
                                </p>
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-primary-500/20 hover:border-primary-500 text-primary-600 dark:text-primary-400 font-black rounded-2xl transition-all shadow-sm hover:shadow-primary-500/10 active:scale-95 disabled:opacity-50"
                                >
                                    {isExporting ? <RefreshCcw className="animate-spin" /> : <Save size={20} />}
                                    {isExporting ? 'EXPORTING...' : 'DOWNLOAD BACKUP'}
                                </button>
                            </div>

                            {/* Import Section */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Upload size={18} className="text-orange-500" />
                                    Restore from File
                                </h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Upload a previously exported JSON backup to restore your workspace.
                                    <span className="text-orange-500 font-bold"> This will overwrite all current data.</span>
                                </p>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleImport}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        disabled={isImporting}
                                    />
                                    <div className="flex items-center justify-center gap-3 px-6 py-4 bg-orange-500/10 border-2 border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 font-black rounded-2xl transition-all shadow-sm active:scale-95">
                                        {isImporting ? <RefreshCcw className="animate-spin" /> : <Upload size={20} />}
                                        {isImporting ? 'IMPORTING...' : 'UPLOAD & RESTORE'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        <AnimatePresence mode="wait">
                            {importStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 bg-green-500/20 border border-green-500/30 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-3 font-bold"
                                >
                                    <ShieldCheck size={20} />
                                    Database restored! Reloading application...
                                </motion.div>
                            )}
                            {importStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="p-4 bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 font-bold"
                                >
                                    <AlertTriangle size={20} />
                                    {errorMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>

                {/* Cloud Migration Roadmap Card */}
                <Card className="border border-slate-200 dark:border-slate-800 opacity-60">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                            <RefreshCcw size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Cloud Sync Roadmap</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Coming Soon: Automatic Real-time Database</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        We are currently building an automated cloud sync feature using <span className="font-bold text-slate-700 dark:text-slate-300">Supabase</span>.
                        Once active, your data will sync instantly across all your devices and will be immune to local updates.
                    </p>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">VERSION 2.1 REQUIRED</span>
                        <span className="px-3 py-1 bg-primary-500/10 text-[10px] font-bold text-primary-500 rounded-full border border-primary-500/20">PREMIUM ONLY</span>
                    </div>
                </Card>
            </div>
        </Layout>
    );
};

export default Settings;
