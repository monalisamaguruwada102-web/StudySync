import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { tutorialService, moduleService } from '../services/firestoreService';
import api from '../services/api';
import { Plus, Youtube, Trash2, Book, ExternalLink, Search, LayoutDashboard, Play, Share2, VideoOff, Globe } from 'lucide-react';
import ShareToChatModal from '../components/ui/ShareToChatModal';
import { useNotification } from '../context/NotificationContext';

const Tutorials = () => {
    const { showToast, confirm } = useNotification();
    const { data: tutorials, loading, refresh } = useFirestore(tutorialService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [playingId, setPlayingId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [tutorialToShare, setTutorialToShare] = useState(null);
    const [searchParams] = useSearchParams();
    const { id: pathId } = useParams();
    const navigate = useNavigate();
    const [sharedTutorial, setSharedTutorial] = useState(null);
    const [sharedTutorialLoading, setSharedTutorialLoading] = useState(false);
    const [sharedTutorialError, setSharedTutorialError] = useState(null);
    const [formData, setFormData] = useState({
        url: '',
        title: '',
        moduleId: '',
        topic: '',
        description: ''
    });

    // Extract YouTube video ID from URL (supports Shorts, watch, embed, and shortened URLs)
    const getYouTubeId = (url) => {
        if (!url) return null;
        // Handle potential object if url is passed from a field that might be an object
        const urlStr = typeof url === 'string' ? url : (url.url || url.youtubeUrl || '');
        if (!urlStr) return null;

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = urlStr.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getThumbnail = (videoId) =>
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const videoId = getYouTubeId(formData.url);
            if (!videoId) {
                showToast('Please enter a valid YouTube URL', 'warning');
                return;
            }

            const tutorialData = {
                ...formData,
                videoId,
                thumbnail: getThumbnail(videoId),
                moduleId: formData.moduleId || null,
                createdAt: new Date().toISOString()
            };

            await tutorialService.add(tutorialData);
            await refresh();
            setIsModalOpen(false);
            setFormData({ url: '', title: '', moduleId: '', topic: '', description: '' });
            showToast('Tutorial added successfully', 'success');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Tutorial',
            message: 'Are you sure you want to delete this tutorial?',
            type: 'warning',
            confirmLabel: 'Delete'
        });
        if (isConfirmed) {
            await tutorialService.delete(id);
            await refresh();
            showToast('Tutorial deleted', 'info');
        }
    };

    const getModuleName = (id) => modules.find(m => m.id === id)?.name || 'General';

    // Filter tutorials
    const filteredTutorials = tutorials.filter(tutorial => {
        const matchesSearch = tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tutorial.topic.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesModule = !filterModule || tutorial.moduleId === filterModule;
        return matchesSearch && matchesModule;
    });

    const handleCopyExternalLink = async (tutorial) => {
        try {
            // 1. Toggle public state if not already public (or just ensure it's public)
            // We'll use the toggle endpoint. If we want to ONLY make it public, we might need a dedicated endpoint,
            // but for now, we'll assume the user wants to share it, so we ensure it's public.
            // Actually, let's just use the toggle endpoint to FLIP it if they click a specific "Toggle" button,
            // but for "Copy Link", we should probably ensure it IS public.
            // Let's stick to the plan: "Share Externally" button toggles public visibility.

            // Call API to ensure it's public (or toggle)
            const response = await api.post(`/public/tutorials/${tutorial.id}/toggle`);
            if (response.data.isPublic) {
                const url = `${window.location.origin}/share/tutorials/${tutorial.id}`;
                const shareText = `Check out this tutorial on StudySync: ${tutorial.title}\n${url}`;
                await navigator.clipboard.writeText(shareText);
                showToast('Link copied & made public!', 'success');
            } else {
                showToast('Tutorial is now private.', 'info');
            }
            await refresh(); // Refresh to show new UI state if we add badges
        } catch (error) {
            console.error('Failed to share:', error);
            showToast('Failed to generate share link', 'error');
        }
    };

    // Shared Tutorial Effect
    useEffect(() => {
        const tutorialId = pathId || searchParams.get('id');
        if (tutorialId) {
            const existing = tutorials.find(t => t.id === tutorialId);
            if (existing) {
                setSharedTutorial(existing);
                document.title = `StudySync - ${existing.title}`;
            } else {
                setSharedTutorialLoading(true);
                setSharedTutorialError(null);
                import('../services/api').then(api => {
                    api.default.get(`/tutorials/shared/${tutorialId}`)
                        .then(res => {
                            setSharedTutorial(res.data);
                            document.title = `StudySync - ${res.data.title}`;
                        })
                        .catch(err => {
                            console.error('Failed to fetch shared tutorial:', err);
                            setSharedTutorialError('Shared tutorial not found or you do not have permission to view it.');
                        })
                        .finally(() => setSharedTutorialLoading(false));
                });
            }
        } else {
            setSharedTutorial(null);
            setSharedTutorialError(null);
            document.title = 'StudySync - Tutorials';
        }
    }, [pathId, searchParams, tutorials]);

    return (
        <Layout title={sharedTutorial ? `Shared Tutorial: ${sharedTutorial.title}` : "Video Tutorials"}>
            <div className="space-y-6">
                {/* Header */}
                {!sharedTutorial && (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <a href="/" className="p-2 text-slate-400 hover:text-primary-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all" title="Back to Dashboard">
                                <LayoutDashboard size={24} />
                            </a>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Video Tutorials</h1>
                                <p className="text-slate-500 dark:text-slate-400">Curated YouTube learning resources</p>
                            </div>
                        </div>
                        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                            <Plus size={20} />
                            <span>Add Tutorial</span>
                        </Button>
                    </div>
                )}

                {/* Filters */}
                {!sharedTutorial && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tutorials..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                            />
                        </div>
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                        >
                            <option value="">All Modules</option>
                            {modules && modules.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Tutorial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sharedTutorialLoading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
                            <p className="text-slate-500 font-medium">Fetching shared tutorial...</p>
                        </div>
                    ) : sharedTutorialError ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                                <VideoOff size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Unavailable</h3>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md text-center mb-6">{sharedTutorialError}</p>
                            <Button onClick={() => navigate('/tutorials')} variant="secondary">Back to Tutorials</Button>
                        </div>
                    ) : sharedTutorial ? (
                        <div className="col-span-full flex flex-col gap-6">
                            <Card className="max-w-4xl mx-auto w-full overflow-hidden bg-white dark:bg-slate-900 shadow-2xl rounded-3xl border-none">
                                <div className="aspect-video w-full bg-black">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${sharedTutorial.videoId || getYouTubeId(sharedTutorial.url || sharedTutorial.youtubeUrl)}?autoplay=1&rel=0`}
                                        title={sharedTutorial.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-[10px] uppercase font-black tracking-wider text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                                            <Book size={10} />
                                            <span>{getModuleName(sharedTutorial.moduleId)}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md flex items-center gap-1">
                                            <ExternalLink size={10} /> Shared Resource
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4 leading-tight">{sharedTutorial.title}</h2>
                                    {sharedTutorial.topic && (
                                        <p className="text-lg font-bold text-primary-500 mb-4">{sharedTutorial.topic}</p>
                                    )}
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg mb-8">{sharedTutorial.description}</p>
                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                                        <Button
                                            variant="ghost"
                                            className="w-full h-14 text-slate-400 hover:text-primary-500 text-lg font-bold"
                                            onClick={() => navigate('/tutorials')}
                                        >
                                            Back to Tutorials Library
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        filteredTutorials.map((tutorial) => {
                            const videoId = tutorial.videoId || getYouTubeId(tutorial.url || tutorial.youtubeUrl);
                            const isPlaying = playingId === tutorial.id;

                            return (
                                <Card key={tutorial.id} className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-slate-900/50">
                                    {/* YouTube Player Area */}
                                    <div className="aspect-video bg-black relative group overflow-hidden">
                                        {isPlaying ? (
                                            <iframe
                                                className="w-full h-full"
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&origin=${window.location.origin}`}
                                                title={tutorial.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <div
                                                className="absolute inset-0 cursor-pointer overflow-hidden group/thumb"
                                                onClick={() => setPlayingId(tutorial.id)}
                                            >
                                                <img
                                                    src={tutorial.thumbnail || getThumbnail(videoId)}
                                                    alt={tutorial.title}
                                                    className="w-full h-full object-cover opacity-80 group-hover/thumb:scale-105 transition-transform duration-500"
                                                />
                                                {/* Play Overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/40 transition-colors">
                                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover/thumb:scale-110 transition-transform duration-300">
                                                        <Play size={24} fill="white" className="text-white ml-1" />
                                                    </div>
                                                </div>
                                                {/* Glassmorphism Badge */}
                                                <div className="absolute bottom-4 left-4 right-4 p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-xl">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest text-center opacity-80">Click to Play Tutorial</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                                <Book size={10} />
                                                <span>{getModuleName(tutorial.moduleId)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setTutorialToShare({ ...tutorial, type: 'tutorial' });
                                                        setShowShareModal(true);
                                                    }}
                                                    className="!p-1.5 text-slate-400 hover:text-emerald-500"
                                                    title="Share to Chat"
                                                >
                                                    <Share2 size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleCopyExternalLink(tutorial)}
                                                    className={`!p-1.5 ${tutorial.isPublic ? 'text-primary-500 bg-primary-50' : 'text-slate-400 hover:text-blue-500'}`}
                                                    title={tutorial.isPublic ? "Public (Click to toggle)" : "Share Externally"}
                                                >
                                                    <Globe size={14} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleDelete(tutorial.id)}
                                                    className="!p-1.5 text-slate-400 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 line-clamp-2">
                                            {tutorial.title}
                                        </h3>

                                        {tutorial.topic && (
                                            <div className="flex items-center gap-1 mb-2">
                                                <Youtube size={12} className="text-red-500" />
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                    {tutorial.topic}
                                                </span>
                                            </div>
                                        )}

                                        {tutorial.description && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 flex-1">
                                                {tutorial.description}
                                            </p>
                                        )}

                                        <a
                                            href={tutorial.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 flex items-center gap-2 text-primary-600 text-xs font-semibold hover:underline"
                                        >
                                            <ExternalLink size={12} />
                                            Watch on YouTube
                                        </a>
                                    </div>
                                </Card>
                            );
                        })
                    )}

                    {filteredTutorials.length === 0 && !loading && (
                        <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Youtube size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                {searchQuery || filterModule ? 'No tutorials found' : 'No tutorials yet'}
                            </h3>
                            <p className="text-slate-400 dark:text-slate-500">
                                {searchQuery || filterModule ? 'Try adjusting your filters' : 'Add YouTube tutorials to build your library'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Tutorial Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Add YouTube Tutorial"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            Save Tutorial
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="YouTube URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        required
                    />

                    {/* Video Preview */}
                    {getYouTubeId(formData.url) && (
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden">
                            <iframe
                                className="w-full h-full"
                                src={`https://www.youtube.com/embed/${getYouTubeId(formData.url)}`}
                                title="Preview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}

                    <Input
                        label="Title"
                        placeholder="e.g. React Hooks Tutorial"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Module (Optional)</label>
                        <select
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                            value={formData.moduleId}
                            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                        >
                            <option value="">No Module (General)</option>
                            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>

                    <Input
                        label="Topic"
                        placeholder="e.g. React Fundamentals"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100 min-h-[80px]"
                            placeholder="Brief notes about this tutorial..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>
            <ShareToChatModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                resource={tutorialToShare}
            />
        </div>
        </Layout >
    );
};

export default Tutorials;
