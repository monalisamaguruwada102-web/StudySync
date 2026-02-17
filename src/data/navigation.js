import {
    LayoutDashboard,
    BookOpen,
    History,
    CheckSquare,
    FileText,
    TrendingUp,
    GraduationCap,
    Calculator,
    Brain,
    CalendarDays,
    Settings,
    Columns,
    Activity,
    Zap,
    Users,
    Database,
    Star,
    Youtube,
    MessageCircle,
    Info,
    Mail,
    Shield,
    Newspaper
} from 'lucide-react';

export const navGroups = [
    {
        title: "Overview",
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/', gradient: 'from-blue-500 to-cyan-500' },
            { icon: CalendarDays, label: 'Calendar', path: '/calendar', gradient: 'from-blue-500 to-indigo-500' },
            { icon: Columns, label: 'Kanban', path: '/kanban', gradient: 'from-orange-500 to-red-500' },
        ]
    },
    {
        title: "Study Zone",
        items: [
            { icon: BookOpen, label: 'Modules', path: '/modules', gradient: 'from-purple-500 to-pink-500' },
            { icon: Youtube, label: 'Tutorials', path: '/tutorials', gradient: 'from-red-500 to-pink-500' },
            { icon: Brain, label: 'Flashcards', path: '/flashcards', gradient: 'from-fuchsia-500 to-pink-500' },
            { icon: FileText, label: 'Notes', path: '/notes', gradient: 'from-teal-500 to-cyan-500' },
            { icon: MessageCircle, label: 'Chat', path: '/chat', gradient: 'from-blue-500 to-sky-500' },
            { icon: Zap, label: 'Deep Focus', path: '/focus', gradient: 'from-yellow-500 to-orange-500' },
        ]
    },
    {
        title: "Analytics",
        items: [
            { icon: History, label: 'Study Logs', path: '/logs', gradient: 'from-green-500 to-emerald-500' },
            { icon: Calculator, label: 'Grades', path: '/grades', gradient: 'from-violet-500 to-purple-500' },
            { icon: Activity, label: 'Deep Analytics', path: '/deep-analytics', gradient: 'from-indigo-500 to-purple-500' },
            { icon: TrendingUp, label: 'Analytics', path: '/analytics', gradient: 'from-emerald-500 to-teal-500' },
        ]
    },
    {
        title: "Visual Map",
        items: [
            { icon: Database, label: 'Knowledge Graph', path: '/knowledge-graph', gradient: 'from-cyan-500 to-blue-500' },
        ]
    },
    {
        title: "Resources & Info",
        items: [
            { icon: Newspaper, label: 'Articles', path: '/articles', gradient: 'from-orange-500 to-pink-500' },
            { icon: Info, label: 'About', path: '/about', gradient: 'from-blue-400 to-indigo-500' },
            { icon: Mail, label: 'Contact', path: '/contact', gradient: 'from-emerald-400 to-teal-500' },
            { icon: Shield, label: 'Privacy', path: '/privacy', gradient: 'from-slate-600 to-slate-800' },
        ]
    },
    {
        title: "System",
        items: [
            { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-slate-500 to-gray-500' },
        ]
    }
];
