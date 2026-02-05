import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { taskService, moduleService } from '../services/firestoreService';
import { Plus, CheckCircle, Circle, AlertCircle, Trash2, Calendar, Book, Database, Loader2 } from 'lucide-react';
import { isBefore, parseISO, startOfDay } from 'date-fns';
import api from '../services/api';

const Tasks = () => {
    const { data: tasks, loading, refresh } = useFirestore(taskService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        moduleId: '',
        dueDate: '',
        status: 'Pending'
    });
    const [isImporting, setIsImporting] = useState(false);

    const handleNotionImport = async () => {
        let token = null;
        let databaseId = null;
        try {
            const res = await api.get('/user/settings');
            token = res.data.notion_api_token;
            databaseId = res.data.notion_database_id;
        } catch (e) {
            console.error("Failed to fetch Notion settings from cloud");
        }

        if (!token) {
            alert('Please configure your Notion API Token in Settings > Integrations first.');
            return;
        }

        setIsImporting(true);
        try {
            const response = await api.post('/sync/notion-tasks', { token, databaseId });
            await refresh();
            alert(response.data.message || 'Notion tasks imported successfully!');
        } catch (error) {
            console.error('Notion import error:', error);
            alert('Failed to import tasks from Notion.');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await taskService.add(formData);
        await refresh();
        setIsModalOpen(false);
        setFormData({ title: '', moduleId: '', dueDate: '', status: 'Pending' });
    };

    const toggleStatus = async (task) => {
        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        await taskService.update(task.id, { status: newStatus });
        await refresh();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            await taskService.delete(id);
            await refresh();
        }
    };

    const getModuleName = (id) => modules.find(m => m.id === id)?.name || 'General';

    const isOverdue = (date, status) => {
        if (status === 'Completed' || !date) return false;
        return isBefore(parseISO(date), startOfDay(new Date()));
    };

    return (
        <Layout title="Task Tracker">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tasks & Assignments</h1>
                    <p className="text-slate-500 dark:text-slate-400">Stay on top of your deadlines and deliverables.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={handleNotionImport}
                        disabled={isImporting}
                        className="flex items-center gap-2 border-slate-200 dark:border-slate-800"
                    >
                        {isImporting ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
                        <span>Import from Notion</span>
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                        <Plus size={20} />
                        <span>New Task</span>
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {tasks.map((task) => {
                    const overdue = isOverdue(task.dueDate, task.status);
                    return (
                        <Card key={task.id} className={`!p-4 border-l-4 transition-all ${task.status === 'Completed' ? 'border-l-green-500 opacity-75' :
                            overdue ? 'border-l-red-500 bg-red-50/10 dark:bg-red-900/10' : 'border-l-primary-500'
                            }`}>
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        className={`mt-1 transition-colors ${task.status === 'Completed' ? 'text-green-500' : 'text-slate-300 hover:text-primary-500'
                                            }`}
                                    >
                                        {task.status === 'Completed' ? <CheckCircle size={22} fill="currentColor" className="text-white bg-green-500 rounded-full" /> : <Circle size={22} />}
                                    </button>

                                    <div className="flex-1">
                                        <h3 className={`font-semibold text-slate-800 dark:text-slate-200 ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                <Book size={12} />
                                                <span>{getModuleName(task.moduleId)}</span>
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-xs font-medium ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                <Calendar size={12} />
                                                <span>Due: {task.dueDate || 'No date'}</span>
                                                {overdue && (
                                                    <span className="flex items-center gap-1 bg-red-100 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">
                                                        <AlertCircle size={10} /> Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="ghost" onClick={() => handleDelete(task.id)} className="!p-2 text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    );
                })}
                {tasks.length === 0 && !loading && (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <CheckCircle size={40} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">All caught up!</p>
                        <p className="text-slate-400 text-sm">You have no pending tasks to display.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add New Task"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>Create Task</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Task Title"
                        placeholder="e.g. Complete Project Implementation"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700">Associated Module</label>
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
                        label="Due Date"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                </form>
            </Modal>
        </Layout>
    );
};

export default Tasks;
