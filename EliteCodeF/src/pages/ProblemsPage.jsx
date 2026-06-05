import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { problemService } from '../api/problemService';
import { Spinner } from '../components/Spinner';
import { ProblemCard } from '../components/ProblemCard';
import useWorkspaceStore from '../store/workspaceStore';

export function ProblemsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['problems'],
        queryFn: () => problemService.getProblems(0, 50),
    });
    const { setSelectedProblem } = useWorkspaceStore();

    const handleSelect = (problem) => {
        setSelectedProblem(problem);
    };

    if (isLoading) return <Spinner />;
    if (error) return <div>Failed to load problems</div>;

    return (
        <div className="min-h-screen bg-void p-6">
            <div className="max-w-6xl mx-auto">
                <Link to="/" className="text-cyan mb-4 inline-block">← Back</Link>
                <h1 className="text-2xl font-semibold mb-6">Problems</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.content.map(problem => (
                        <ProblemCard key={problem.id} problem={problem} onSelect={handleSelect} />
                    ))}
                </div>
            </div>
        </div>
    );
}
