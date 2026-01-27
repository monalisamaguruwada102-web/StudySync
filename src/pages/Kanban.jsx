import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { taskService, moduleService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    MoreVertical,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Trash2
} from 'lucide-react';

const Kanban = () => {
    const { data: tasks, refresh: refreshTasks } = useFirestore(taskService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const { refreshAuth } = useAuth();

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [formData, setFormData] = useState({
        title: '',
        moduleId: '',
        dueDate: '',
        description: '',
        subtasks: []
    });

    const columns = [
        { id: 'Pending', title: 'To Do', color: 'border-t-slate-400' },
        { id: 'In Progress', title: 'Doing', color: 'border-t-primary-500' },
        { id: 'Completed', title: 'Done', color: 'border-t-green-500' }
    ];

    const onDragStart = (e, taskId) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = async (e, newStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
            await taskService.update(taskId, { status: newStatus });
            await refreshTasks();
            await refreshAuth();
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        await taskService.add({
            ...formData,
            status: selectedStatus,
            subtasks: formData.subtasks || []
        });
        await refreshTasks();
        await refreshAuth();
        setIsTaskModalOpen(false);
        setFormData({ title: '', moduleId: '', dueDate: '', description: '', subtasks: [] });
    };

    const toggleSubtask = async (task, subtaskIndex) => {
        const newSubtasks = [...(task.subtasks || [])];
        newSubtasks[subtaskIndex].completed = !newSubtasks[subtaskIndex].completed;
        await taskService.update(task.id, { subtasks: newSubtasks });
        await refreshTasks();
    };

    const addSubtaskField = () => {
        setFormData({
            ...formData,
            subtasks: [...(formData.subtasks || []), { title: '', completed: false }]
        });
    };

    const updateSubtaskField = (index, value) => {
        const newSubtasks = [...formData.subtasks];
        newSubtasks[index].title = value;
        setFormData({ ...formData, subtasks: newSubtasks });
    };

    const deleteTask = async (id) => {
        if (window.confirm('Delete this task?')) {
            await taskService.delete(id);
            await refreshTasks();
        }
    };

    return (
        <Layout title="Project Kanban">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Task Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Organize your IT projects with drag & drop efficiency.</p>
                </div>
                <Button onClick={() => { setSelectedStatus('Pending'); setIsTaskModalOpen(true); }} className="flex items-center gap-2">
                    <Plus size={20} />
                    <span>New Task</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
                {columns.map(col => (
                    <div
                        key={col.id}
                        className={`flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 ${col.color} border-t-4`}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, col.id)}
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">{col.title}</h3>
                            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-400 shadow-sm">
                                {tasks.filter(t => t.status === col.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                            {tasks.filter(t => t.status === col.id).map(task => (
                                <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => onDragStart(e, task.id)}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 group cursor-grab active:cursor-grabbing hover:border-primary-300 dark:hover:border-primary-500 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary-500 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded">
                                            {modules.find(m => m.id === task.moduleId)?.name?.split(' ')[0] || 'Task'}
                                        </div>
                                        <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h4 className={`text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 ${task.status === 'Completed' ? 'line-through opacity-50' : ''}`}>
                                        {task.title}
                                    </h4>

                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mt-3 space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                            {task.subtasks.map((st, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-[10px]" onClick={(e) => { e.stopPropagation(); toggleSubtask(task, idx); }}>
                                                    {st.completed ? <CheckCircle2 size={12} className="text-green-500" /> : <Circle size={12} className="text-slate-300" />}
                                                    <span className={`dark:text-slate-400 ${st.completed ? 'line-through opacity-50' : 'text-slate-600'}`}>{st.title}</span>
                                                </div>
                                            ))}
                                            <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-2">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full"
                                                    style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-4 text-[10px] text-slate-400 font-medium">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            <span>{task.dueDate}</span>
                                        </div>
                                        <GripVertical size={12} className="text-slate-200 group-hover:text-slate-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                title="Create Advanced Task"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddTask}>Create Task</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Task Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
                            <select
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
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
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Sub-tasks (Nesting)</label>
                            <button type="button" onClick={addSubtaskField} className="text-xs text-primary-600 font-bold hover:underline">+ Add</button>
                        </div>
                        {formData.subtasks.map((st, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-primary-500 dark:text-slate-100"
                                    placeholder="Enter sub-task step..."
                                    value={st.title}
                                    onChange={(e) => updateSubtaskField(idx, e.target.value)}
                                />
                                <button type="button" onClick={() => {
                                    const next = [...formData.subtasks];
                                    next.splice(idx, 1);
                                    setFormData({ ...formData, subtasks: next });
                                }} className="text-slate-400 hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Kanban;
