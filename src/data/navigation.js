import {
    LayoutDashboard,
    Activity,
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
    Zap,
    Users,
    Trophy,
    Database,
    Star,
    Youtube,
    MessageCircle,
    Info,
    Mail,
    Shield,
    Newspaper,
    Code2,
    ShoppingBag,
    Swords,
    Award,
    Target,
    HardDrive,
    Rocket,
    LayoutGrid,
    Volume2
} from 'lucide-react';

export const navGroups = [
    {
        title: "Strategic Overview",
        items: [
            { icon: LayoutGrid, label: 'Dashboard', path: '/analytics', gradient: 'from-blue-500 to-indigo-600' },
            { icon: Target, label: 'Command Center', path: '/command-center', gradient: 'from-rose-500 to-orange-500' },
            { icon: BookOpen, label: 'Academy Commons', path: '/commons', gradient: 'from-emerald-500 to-teal-600' },
        ]
    },
    {
        title: "Academy Ops",
        items: [
            { icon: BookOpen, label: 'Modules', path: '/modules', gradient: 'from-purple-500 to-pink-500' },
            { icon: FileText, label: 'Notes', path: '/notes', gradient: 'from-teal-500 to-cyan-500' },
            { icon: HardDrive, label: 'The Vault', path: '/vault', gradient: 'from-slate-700 to-slate-900' },
            { icon: Rocket, label: 'Blueprints', path: '/blueprints', gradient: 'from-indigo-600 to-blue-700' },
            { icon: Code2, label: 'Code Sandbox', path: '/sandbox', gradient: 'from-emerald-500 to-teal-500' },
        ]
    },
    {
        title: "Personal Growth",
        items: [
            { icon: Award, label: 'Focus Guardians', path: '/guardians', gradient: 'from-primary-500 to-indigo-500' },
            { icon: GraduationCap, label: 'Ultimate Portfolio', path: '/portfolio', gradient: 'from-purple-600 to-pink-600' },
            { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', gradient: 'from-orange-500 to-yellow-500' },
        ]
    },
    {
        title: "Social & Competitive",
        items: [
            { icon: Users, label: 'Sync-Rooms', path: '/sync-rooms', gradient: 'from-purple-500 to-indigo-600' },
            { icon: Swords, label: 'Knowledge Duels', path: '/duels', gradient: 'from-rose-500 to-red-600' },
            { icon: MessageCircle, label: 'Global Chat', path: '/chat', gradient: 'from-blue-500 to-sky-500' },
            { icon: Users, label: 'Study Groups', path: '/groups', gradient: 'from-blue-500 to-indigo-500' },
        ]
    },
    {
        title: "Focus Arsenal",
        items: [
            { icon: Zap, label: 'Deep Focus', path: '/focus', gradient: 'from-yellow-500 to-orange-500' },
            { icon: Volume2, label: 'Sonic Studio', path: '/focus', gradient: 'from-indigo-400 to-blue-500' },
            { icon: Brain, label: 'Flashcards', path: '/flashcards', gradient: 'from-fuchsia-500 to-pink-500' },
        ]
    },
    {
        title: "Intel & Analytics",
        items: [
            { icon: History, label: 'Study Logs', path: '/logs', gradient: 'from-green-500 to-emerald-500' },
            { icon: TrendingUp, label: 'Performance', path: '/deep-analytics', gradient: 'from-indigo-500 to-purple-500' },
            { icon: Database, label: 'Knowledge Graph', path: '/knowledge-graph', gradient: 'from-cyan-500 to-blue-500' },
        ]
    },
    {
        title: "Economy",
        items: [
            { icon: ShoppingBag, label: 'Sync-Market', path: '/marketplace', gradient: 'from-yellow-400 to-orange-500' },
        ]
    },
    {
        title: "System",
        items: [
            { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-slate-500 to-gray-500' },
            { icon: Info, label: 'About', path: '/about', gradient: 'from-blue-400 to-indigo-500' },
            { icon: Shield, label: 'Privacy', path: '/privacy', gradient: 'from-slate-600 to-slate-800' },
        ]
    }
];
