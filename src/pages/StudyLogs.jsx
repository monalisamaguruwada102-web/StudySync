import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { studyLogService, moduleService } from '../services/firestoreService';
import { Plus, History, Trash2, Calendar, Book, FileText, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useNotification } from '../context/NotificationContext';

const StudyLogs = () => {
    const { showToast, confirm } = useNotification();
    const { data: logs, loading, refresh } = useFirestore(studyLogService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const exportToCSV = () => {
        const headers = ['Date', 'Module', 'Topic', 'Hours'];
        const rows = logs.map(log => [
            log.date,
            modules.find(m => m.id === log.moduleId)?.name || 'Unknown',
            log.topic,
            log.hours
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `study_logs_${format(new Date(), 'yyyy_MM_dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        moduleId: '',
        topic: '',
        hours: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await studyLogService.add({
            ...formData,
            hours: parseFloat(formData.hours)
        });
        await refresh();
        setIsModalOpen(false);
        setFormData({ date: format(new Date(), 'yyyy-MM-dd'), moduleId: '', topic: '', hours: '' });
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Log',
            message: 'Are you sure you want to delete this study session log?',
            type: 'warning',
            confirmLabel: 'Delete'
        });
        if (isConfirmed) {
            await studyLogService.delete(id);
            await refresh();
            showToast('Session log deleted', 'info');
        }
    };

    const getModuleName = (id) => modules.find(m => m.id === id)?.name || 'Deleted Module';

    return (
        <Layout title="Study Logs">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Study History</h1>
                    <p className="text-slate-500 dark:text-slate-400">Keep track of every minute spent on your modules.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={exportToCSV}
                        className="flex items-center gap-2 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    >
                        <Download size={20} />
                        <span>Export CSV</span>
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                        <Plus size={20} />
                        <span>Log Session</span>
                    </Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Module</th>
                                <th className="px-6 py-4 font-medium">Topic</th>
                                <th className="px-6 py-4 font-medium">Time Spent</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="text-slate-700 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium">{log.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm px-2 py-1 bg-primary-50 text-primary-600 rounded-md font-medium">
                                            {getModuleName(log.moduleId)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={14} className="text-slate-400" />
                                            <span className="text-sm">{log.topic}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="text-sm font-semibold">{log.hours} hours</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" onClick={() => handleDelete(log.id)} className="!p-2 text-slate-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                        <History size={40} className="mx-auto mb-3 opacity-20" />
                                        No study logs yet. Start your first session!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Log Study Session"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Save Log</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Module</label>
                        <select
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            value={formData.moduleId}
                            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                            required
                        >
                            <option value="">Select a module</option>
                            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <Input
                        label="Topic / Subject"
                        placeholder="e.g. Binary Search Trees"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        required
                    />
                    <Input
                        label="Time Spent (Hours)"
                        type="number"
                        step="0.1"
                        placeholder="e.g. 1.5"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                        required
                    />
                </form>
            </Modal>
        </Layout>
    );
};

export default StudyLogs;
