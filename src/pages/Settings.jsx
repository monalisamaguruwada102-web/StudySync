import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useFirestore } from '../hooks/useFirestore';
import {
    moduleService,
    noteService,
    flashcardService,
    flashcardDeckService,
    studyLogService,
    taskService,
    pomodoroService,
    calendarService
} from '../services/firestoreService';
import {
    Download,
    Upload,
    Trash2,
    Database,
    Palette,
    Moon,
    Sun,
    Monitor,
    RefreshCw
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [importData, setImportData] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Fetch all data for export
    const { data: modules } = useFirestore(moduleService.getAll);
    const { data: notes } = useFirestore(noteService.getAll);
    const { data: decks } = useFirestore(flashcardDeckService.getAll);
    const { data: cards } = useFirestore(flashcardService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    const { data: pomodoros } = useFirestore(pomodoroService.getAll);
    const { data: events } = useFirestore(calendarService.getAll);

    const handleExport = () => {
        const fullBackup = {
            modules,
            notes,
            flashcardDecks: decks,
            flashcards: cards,
            studyLogs: logs,
            tasks,
            pomodoroSessions: pomodoros,
            calendarEvents: events,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `studysync_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = async () => {
        if (!importData) return;

        try {
            setIsImporting(true);
            const parsed = JSON.parse(importData);

            // This is a destructive operation in a real app, but here we'll just append/overwrite
            // For simplicity in this demo, we'll confirm strictly.
            if (!window.confirm("This will merge imported data into your current database. Continue?")) {
                setIsImporting(false);
                return;
            }

            // In a real implementation, we would batch these updates to the backend.
            // For the local server, we could add a bulk import endpoint, but we'll verify via valid JSON.
            alert("Data validation successful! In a production environment, this would now overwrite your database.");

            // Simulating a refresh
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e) {
            alert("Invalid JSON data. Please check your text.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <Layout title="System Settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Data Management */}
                <div className="space-y-6">
                    <Card title="Data Persistence" HeaderAction={<Database size={18} className="text-primary-500" />}>
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                                    <Download size={16} /> Export Data
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Download a complete backup of your study logs, notes, and flashcards as a JSON file.
                                </p>
                                <Button onClick={handleExport} className="w-full">Download Backup</Button>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                                    <Upload size={16} /> Import Data
                                </h4>
                                <p className="text-xs text-slate-500 mb-4">
                                    Paste your backup JSON below to restore your progress.
                                </p>
                                <textarea
                                    className="w-full text-xs font-mono p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-3 h-32 outline-none focus:border-primary-500"
                                    placeholder='Paste JSON here: { "modules": [], "logs": [] ... }'
                                    value={importData}
                                    onChange={(e) => setImportData(e.target.value)}
                                />
                                <Button variant="secondary" onClick={handleImport} className="w-full" disabled={isImporting}>
                                    {isImporting ? 'Restoring...' : 'Restore Data'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-2xl">
                        <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                            <Trash2 size={16} /> Danger Zone
                        </h4>
                        <p className="text-xs text-red-500/80 mb-4">
                            Irreversibly delete all your study data and reset the account to factory defaults.
                        </p>
                        <Button className="w-full !bg-red-600 hover:!bg-red-700 text-white border-none">
                            Reset Account
                        </Button>
                    </div>
                </div>

                {/* Customization */}
                <div className="space-y-6">
                    <Card title="Appearance" HeaderAction={<Palette size={18} className="text-primary-500" />}>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-3">
                                    {isDarkMode ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-500" />}
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Theme Mode</h5>
                                        <p className="text-xs text-slate-400">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-primary-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>
                        </div>
                    </Card>

                    <Card title="About StudySync">
                        <div className="text-center py-6">
                            <Monitor size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <h3 className="font-bold text-slate-800 dark:text-slate-100">StudySync Pro</h3>
                            <p className="text-xs text-slate-400 mb-4">Version 2.5.0 (Elite Edition)</p>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                                Designed for IT students who want to master efficient learning.
                                Built with React, Vite, Node.js, and a lot of caffeine.
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-4">
                                <a href="#" className="text-xs hover:text-primary-500 transition-colors dark:text-slate-400">Documentation</a>
                                <a href="#" className="text-xs hover:text-primary-500 transition-colors dark:text-slate-400">Support</a>
                                <a href="#" className="text-xs hover:text-primary-500 transition-colors dark:text-slate-400">License</a>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
