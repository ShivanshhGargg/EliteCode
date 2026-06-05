import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { problemService } from '../api/problemService';
import { NeonButton } from '../components/NeonButton';
import useToastStore from '../store/toastStore';

export function AdminProblemsPage() {
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: '', originalText: '', difficulty: 'MEDIUM', tags: '' });
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();

    const { data: problems, isLoading } = useQuery({
        queryKey: ['admin-problems'],
        queryFn: () => problemService.getProblems(0, 100),
    });

    const createMutation = useMutation({
        mutationFn: (data) => problemService.createProblem(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-problems']);
            addToast('Problem created', 'success');
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => problemService.updateProblem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-problems']);
            addToast('Problem updated', 'success');
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => problemService.deleteProblem(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-problems']);
            addToast('Problem deleted', 'success');
        },
    });

    const resetForm = () => {
        setEditing(null);
        setForm({ title: '', originalText: '', difficulty: 'MEDIUM', tags: '' });
    };

    const handleSubmit = () => {
        const payload = {
            ...form,
            tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            testCases: [], // you can extend to manage test cases later
        };
        if (editing) updateMutation.mutate({ id: editing, data: payload });
        else createMutation.mutate(payload);
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl mb-4">Admin: Problems</h1>
            <div className="glass-panel p-4 mb-6">
                <h2>{editing ? 'Edit Problem' : 'New Problem'}</h2>
                <input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-neon w-full mb-2" />
                <textarea placeholder="Original Text" value={form.originalText} onChange={e => setForm({...form, originalText: e.target.value})} className="input-neon w-full mb-2" rows={4} />
                <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})} className="input-neon w-full mb-2">
                    <option>EASY</option><option>MEDIUM</option><option>HARD</option>
                </select>
                <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="input-neon w-full mb-2" />
                <NeonButton onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
                    {editing ? 'Update' : 'Create'}
                </NeonButton>
                {editing && <NeonButton variant="ghost" onClick={resetForm} className="ml-2">Cancel</NeonButton>}
            </div>
            <div className="space-y-2">
                {problems?.content.map(p => (
                    <div key={p.id} className="glass-panel p-3 flex justify-between items-center">
                        <div><strong>{p.title}</strong> ({p.difficulty})</div>
                        <div>
                            <NeonButton size="sm" variant="ghost" onClick={() => { setEditing(p.id); setForm({...p, tags: p.tags.join(',')}); }}>Edit</NeonButton>
                            <NeonButton size="sm" variant="ghost" onClick={() => deleteMutation.mutate(p.id)}>Delete</NeonButton>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}