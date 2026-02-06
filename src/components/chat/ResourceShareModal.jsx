import { useState, useEffect } from 'react';
import { X, FileText, Brain, Youtube, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import api from '../../services/api';

const ResourceShareModal = ({ isOpen, onClose, onShare }) => {
    const [activeTab, setActiveTab] = useState('notes');
    const [notes, setNotes] = useState([]);
    const [flashcards, setFlashcards] = useState([]);
    const [tutorials, setTutorials] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch resources
    useEffect(() => {
        if (!isOpen) return;

        const fetchResources = async () => {
            setLoading(true);
            try {
                const [notesRes, flashcardsRes, tutorialsRes] = await Promise.all([
                    api.get('/notes'),
                    api.get('/flashcardDecks'),
                    api.get('/tutorials')
                ]);

                setNotes(notesRes.data);
                setFlashcards(flashcardsRes.data);
                setTutorials(tutorialsRes.data);
            } catch (error) {
                console.error('Error fetching resources:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, [isOpen]);

    const handleShare = (resource, type) => {
        const sharedResource = {
            type,
            resourceId: resource.id,
            title: resource.title || resource.name,
            preview: resource.content?.substring(0, 100) || resource.description?.substring(0, 100) || ''
        };
        onShare(sharedResource);
        onClose();
    };

    const filterResources = (resources) => {
        if (!searchQuery) return resources;
        return resources.filter(r =>
            (r.title || r.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const tabs = [
        { id: 'notes', label: 'Notes', icon: FileText, data: notes },
        { id: 'flashcards', label: 'Flashcards', icon: Brain, data: flashcards },
        { id: 'tutorials', label: 'Tutorials', icon: Youtube, data: tutorials }
    ];

    const activeData = tabs.find(t => t.id === activeTab)?.data || [];
    const filteredData = filterResources(activeData);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Resource" size="large">
            <div className="space-y-4">
                {/* Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 font-medium transition-all ${activeTab === tab.id
                                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {tab.data.length}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <Input
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={Search}
                />

                {/* Resource List */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p>No {activeTab} found</p>
                            {searchQuery && <p className="text-sm mt-1">Try a different search term</p>}
                        </div>
                    ) : (
                        filteredData.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                type={activeTab}
                                onShare={() => handleShare(resource, activeTab.slice(0, -1))} // Remove 's' from type
                            />
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};

// Resource Card Component
const ResourceCard = ({ resource, type, onShare }) => {
    const getIcon = () => {
        switch (type) {
            case 'notes':
                return <FileText size={16} className="text-teal-500" />;
            case 'flashcards':
                return <Brain size={16} className="text-fuchsia-500" />;
            case 'tutorials':
                return <Youtube size={16} className="text-red-500" />;
            default:
                return null;
        }
    };

    const getPreview = () => {
        if (type === 'notes') {
            return resource.content?.substring(0, 80) || 'No content';
        } else if (type === 'flashcards') {
            const cardCount = resource.cards?.length || 0;
            return `${cardCount} card${cardCount !== 1 ? 's' : ''}`;
        } else if (type === 'tutorials') {
            return resource.topic || resource.description?.substring(0, 80) || 'No description';
        }
        return '';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
            onClick={onShare}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {getIcon()}
                        <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                            {resource.title || resource.name}
                        </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {getPreview()}
                    </p>
                </div>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                    }}
                    variant="primary"
                    className="text-xs px-3 py-1 flex-shrink-0"
                >
                    Share
                </Button>
            </div>
        </motion.div>
    );
};

export default ResourceShareModal;
