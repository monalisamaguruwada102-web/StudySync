import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useFirestore } from '../hooks/useFirestore';
import { gradeService, moduleService } from '../services/firestoreService';
import { Plus, Calculator, Trophy, Info, Trash2, Edit2, TrendingUp } from 'lucide-react';

const Grades = () => {
    const { data: grades, loading, refresh } = useFirestore(gradeService.getAll);
    const { data: modules } = useFirestore(moduleService.getAll);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentGrade, setCurrentGrade] = useState(null);
    const [formData, setFormData] = useState({
        moduleId: '',
        name: '',
        score: '',
        total: '100',
        weight: '10',
        type: 'Assignment'
    });

    const gradeTypes = ['Assignment', 'Quiz', 'Midterm', 'Final', 'Project', 'Lab'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            ...formData,
            score: parseFloat(formData.score),
            total: parseFloat(formData.total),
            weight: parseFloat(formData.weight)
        };

        if (currentGrade) {
            await gradeService.update(currentGrade.id, data);
        } else {
            await gradeService.add(data);
        }
        await refresh();
        setIsModalOpen(false);
        setFormData({ moduleId: '', name: '', score: '', total: '100', weight: '10', type: 'Assignment' });
    };

    const handleOpenModal = (grade = null) => {
        if (grade) {
            setCurrentGrade(grade);
            setFormData({
                moduleId: grade.moduleId,
                name: grade.name,
                score: grade.score.toString(),
                total: grade.total.toString(),
                weight: grade.weight.toString(),
                type: grade.type
            });
        } else {
            setCurrentGrade(null);
            setFormData({ moduleId: '', name: '', score: '', total: '100', weight: '10', type: 'Assignment' });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this grade record?')) {
            await gradeService.delete(id);
            await refresh();
        }
    };

    const calculateModuleGrade = (moduleId) => {
        const modGrades = grades.filter(g => g.moduleId === moduleId);
        if (modGrades.length === 0) return { score: 0, weight: 0 };

        let weightedScore = 0;
        let totalWeight = 0;

        modGrades.forEach(g => {
            const percentage = (g.score / g.total) * 100;
            weightedScore += (percentage * (g.weight / 100));
            totalWeight += g.weight;
        });

        return { score: weightedScore, currentWeight: totalWeight };
    };

    const getGPALabel = (percentage) => {
        if (percentage >= 90) return { gpa: '4.0', grade: 'A' };
        if (percentage >= 80) return { gpa: '3.0', grade: 'B' };
        if (percentage >= 70) return { gpa: '2.0', grade: 'C' };
        if (percentage >= 60) return { gpa: '1.0', grade: 'D' };
        return { gpa: '0.0', grade: 'F' };
    };

    const totalGPA = () => {
        if (modules.length === 0) return 0;
        let sumGPA = 0;
        let countedModules = 0;

        modules.forEach(mod => {
            const { score, currentWeight } = calculateModuleGrade(mod.id);
            if (currentWeight > 0) {
                const normalizedScore = (score / currentWeight) * 100;
                sumGPA += parseFloat(getGPALabel(normalizedScore).gpa);
                countedModules++;
            }
        });

        return countedModules > 0 ? (sumGPA / countedModules).toFixed(2) : 'N/A';
    };

    return (
        <Layout title="Grade & GPA Tracker">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Academic Performance</h1>
                    <p className="text-slate-500 dark:text-slate-400">Monitor your grades and project your final GPA.</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-6 py-3 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-200 dark:shadow-none flex items-center gap-4">
                        <Trophy size={24} />
                        <div>
                            <p className="text-[10px] uppercase font-bold opacity-80 tracking-widest">Current Cumulative GPA</p>
                            <h2 className="text-2xl font-black">{totalGPA()}</h2>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="flex items-center gap-2 h-fit self-center">
                        <Plus size={20} />
                        <span>Add Grade</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {modules.map(mod => {
                        const { score, currentWeight } = calculateModuleGrade(mod.id);
                        const displayScore = currentWeight > 0 ? (score / currentWeight * 100).toFixed(1) : 0;
                        const { grade } = getGPALabel(displayScore);
                        const modGrades = grades.filter(g => g.moduleId === mod.id);

                        return (
                            <Card key={mod.id} title={mod.name} HeaderAction={
                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${grade === 'A' ? 'bg-green-100 text-green-600' :
                                        grade === 'B' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    Current Grade: {grade} ({displayScore}%)
                                </span>
                            }>
                                <div className="space-y-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-50 dark:border-slate-800">
                                                    <th className="pb-2 font-semibold">Assessment</th>
                                                    <th className="pb-2 font-semibold">Category</th>
                                                    <th className="pb-2 font-semibold">Score</th>
                                                    <th className="pb-2 font-semibold">Weight</th>
                                                    <th className="pb-2 font-semibold text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {modGrades.map(grade => (
                                                    <tr key={grade.id} className="text-sm text-slate-700 dark:text-slate-300">
                                                        <td className="py-3 font-medium">{grade.name}</td>
                                                        <td className="py-3">
                                                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                                {grade.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 font-semibold">{grade.score}/{grade.total}</td>
                                                        <td className="py-3">{grade.weight}%</td>
                                                        <td className="py-3 text-right space-x-1">
                                                            <button onClick={() => handleOpenModal(grade)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDelete(grade.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {modGrades.length === 0 && (
                                                    <tr>
                                                        <td colSpan="5" className="py-8 text-center text-slate-400 italic text-xs">
                                                            No grade records for this module.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Info size={14} />
                                            <span>Current Weight: {currentWeight}% / 100%</span>
                                        </div>
                                        {currentWeight < 100 && (
                                            <div className="text-primary-600 font-semibold italic">
                                                Target: Reach 100% to finalize grade projection
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    <Card title="GPA Projection" className="bg-gradient-to-br from-primary-600 to-primary-800 !text-white border-none">
                        <div className="space-y-6">
                            <TrendingUp size={48} className="opacity-20 absolute top-4 right-4" />
                            <p className="text-sm opacity-90 leading-relaxed">
                                To achieve a <strong>First Class</strong> degree, aim for a consistent module percentage above <strong>70%</strong>.
                            </p>
                            <div className="space-y-4">
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <h4 className="text-sm font-bold mb-1">Pass Requirement</h4>
                                    <p className="text-xs opacity-80">You need to maintain 40% across all modules to pass the year.</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <h4 className="text-sm font-bold mb-1">Dean's List</h4>
                                    <p className="text-xs opacity-80">Requires a GPA above 3.8 and no module below 85%.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card title="Grade Summary" className="dark:bg-slate-800">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Modules Tracked</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{modules.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Total Assessments</span>
                                <span className="font-bold text-slate-800 dark:text-slate-100">{grades.length}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-3">Top Performing</p>
                                {modules.slice(0, 3).map(m => (
                                    <div key={m.id} className="flex justify-between items-center text-xs mb-2">
                                        <span className="truncate w-32 dark:text-slate-300">{m.name}</span>
                                        <span className="text-primary-600 font-bold">{calculateModuleGrade(m.id).currentWeight > 0 ? (calculateModuleGrade(m.id).score / calculateModuleGrade(m.id).currentWeight * 100).toFixed(0) : 0}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentGrade ? 'Edit Grade Record' : 'Record New Grade'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {currentGrade ? 'Update Record' : 'Save Record'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
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
                        label="Assessment Name"
                        placeholder="e.g. Midterm Lab Report"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                            <select
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-slate-100"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {gradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <Input
                            label="Weight (%)"
                            type="number"
                            placeholder="e.g. 20"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Score"
                            type="number"
                            placeholder="e.g. 85"
                            value={formData.score}
                            onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                            required
                        />
                        <Input
                            label="Total Possible"
                            type="number"
                            placeholder="e.g. 100"
                            value={formData.total}
                            onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                            required
                        />
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Grades;
