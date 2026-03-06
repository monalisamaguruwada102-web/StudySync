import {
    LayoutDashboard,
    CheckSquare,
    Timer,
    BarChart3,
    BookOpen,
    Users,
    MessageSquare,
    Sparkles,
    Award,
    Music,
    Terminal,
    ShoppingBag,
    Map,
    Swords,
    Heart,
    Backpack,
    Shield,
    FileText,
    Zap,
    Target
} from 'lucide-react';

export const navGroups = [
    {
        title: 'Overview',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'primary' }
        ]
    },
    {
        title: 'Study Zone',
        items: [
            { path: '/tasks', label: 'Tasks', icon: CheckSquare, color: 'emerald' },
            { path: '/timer', label: 'Focus Timer', icon: Timer, color: 'rose' },
            { path: '/ai-chat', label: 'AI Study Chat', icon: Sparkles, color: 'indigo' },
            { path: '/flashcards', label: 'Flashcards', icon: BookOpen, color: 'amber' }
        ]
    },
    {
        title: 'Analytics',
        items: [
            { path: '/stats', label: 'Performance', icon: BarChart3, color: 'blue' },
            { path: '/goals', label: 'Goals', icon: Target, color: 'violet' }
        ]
    },
    {
        title: 'Community',
        items: [
            { path: '/communities', label: 'Study Groups', icon: Users, color: 'cyan' },
            { path: '/messages', label: 'Messages', icon: MessageSquare, color: 'primary' }
        ]
    },
    {
        title: 'Premium Hub',
        isPremium: true,
        items: [
            { path: '/focus', label: 'Sonic Studio', icon: Music, color: 'rose', description: 'Ambient sound mixer' },
            { path: '/command-center', label: 'Command Center', icon: Terminal, color: 'slate', description: 'Deadline overview' },
            { path: '/marketplace', label: 'Sync-Market', icon: ShoppingBag, color: 'amber', description: 'In-app shop' },
            { path: '/dashboard', label: 'Milestone Map', icon: Map, color: 'emerald', description: 'Visual progress' },
            { path: '/sync-rooms', label: 'Sync-Rooms', icon: Users, color: 'indigo', description: 'Collaborative study' },
            { path: '/duels', label: 'Knowledge Duels', icon: Swords, color: 'rose', description: '1v1 Focus battles' },
            { path: '/guardians', label: 'Focus Guardian', icon: Heart, color: 'pink', description: 'Digital study pet' },
            { path: '/commons', label: 'Academy Commons', icon: BookOpen, color: 'primary', description: 'Resource sharing' },
            { path: '/vault', label: 'The Vault', icon: Shield, color: 'slate', description: 'Secure file storage' },
            { path: '/blueprints', label: 'Blueprints', icon: Zap, color: 'yellow', description: 'Subject kits' },
            { path: '/portfolio', label: 'Ultimate Portfolio', icon: FileText, color: 'indigo', description: 'PDF Performance export' }
        ]
    }
];
