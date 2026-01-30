import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { calendarService, studyLogService, taskService, moduleService } from '../services/firestoreService';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Plus,
    Clock,
    CheckSquare,
    Target,
    Cloud,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO
} from 'date-fns';

const Calendar = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: events, refresh: refreshEvents } = useFirestore(calendarService.getAll);
    const { data: logs } = useFirestore(studyLogService.getAll);
    const { data: tasks } = useFirestore(taskService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [externalEvents, setExternalEvents] = useState([]);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchExternalEvents = async () => {
        try {
            // Try to get URL from API settings first
            const settingsRes = await axios.get('http://localhost:3001/api/user/settings', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const url = settingsRes.data.calendar_sync_url;

            if (!url) return;

            setIsSyncing(true);
            const response = await axios.post('http://localhost:3001/api/sync/calendar', { url }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setExternalEvents(response.data);
        } catch (error) {
            console.error('Failed to sync external calendar:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    React.useEffect(() => {
        fetchExternalEvents();
    }, []);

    const [eventForm, setEventForm] = useState({
        title: '',
        moduleId: '',
        startTime: '09:00',
        endTime: '10:00',
        description: ''
    });

    const renderHeader = () => {
        return (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{format(currentMonth, 'MMMM yyyy')}</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Schedule your study sessions and track progress.</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <div className="flex bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm shrink-0">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                            onClick={() => setCurrentMonth(new Date())}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-x border-slate-100 dark:border-slate-700"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={fetchExternalEvents}
                        disabled={isSyncing}
                        className="flex items-center gap-2 border-slate-200 dark:border-slate-800 shrink-0"
                    >
                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Sync Cloud</span>
                    </Button>
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                        <Plus size={20} />
                        <span>Schedule</span>
                    </Button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-[10px] uppercase font-black text-slate-400 tracking-widest">{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const formattedDate = format(day, 'd');
                const cloneDay = day;

                // Get events for this day
                const dayLogs = logs.filter(l => isSameDay(parseISO(l.date), cloneDay));
                const dayTasks = tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), cloneDay));
                const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), cloneDay));
                const dayExternal = externalEvents.filter(e => isSameDay(parseISO(e.start), cloneDay));

                const hasContent = dayLogs.length > 0 || dayTasks.length > 0 || dayEvents.length > 0 || dayExternal.length > 0;

                days.push(
                    <div
                        key={day}
                        className={`min-h-[80px] md:min-h-[120px] p-1 md:p-2 border border-slate-50 dark:border-slate-800 transition-all cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!isSameMonth(day, monthStart) ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-30 pointer-events-none' : ''
                            } ${isSameDay(day, new Date()) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                        onClick={() => setSelectedDate(cloneDay)}
                    >
                        <div className="flex justify-between items-start mb-1 md:mb-2">
                            <span className={`text-xs md:text-sm font-bold ${isSameDay(day, new Date()) ? 'bg-primary-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
                                {formattedDate}
                            </span>
                        </div>

                        {/* Mobile View: Dots for content */}
                        <div className="flex gap-1 md:hidden flex-wrap">
                            {dayLogs.map(log => <div key={log.id} className="w-1.5 h-1.5 rounded-full bg-green-500" />)}
                            {dayTasks.map(task => <div key={task.id} className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-slate-400' : 'bg-orange-500'}`} />)}
                            {dayEvents.map(event => <div key={event.id} className="w-1.5 h-1.5 rounded-full bg-primary-500" />)}
                            {dayExternal.map(ext => <div key={ext.id} className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />)}
                        </div>

                        {/* Desktop View: Full Content */}
                        <div className="hidden md:block space-y-1">
                            {dayLogs.map(log => (
                                <div key={log.id} className="text-[10px] p-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-800 truncate" title={`Log: ${log.topic}`}>
                                    📚 {log.hours}h: {log.topic}
                                </div>
                            ))}
                            {dayTasks.map(task => (
                                <div key={task.id} className={`text-[10px] p-1 rounded border truncate ${task.status === 'Completed' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800'}`} title={`Task: ${task.title}`}>
                                    ✅ {task.title}
                                </div>
                            ))}
                            {dayEvents.map(event => (
                                <div key={event.id} className="text-[10px] p-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded border border-primary-200 dark:border-primary-800 truncate" title={`Event: ${event.title}`}>
                                    ⏰ {event.startTime}: {event.title}
                                </div>
                            ))}
                            {dayExternal.map(ext => (
                                <div key={ext.id} className="text-[10px] p-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-900/50 truncate flex items-center gap-1 font-medium" title={`Cloud: ${ext.title}`}>
                                    <Cloud size={10} className="shrink-0" /> {ext.title}
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7" key={day}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">{rows}</div>;
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        await calendarService.add({
            ...eventForm,
            date: selectedDate.toISOString(),
        });
        await refreshEvents();
        setIsModalOpen(false);
        setEventForm({ title: '', moduleId: '', startTime: '09:00', endTime: '10:00', description: '' });
    };

    return (
        <Layout title="Visual Study Calendar">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Schedule Session for ${format(selectedDate, 'PP')}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddEvent}>Schedule Session</Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Session Title"
                        placeholder="e.g. Exam Prep: Unit 3"
                        value={eventForm.title}
                        onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Module</label>
                        <select
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                            value={eventForm.moduleId}
                            onChange={(e) => setEventForm({ ...eventForm, moduleId: e.target.value })}
                            required
                        >
                            <option value="">Select a module</option>
                            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Time"
                            type="time"
                            value={eventForm.startTime}
                            onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                            required
                        />
                        <Input
                            label="End Time"
                            type="time"
                            value={eventForm.endTime}
                            onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Objectives</label>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100 min-h-[100px]"
                            value={eventForm.description}
                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Calendar;
