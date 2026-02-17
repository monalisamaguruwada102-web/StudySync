import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import QuizModal from '../components/ui/QuizModal';
import { useFirestore } from '../hooks/useFirestore';
import { noteService, moduleService } from '../services/firestoreService';
import { Plus, StickyNote, Trash2, Book, ExternalLink, FileText, Code, Play, Sparkles, Wand2, Mic, MicOff, BrainCircuit, Share2, Link } from 'lucide-react';
import aiService from '../services/aiService';
import { supabase } from '../services/supabase';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import ShareToChatModal from '../components/ui/ShareToChatModal';
import { useNotification } from '../context/NotificationContext';

const Notes = () => {
    const { showToast, confirm } = useNotification();
    const { data: notes, loading, refresh } = useFirestore(noteService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [searchParams] = useSearchParams();
    const { id: pathId } = useParams();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [noteToShare, setNoteToShare] = useState(null);
    const [highlightedNoteId, setHighlightedNoteId] = useState(null);
    const [sharedNote, setSharedNote] = useState(null);
    const [sharedNoteLoading, setSharedNoteLoading] = useState(false);
    const [sharedNoteError, setSharedNoteError] = useState(null);

    const getYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url?.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    const [formData, setFormData] = useState({
        title: '',
        moduleId: '',
        content: '',
        resourceLink: '',
        pdfPath: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioEpisodes, setAudioEpisodes] = useState([]);
    const [currentEpisode, setCurrentEpisode] = useState(1);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [recordingChunks, setRecordingChunks] = useState([]);
    const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB

    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording and save final episode
            mediaRecorder.stop();
            setIsRecording(false);
        } else {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('Audio recording is not supported in this browser.', 'warning');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                const chunks = [];

                recorder.ondataavailable = (e) => {
                    chunks.push(e.data);
                    const currentSize = chunks.reduce((acc, chunk) => acc + chunk.size, 0);

                    // Check if we've hit 50MB limit
                    if (currentSize >= MAX_AUDIO_SIZE) {
                        console.log(`Episode ${currentEpisode} reached 50MB, auto-saving...`);

                        // Stop current recording
                        recorder.stop();

                        // Upload current episode
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        uploadEpisode(blob, currentEpisode);

                        // Clear chunks and increment episode
                        chunks.length = 0;
                        setCurrentEpisode(prev => prev + 1);

                        // Restart recording for next episode
                        setTimeout(() => {
                            if (isRecording) {
                                recorder.start();
                            }
                        }, 100);
                    }
                };

                recorder.onstop = async () => {
                    if (chunks.length > 0) {
                        const blob = new Blob(chunks, { type: 'audio/webm' });
                        await uploadEpisode(blob, currentEpisode);
                    }

                    // Stop all tracks to release microphone
                    stream.getTracks().forEach(track => track.stop());
                };

                // Request data every second to monitor size
                recorder.start(1000);
                setMediaRecorder(recorder);
                setIsRecording(true);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                showToast('Could not access microphone. Please check permissions.', 'error');
            }
        }
    };

    const uploadEpisode = async (blob, episodeNum) => {
        try {
            const fileName = `voice_note_ep${episodeNum}_${Date.now()}.webm`;
            const formData = new FormData();
            formData.append('file', blob, fileName);

            const { default: api } = await import('../services/api');
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!response.data.filePath) throw new Error('Failed to get file path from server');

            setAudioEpisodes(prev => [...prev, { episode: episodeNum, url: response.data.filePath }]);
        } catch (error) {
            console.error(`Error uploading episode ${episodeNum}:`, error);
            showToast(`Failed to upload episode ${episodeNum}: ${error.message}`, 'error');
        }
    };

    // Sandbox State
    const [isSandboxOpen, setIsSandboxOpen] = useState(false);
    const [sandboxCode, setSandboxCode] = useState('');
    const [summarizingId, setSummarizingId] = useState(null);

    // Quiz State
    const [quizData, setQuizData] = useState(null);
    const [quizNoteTitle, setQuizNoteTitle] = useState('');
    const [isQuizOpen, setIsQuizOpen] = useState(false);
    const [generatingQuizId, setGeneratingQuizId] = useState(null);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let pdfPath = '';

            // Upload PDF to Supabase Storage if selected
            if (selectedFile) {
                const fileName = `pdf_${Date.now()}_${selectedFile.name}`;
                const { data, error } = await supabase.storage
                    .from('notes-files')
                    .upload(fileName, selectedFile);

                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage
                    .from('notes-files')
                    .getPublicUrl(fileName);
                pdfPath = publicUrl;
            }

            // Convert empty moduleId to null for database
            const noteData = {
                ...formData,
                moduleId: formData.moduleId || null,
                pdfPath,
                audioEpisodes: audioEpisodes.length > 0 ? audioEpisodes : null
            };
            await noteService.add(noteData);
            await refresh();
            setIsModalOpen(false);
            setFormData({ title: '', moduleId: '', content: '', resourceLink: '', pdfPath: '' });
            setSelectedFile(null);
            setAudioEpisodes([]);
            setCurrentEpisode(1);
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: 'Delete Note',
            message: 'Are you sure you want to delete this note?',
            type: 'warning',
            confirmLabel: 'Delete'
        });
        if (isConfirmed) {
            await noteService.delete(id);
            await refresh();
            showToast('Note deleted successfully', 'info');
        }
    };

    const getModuleName = (id) => modules.find(m => m.id === id)?.name || 'General';

    const handleRunCode = (content) => {
        // Simple extraction: remove ``` if they exist
        const code = content.replace(/```(javascript|js|html|css)?/g, '').replace(/```/g, '');
        setSandboxCode(code.trim());
        setIsSandboxOpen(true);
    };

    const handleSummarize = async (note) => {
        setSummarizingId(note.id);
        try {
            const summary = await aiService.summarize(note.content);
            // Append summary to existing content or replace?
            // For this premium feature, we'll append it with a marker
            const newContent = note.content + "\n\n" + summary;
            await noteService.update(note.id, { content: newContent });
            await refresh();
        } catch (error) {
            console.error('AI Summarization failed:', error);
            showToast('AI Assistant is currently unavailable.', 'error');
        } finally {
            setSummarizingId(null);
        }
    };

    const handleGenerateQuiz = async (note) => {
        setGeneratingQuizId(note.id);
        try {
            const quiz = await aiService.generateQuiz(note.content);
            setQuizData(quiz);
            setQuizNoteTitle(note.title);
            setIsQuizOpen(true);
        } catch (error) {
            showToast('Failed to generate quiz. AI Service unavailable.', 'error');
        } finally {
            setGeneratingQuizId(null);
        }
    };

    const handleCopyExternalLink = (note) => {
        const url = `${window.location.origin}/study/share/notes/${note.id}`;
        const shareText = `Check out this note on StudySync: ${note.title}\n${url}`;
        navigator.clipboard.writeText(shareText);
        showToast('External link copied to clipboard!', 'success');
    };

    // Deep Link & Isolation Effect
    useEffect(() => {
        const noteId = pathId || searchParams.get('id');
        if (noteId) {
            setHighlightedNoteId(noteId);

            // Check if note is already in the list
            const existingNote = notes.find(n => n.id === noteId);
            if (existingNote) {
                setSharedNote(existingNote);
                document.title = `StudySync - ${existingNote.title}`;
                const element = document.getElementById(`note-${noteId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            } else {
                // Fetch shared note directly from backend
                setSharedNoteLoading(true);
                setSharedNoteError(null);
                import('../services/api').then(api => {
                    api.default.get(`/notes/shared/${noteId}`)
                        .then(res => {
                            setSharedNote(res.data);
                            document.title = `StudySync - ${res.data.title}`;
                        })
                        .catch(err => {
                            console.error('Failed to fetch shared note:', err);
                            setSharedNoteError('Shared note not found or you do not have permission to view it.');
                        })
                        .finally(() => setSharedNoteLoading(false));
                });
            }
        } else {
            setSharedNote(null);
            setSharedNoteError(null);
            document.title = 'StudySync - Notes';
        }
    }, [pathId, searchParams, notes]);

    return (
        <Layout title={sharedNote ? `Shared Note: ${sharedNote.title}` : "Notes & Resources"}>
            {!sharedNote && (
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">My Library</h2>
                    <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                        <Plus size={20} />
                        Add Note
                    </Button>
                </div>
            )}

            {!sharedNote && (
                <div className="mb-8 p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Book size={18} />
                        </div>
                        <Input
                            placeholder="Search your notes..."
                            className="pl-11 rounded-2xl border-slate-100 dark:border-slate-700 focus:ring-primary-500/10"
                        // Search logic would go here
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {sharedNoteLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
                        <p className="text-slate-500 font-medium">Fetching shared resource...</p>
                    </div>
                ) : sharedNoteError ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Unavailable</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md text-center mb-6">{sharedNoteError}</p>
                        <Button onClick={() => navigate('/notes')} variant="secondary">Back to My Notes</Button>
                    </div>
                ) : sharedNote ? (
                    <Card
                        id={`note-${sharedNote.id}`}
                        className="flex flex-col h-full ring-2 ring-primary-500 shadow-xl shadow-primary-500/10 border-none bg-white dark:bg-slate-900/50"
                    >
                        {/* Note card content here (I need to verify the card content structure) */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-[10px] uppercase font-black tracking-wider text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                                <Book size={10} />
                                <span>{getModuleName(sharedNote.moduleId)}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md flex items-center gap-1">
                                <ExternalLink size={10} /> Shared Resource
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-3">
                            {sharedNote.title}
                        </h3>

                        <div className="flex-1 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed mb-6">
                            {sharedNote.content}
                        </div>

                        {sharedNote.resourceLink && (
                            <div className="mb-4">
                                {getYouTubeId(sharedNote.resourceLink) ? (
                                    <iframe
                                        className="w-full aspect-video rounded-2xl shadow-lg border-2 border-slate-100 dark:border-slate-800"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(sharedNote.resourceLink)}`}
                                        allowFullScreen
                                        title="YouTube video player"
                                    />
                                ) : (
                                    <a
                                        href={sharedNote.resourceLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl group transition-all hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-primary-500/20 shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                                            <ExternalLink size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">Reference Link</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{sharedNote.resourceLink}</p>
                                        </div>
                                    </a>
                                )}
                            </div>
                        )}

                        {sharedNote.pdfPath && (
                            <div className="mb-4">
                                <a
                                    href={sharedNote.pdfPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl group transition-all hover:bg-white dark:hover:bg-emerald-900/30 border border-emerald-100/50 dark:border-emerald-800/50 shadow-sm"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-0.5">Attached PDF</p>
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-200 truncate">View Document</p>
                                    </div>
                                    <ExternalLink size={16} className="text-emerald-400" />
                                </a>
                            </div>
                        )}

                        {sharedNote.audioEpisodes && sharedNote.audioEpisodes.length > 0 && (
                            <div className="space-y-2 mt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Audio Sessions</p>
                                {sharedNote.audioEpisodes.map((ep, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50 group hover:border-primary-500/30 transition-all">
                                        <audio controls src={ep.url} className="h-8 flex-1" />
                                        <span className="text-[10px] font-black text-slate-400 pr-2">EP{ep.episode}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Button
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-primary-500"
                                onClick={() => navigate('/notes')}
                            >
                                Back to My Library
                            </Button>
                        </div>
                    </Card>
                ) : (
                    notes.map((note) => (
                        <Card
                            key={note.id}
                            id={`note-${note.id}`}
                            className={`flex flex-col h-full hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-slate-900/50 shadow-sm hover:-translate-y-1 ${highlightedNoteId === note.id ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f1f5f9] dark:bg-slate-800/80 rounded-lg text-[10px] uppercase font-black tracking-wider text-[#475569] dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
                                    <Book size={10} />
                                    <span>{getModuleName(note.moduleId)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setNoteToShare({ ...note, type: 'note' });
                                            setShowShareModal(true);
                                        }}
                                        className="!p-1.5 text-slate-400 hover:text-emerald-500"
                                        title="Share to Chat"
                                    >
                                        <Share2 size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleCopyExternalLink(note)}
                                        className="!p-1.5 text-slate-400 hover:text-blue-500"
                                        title="Copy Share Link"
                                    >
                                        <Link size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleGenerateQuiz(note)}
                                        className={`!p-1.5 ${generatingQuizId === note.id ? 'text-purple-500 animate-spin' : 'text-slate-400 hover:text-purple-500'}`}
                                        disabled={generatingQuizId !== null}
                                        title="Generate AI Quiz"
                                    >
                                        <BrainCircuit size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleSummarize(note)}
                                        className={`!p-1.5 ${summarizingId === note.id ? 'text-primary-500 animate-pulse' : 'text-slate-400 hover:text-primary-500'}`}
                                        disabled={summarizingId !== null}
                                        title="AI Summarize"
                                    >
                                        <Wand2 size={14} />
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleDelete(note.id)} className="!p-1.5 text-slate-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                                <StickyNote size={18} className="text-primary-500" />
                                {note.title}
                            </h3>

                            {getYouTubeId(note.resourceLink) && (
                                <div className="mb-4 aspect-video rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${getYouTubeId(note.resourceLink)}`}
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            <div className="flex-1">
                                {note.content.includes('```') || note.content.includes('{') ? (
                                    <div className="relative group/code">
                                        <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3 rounded-xl overflow-x-auto border border-slate-700">
                                            <code>{note.content}</code>
                                        </pre>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRunCode(note.content); }}
                                            className="absolute top-2 right-2 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg opacity-0 group-hover/code:opacity-100 transition-all flex items-center gap-1.5 text-[10px] font-bold"
                                        >
                                            <Play size={10} fill="currentColor" />
                                            RUN
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-6">
                                        {note.content}
                                    </p>
                                )}
                            </div>

                            {note.resourceLink && (
                                <a
                                    href={note.resourceLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 flex items-center gap-2 text-primary-600 text-xs font-semibold hover:underline"
                                >
                                    {getYouTubeId(note.resourceLink) ? <Play size={12} /> : <ExternalLink size={12} />}
                                    {getYouTubeId(note.resourceLink) ? 'Watch Tutorial' : 'Linked Resource'}
                                </a>
                            )}

                            {/* Display audio episodes if available */}
                            {note.audioEpisodes && note.audioEpisodes.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Mic size={10} /> Voice Notes ({note.audioEpisodes.length} {note.audioEpisodes.length === 1 ? 'Episode' : 'Episodes'})
                                    </p>
                                    <div className="space-y-2">
                                        {note.audioEpisodes.map((ep, idx) => (
                                            <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                                    Episode {ep.episode || idx + 1}
                                                </p>
                                                <audio
                                                    controls
                                                    preload="metadata"
                                                    src={ep.url}
                                                    className="w-full h-7"
                                                    onError={(e) => {
                                                        console.error('Audio playback error:', e);
                                                        e.target.style.opacity = '0.5';
                                                    }}
                                                    controlsList="nodownload"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fallback for old single audioPath format */}
                            {note.audioPath && !note.audioEpisodes && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Mic size={10} /> Voice Note
                                    </p>
                                    <audio
                                        controls
                                        preload="metadata"
                                        src={note.audioPath}
                                        className="w-full h-8"
                                        onError={(e) => {
                                            console.error('Audio playback error:', e);
                                            e.target.style.opacity = '0.5';
                                        }}
                                        controlsList="nodownload"
                                    />
                                </div>
                            )}

                            {note.pdfPath && (
                                <a
                                    href={note.pdfPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 w-full flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 text-[11px] font-bold bg-[#edf2ff] dark:bg-blue-900/30 py-2.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shadow-sm border border-blue-100 dark:border-blue-800/50"
                                >
                                    <FileText size={16} />
                                    <span>View PDF Document</span>
                                </a>
                            )}
                        </Card>
                    ))
                )}
                {notes.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">Your notes are empty</h3>
                        <p className="text-slate-400">Save important snippets and links here.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Note"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={uploading}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Save Note'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Title"
                        placeholder="e.g. SQL Optimization Tips"
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
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
                            <button
                                type="button"
                                onClick={toggleRecording}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                                {isRecording ? 'Stop Recording' : 'Record Voice Note'}
                            </button>
                        </div>
                        <textarea
                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100 min-h-[120px]"
                            placeholder="Enter your notes or code here..."
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>
                    <Input
                        label="Resource URL (Optional)"
                        type="url"
                        placeholder="https://..."
                        value={formData.resourceLink}
                        onChange={(e) => setFormData({ ...formData, resourceLink: e.target.value })}
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Attach PDF (Optional)</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label
                                htmlFor="pdf-upload"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-all"
                            >
                                <FileText size={20} className="text-slate-400" />
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {selectedFile ? selectedFile.name : 'Choose PDF file'}
                                </span>
                            </label>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Live Sandbox Modal */}
            <Modal
                isOpen={isSandboxOpen}
                onClose={() => setIsSandboxOpen(false)}
                title="Live Code Sandbox"
                size="lg"
                footer={<Button onClick={() => setIsSandboxOpen(false)}>Close Sandbox</Button>}
            >
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Output</label>
                        <div className="w-full h-[400px] bg-white border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner">
                            <iframe
                                title="Sandbox Output"
                                className="w-full h-full"
                                srcDoc={`
                                    <!DOCTYPE html>
                                    <html>
                                        <head>
                                            <style>
                                                body { font-family: sans-serif; padding: 20px; color: #334155; }
                                                h1, h2 { color: #4f46e5; }
                                                pre { background: #f8fafc; padding: 10px; border-radius: 8px; }
                                            </style>
                                        </head>
                                        <body>
                                            <div id="app"></div>
                                            <script>
                                                try {
                                                    const consoleLog = console.log;
                                                    console.log = (...args) => {
                                                        const el = document.createElement('pre');
                                                        el.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : a).join(' ');
                                                        document.body.appendChild(el);
                                                        consoleLog(...args);
                                                    };
                                                    
                                                    // Wrap user code in a function to allow variables
                                                    (function() {
                                                        ${sandboxCode.includes('<') ? 'document.body.innerHTML = `' + sandboxCode + '`;' : sandboxCode}
                                                    })();
                                                } catch (err) {
                                                    document.body.innerHTML += '<pre style="color: #ef4444; border-color: #fca5a5; background: #fef2f2;">Error: ' + err.message + '</pre>';
                                                }
                                            </script>
                                        </body>
                                    </html>
                                `}
                            ></iframe>
                        </div>
                    </div>
                </div>
            </Modal>

            <QuizModal
                isOpen={isQuizOpen}
                onClose={() => setIsQuizOpen(false)}
                quizData={quizData}
                noteTitle={quizNoteTitle}
            />

            <ShareToChatModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                resource={noteToShare}
            />

        </Layout>
    );
};

export default Notes;
