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
    Music,
    Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import ThemeSelector from '../components/ThemeSelector';

const Settings = () => {
    const { user } = useAuth();
    const { showToast, confirm, prompt } = useNotification();


    // Diagnostic logging for ReferenceError debugging
    console.debug('Settings: user state:', user);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [importStatus, setImportStatus] = useState(null); // 'success', 'error', 'pending'

    const [activeTab, setActiveTab] = useState('general'); // 'general', 'appearance', 'integrations', 'system'
    const [calendarUrl, setCalendarUrl] = useState('');
    const [notionToken, setNotionToken] = useState('');
    const [notionDatabaseId, setNotionDatabaseId] = useState('');
    const [autoSyncCalendar, setAutoSyncCalendar] = useState(false);
    const [testStatus, setTestStatus] = useState({ type: '', message: '', loading: false });

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/user/settings');
                setCalendarUrl(response.data.calendar_sync_url || '');
                setNotionToken(response.data.notion_api_token || '');
                setNotionDatabaseId(response.data.notion_database_id || '');
                setAutoSyncCalendar(response.data.auto_sync_calendar || false);
            } catch (err) {
                console.error('Failed to fetch user settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const testConnection = async (type) => {
        setTestStatus({ type, message: 'Testing...', loading: true });
        try {
            const endpoint = type === 'calendar' ? '/sync/test-calendar' : '/sync/test-notion';
            const payload = type === 'calendar'
                ? { url: calendarUrl }
                : { token: notionToken, databaseId: notionDatabaseId };

            const res = await api.post(endpoint, payload);
            setTestStatus({ type, message: res.data.message, loading: false });
        } catch (err) {
            setTestStatus({ type, message: err.response?.data?.error || 'Connection failed', loading: false });
        }
    };

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
            showToast('Export failed. Please try again.', 'error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const isConfirmed = await confirm({
            title: 'Restore Database',
            message: 'WARNING: This will replace ALL current data with the contents of the backup file. This action cannot be undone.',
            type: 'warning',
            confirmLabel: 'Overwrite & Restore'
        });

        if (!isConfirmed) {
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
            console.error('Import failed:', error);
            setImportStatus('error');
            showToast('Restore failed: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setIsImporting(false);
            event.target.value = '';
        }
    };

    const handleDeleteAccount = async () => {
        const isConfirmed = await confirm({
            title: 'Delete Account',
            message: 'CRITICAL WARNING: This will permanently DELETE your account and ALL associated data from BOTH local and cloud storage. This action is IRREVERSIBLE.',
            type: 'error',
            confirmLabel: 'Delete Forever'
        });

        if (!isConfirmed) return;

        const confirmEmail = await prompt({
            title: 'Confirm Identity',
            message: 'To confirm, please type your email to proceed:',
            placeholder: user?.email
        });

        if (confirmEmail !== user?.email) {
            showToast('Email does not match. Deletion cancelled.', 'warning');
            return;
        }

        setIsDeletingAccount(true);
        try {
            await api.delete('/user/account');
            showToast('Account deleted. We\'re sorry to see you go.', 'success', 5000);
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Account deletion failed:', error);
            showToast('Failed to delete account: ' + (error.response?.data?.error || error.message), 'error');
            setIsDeletingAccount(false);
        }
    };

    return (
        <Layout title="Settings & Security">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Tab Navigation */}
                <div className="flex items-center gap-2 p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 w-full overflow-x-auto no-scrollbar shadow-sm">
                    {[
                        { id: 'general', label: 'General', icon: HardDrive },
                        { id: 'appearance', label: 'Appearance', icon: Palette },
                        { id: 'integrations', label: 'Integrations', icon: ExternalLink },
                        { id: 'system', label: 'System', icon: Database }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap relative overflow-hidden group ${activeTab === tab.id
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity ${activeTab === tab.id ? 'opacity-100' : ''}`} />
                            <tab.icon size={18} className="relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
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
                            <Card title="General Preferences" HeaderAction={<HardDrive size={20} className="text-primary-500" />}>
                                <div className="space-y-6">
                                    <div className="p-6 bg-gradient-to-br from-primary-500/5 to-purple-500/5 border border-primary-500/10 rounded-3xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                        <h4 className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Study Goals</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Set your daily study objectives to track your progress.</p>
                                    </div>
                                    <div className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 rounded-2xl bg-primary-500/10 text-primary-600 dark:text-primary-400">
                                                <Target size={24} />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Daily Target (Hours)</h5>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Recommended: 2h - 4h</p>
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.5"
                                            className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-center font-black text-lg outline-none focus:ring-4 focus:ring-primary-500/20 transition-all"
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
                                <Card title="External Connections" HeaderAction={<ExternalLink size={20} className="text-indigo-500" />}>
                                    <div className="space-y-4">
                                        {/* Spotify */}
                                        <div className="flex items-center justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-5">
                                                <div className="p-4 bg-[#1DB954] text-white rounded-2xl shadow-lg shadow-[#1DB954]/20 group-hover:scale-110 transition-transform duration-300">
                                                    <Music size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Spotify & Lofi</h4>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">In-App Study Beats</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-[#1DB954]/10 text-[#1DB954] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#1DB954]/20">
                                                Connected
                                            </div>
                                        </div>

                                        {/* Google Calendar */}
                                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-6 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 bg-[#4285F4] text-white rounded-2xl shadow-lg shadow-[#4285F4]/20 group-hover:scale-110 transition-transform duration-300">
                                                        <Cloud size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Google Calendar</h4>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Schedule Sync (iCal)</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${calendarUrl ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                    {calendarUrl ? 'Configured' : 'Not Connected'}
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Paste Public iCal URL (e.g. from Google Settings)"
                                                    value={calendarUrl}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setCalendarUrl(val);
                                                        saveUserSetting('calendar_sync_url', val);
                                                    }}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400"
                                                />
                                                <button
                                                    onClick={() => testConnection('calendar')}
                                                    disabled={testStatus.loading || !calendarUrl}
                                                    className="px-6 py-3 bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white rounded-xl text-xs font-black transition-all disabled:opacity-50 uppercase tracking-wider"
                                                >
                                                    {testStatus.loading && testStatus.type === 'calendar' ? '...' : 'TEST'}
                                                </button>
                                            </div>
                                            {testStatus.type === 'calendar' && (
                                                <p className={`text-[10px] font-bold ${testStatus.message.includes('Success') ? 'text-green-500' : 'text-red-500'}`}>
                                                    {testStatus.message}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                                <input
                                                    type="checkbox"
                                                    id="autoSync"
                                                    checked={autoSyncCalendar}
                                                    onChange={(e) => {
                                                        const val = e.target.checked;
                                                        setAutoSyncCalendar(val);
                                                        saveUserSetting('auto_sync_calendar', val);
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                                />
                                                <label htmlFor="autoSync" className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest cursor-pointer select-none">
                                                    Auto-sync on Startup
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold">
                                                Note: Copy the "Secret address in iCal format" from your Google Calendar settings.
                                            </p>
                                        </div>

                                        {/* Notion */}
                                        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-6 group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl shadow-lg shadow-black/20 dark:shadow-white/10 group-hover:scale-110 transition-transform duration-300">
                                                        <Database size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Notion Import</h4>
                                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Task Migration</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${notionToken ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                    {notionToken ? 'Configured' : 'Not Connected'}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    type="password"
                                                    placeholder="Enter Notion API Token"
                                                    value={notionToken}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setNotionToken(val);
                                                        saveUserSetting('notion_api_token', val);
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400"
                                                />
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Enter Database ID (Optional - imports all items if empty)"
                                                        value={notionDatabaseId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setNotionDatabaseId(val);
                                                            saveUserSetting('notion_database_id', val);
                                                        }}
                                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-medium outline-none focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-slate-400"
                                                    />
                                                    <button
                                                        onClick={() => testConnection('notion')}
                                                        disabled={testStatus.loading || !notionToken}
                                                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 rounded-xl text-xs font-black transition-all disabled:opacity-50 uppercase tracking-wider"
                                                    >
                                                        {testStatus.loading && testStatus.type === 'notion' ? '...' : 'TEST'}
                                                    </button>
                                                </div>
                                            </div>
                                            {testStatus.type === 'notion' && (
                                                <p className={`text-[10px] font-bold ${testStatus.message.includes('Success') ? 'text-green-500' : 'text-red-500'}`}>
                                                    {testStatus.message}
                                                </p>
                                            )}
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
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="p-4 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-500/30">
                                                <HardDrive size={28} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Emergency Data Tools</h3>
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Local Database Management</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                            {/* Export Section */}
                                            <div className="space-y-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-primary-500/10">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg">
                                                        <Download size={16} />
                                                    </div>
                                                    Export Database
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                    Download a complete snapshot of your StudySync database. Keep this file safe to restore your data on another device.
                                                </p>
                                                <button
                                                    onClick={handleExport}
                                                    disabled={isExporting}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-primary-500/20 hover:border-primary-500 text-primary-600 dark:text-primary-400 font-black rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                                                >
                                                    {isExporting ? <RefreshCcw className="animate-spin" size={16} /> : <Save size={16} />}
                                                    {isExporting ? 'EXPORTING...' : 'DOWNLOAD BACKUP'}
                                                </button>
                                            </div>

                                            {/* Import Section */}
                                            <div className="space-y-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-orange-500/10">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                                                        <Upload size={16} />
                                                    </div>
                                                    Restore from File
                                                </h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                    Upload a previously exported JSON backup.
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
                                                    <div className="flex items-center justify-center gap-3 px-6 py-3 bg-orange-500/10 border-2 border-orange-500/20 hover:border-orange-500 text-orange-600 dark:text-orange-400 font-black rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-widest text-xs">
                                                        {isImporting ? <RefreshCcw className="animate-spin" size={16} /> : <Upload size={16} />}
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
                                    <div className="flex items-center gap-5 mb-4">
                                        <div className={`p-3 rounded-2xl ${isCloudConfigured ? 'bg-green-500 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'}`}>
                                            <Cloud size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Cloud Sync Status</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${isCloudConfigured ? 'text-green-600' : 'text-amber-600'}`}>
                                                {isCloudConfigured ? 'CONNECTED TO SUPABASE' : 'CONFIGURATION REQUIRED'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 px-1 font-medium leading-relaxed">
                                        {isCloudConfigured ? 'Your data is now permanently synchronized with the cloud.' : 'Configure Supabase credentials in your .env file to enable persistence.'}
                                    </p>
                                </Card>

                                {/* Danger Zone */}
                                <Card className="border-2 border-red-500/20 bg-red-500/5 backdrop-blur-sm overflow-hidden">
                                    <div className="p-2">
                                        <div className="flex items-center gap-5 mb-6">
                                            <div className="p-4 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/30">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Danger Zone</h3>
                                                <p className="text-xs text-red-600 font-bold uppercase tracking-widest mt-1">Permanent Actions</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/10">
                                                WARNING: Deleting your account will remove all your data from our servers and your local device. This action is permanent and cannot be reversed.
                                            </p>
                                            <button
                                                onClick={handleDeleteAccount}
                                                disabled={isDeletingAccount}
                                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                                            >
                                                {isDeletingAccount ? <RefreshCcw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                                {isDeletingAccount ? 'DELETING ACCOUNT...' : 'DELETE MY ACCOUNT PERMANENTLY'}
                                            </button>
                                        </div>
                                    </div>
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
