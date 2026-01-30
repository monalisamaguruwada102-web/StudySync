import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { noteService, moduleService } from '../services/firestoreService';
import { Plus, StickyNote, Trash2, Book, ExternalLink, FileText, Code, Play, Sparkles, Wand2 } from 'lucide-react';
import aiService from '../services/aiService';

import api from '../services/api';

const Notes = () => {
    const { data: notes, loading, refresh } = useFirestore(noteService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Sandbox State
    const [isSandboxOpen, setIsSandboxOpen] = useState(false);
    const [sandboxCode, setSandboxCode] = useState('');
    const [sandboxCode, setSandboxCode] = useState('');
    const [summarizingId, setSummarizingId] = useState(null);
    const [viewingPdf, setViewingPdf] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            let pdfPath = '';
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                const response = await api.post('/upload', uploadData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                pdfPath = response.data.filePath;
            }

            await noteService.add({ ...formData, pdfPath });
            await refresh();
            setIsModalOpen(false);
            setFormData({ title: '', moduleId: '', content: '', resourceLink: '', pdfPath: '' });
            setSelectedFile(null);
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this note?')) {
            await noteService.delete(id);
            await refresh();
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
            alert('AI Assistant is currently unavailable.');
        } finally {
            setSummarizingId(null);
        }
    };

    return (
        <Layout title="Notes & Resources">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Personal Notes</h1>
                    <p className="text-slate-500 dark:text-slate-400">Capture key concepts and link important resources.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={20} />
                    <span>Add Note</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {notes.map((note) => (
                    <Card key={note.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                                <Book size={10} />
                                <span>{getModuleName(note.moduleId)}</span>
                            </div>
                            <div className="flex items-center gap-1">
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

                        {note.pdfPath && (
                            <button
                                onClick={() => setViewingPdf(note.pdfPath)}
                                className="mt-2 w-full flex items-center justify-center gap-2 text-blue-600 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <FileText size={14} />
                                <span>View PDF Document</span>
                            </button>
                        )}
                    </Card>
                ))}
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
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Content</label>
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
            {/* PDF Viewer Modal */}
            <Modal
                isOpen={!!viewingPdf}
                onClose={() => setViewingPdf(null)}
                title="Document Viewer"
                size="xl"
            >
                <div className="w-full h-[80vh] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
                    <iframe
                        src={viewingPdf}
                        className="w-full h-full"
                        title="PDF Viewer"
                    />
                </div>
            </Modal>
        </Layout>
    );
};

export default Notes;
