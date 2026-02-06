import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { tutorialService, moduleService } from '../services/firestoreService';
import { Plus, Youtube, Trash2, Book, ExternalLink, Search, LayoutDashboard, Play } from 'lucide-react';

const Tutorials = () => {
    const { data: tutorials, loading, refresh } = useFirestore(tutorialService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [playingId, setPlayingId] = useState(null);
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
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)\?v=|(&v=)|(shorts\/))([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[9].length === 11) ? match[9] : null;
    };

    const getThumbnail = (videoId) =>
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const videoId = getYouTubeId(formData.url);
            if (!videoId) {
                alert('Please enter a valid YouTube URL');
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
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this tutorial?')) {
            await tutorialService.delete(id);
            await refresh();
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

    return (
        <Layout title="Video Tutorials">
            <div className="space-y-6">
                {/* Header */}
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

                {/* Filters */}
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
                        {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                {/* Tutorial Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTutorials.map((tutorial) => {
                        const videoId = tutorial.videoId || getYouTubeId(tutorial.url);
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
                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDelete(tutorial.id)}
                                            className="!p-1.5 text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
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
                    })}

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
        </Layout>
    );
};

export default Tutorials;
