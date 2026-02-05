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
    Palette,
    Cloud,
    ExternalLink,
    CheckCircle2,
    Target,
    Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ThemeSelector from '../components/ThemeSelector';

const Settings = () => {
    const { user } = useAuth();
    const themeContext = useTheme();

    // Diagnostic logging for ReferenceError debugging
    console.debug('Settings: user state:', user);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState(null); // 'success', 'error', 'pending'
    const [errorMessage, setErrorMessage] = useState('');
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'appearance', 'integrations', 'system'
    const [calendarUrl, setCalendarUrl] = useState('');
    const [notionToken, setNotionToken] = useState('');

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/user/settings');
                setCalendarUrl(response.data.calendar_sync_url || '');
                setNotionToken(response.data.notion_api_token || '');
            } catch (err) {
                console.error('Failed to fetch user settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const saveUserSetting = async (key, value) => {
        try {
            await api.post('/user/settings', { [key]: value });
        } catch (err) {
            console.error('Failed to save user setting:', err);
        }
    };

    const isCloudConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

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
                {/* Tab Navigation */}
                <div className="flex items-center gap-2 p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-800 w-full overflow-x-auto no-scrollbar">
                    {[
                        { id: 'general', label: 'General', icon: HardDrive },
                        { id: 'appearance', label: 'Appearance', icon: Palette },
                        { id: 'integrations', label: 'Integrations', icon: ExternalLink },
                        { id: 'system', label: 'System', icon: Database }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-8"
                    >
                        {activeTab === 'general' && (
                            <Card title="General Preferences" HeaderAction={<HardDrive size={18} className="text-primary-500" />}>
                                <div className="space-y-6">
                                    <div className="p-4 bg-primary-500/5 border border-primary-500/10 rounded-2xl">
                                        <h4 className="text-sm font-black text-primary-500 uppercase tracking-widest mb-1">Study Goals</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Set your daily study objectives.</p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-primary-500/20 text-primary-500">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Daily Target (Hours)</h5>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Averages 2h per day</p>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.5"
                                            className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center font-bold outline-none focus:ring-2 focus:ring-primary-500/20"
                                            value={user?.settings?.dailyStudyTarget || 2}
                                            onChange={(e) => saveUserSetting('dailyStudyTarget', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </Card>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6">
                                <ThemeSelector />
                            </div>
                        )}

                        {activeTab === 'integrations' && (
                            <div className="space-y-6">
                                <Card title="External Connections" HeaderAction={<ExternalLink size={18} className="text-indigo-500" />}>
                                    <div className="space-y-4">
                                        {/* Spotify */}
                                        <div className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-500/20">
                                                    <Music size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Spotify & Lofi</h4>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">In-App Study Beats</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                                Connected
                                            </div>
                                        </div>

                                        {/* Google Calendar */}
                                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-blue-500 text-white rounded-2xl">
                                                        <Cloud size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Google Calendar</h4>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Schedule Sync (iCal)</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${calendarUrl ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                    {calendarUrl ? 'Configured' : 'Not Connected'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Paste Public iCal URL (e.g. from Google Settings)"
                                                    value={calendarUrl}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCalendarUrl(val);
                                                        saveUserSetting('calendar_sync_url', val);
                                                    }}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/20"
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                Copy the "Secret address in iCal format" from your Google Calendar settings.
                                            </p>
                                        </div>

                                        {/* Notion */}
                                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-slate-900 text-white rounded-2xl">
                                                        <Database size={24} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Notion Import</h4>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Task Migration</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${notionToken ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                    {notionToken ? 'Configured' : 'Not Connected'}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="password"
                                                    placeholder="Enter Notion API Token"
                                                    value={notionToken}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNotionToken(val);
                                                        saveUserSetting('notion_api_token', val);
                                                    }}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-500/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === 'system' && (
                            <div className="space-y-8">
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
                                                    Download a complete snapshot of your StudySync database. Keep this file safe to restore your data on another device.
                                                </p>
                                                <button
                                                    onClick={handleExport}
                                                    disabled={isExporting}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-primary-500/20 hover:border-primary-500 text-primary-600 dark:text-primary-400 font-black rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
                                        </AnimatePresence>
                                    </div>
                                </Card>

                                <Card className={`border-2 ${isCloudConfigured ? 'border-green-500/20 bg-green-500/5' : 'border-amber-500/20 bg-amber-500/5'} backdrop-blur-sm overflow-hidden`}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`p-3 rounded-2xl ${isCloudConfigured ? 'bg-green-500 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'}`}>
                                            <Cloud size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Cloud Sync Status</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest ${isCloudConfigured ? 'text-green-600' : 'text-amber-600'}`}>
                                                {isCloudConfigured ? 'CONNECTED TO SUPABASE' : 'CONFIGURATION REQUIRED'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 px-1 font-medium">
                                        {isCloudConfigured ? 'Your data is now permanently synchronized with the cloud.' : 'Configure Supabase credentials in your .env file to enable persistence.'}
                                    </p>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default Settings;
