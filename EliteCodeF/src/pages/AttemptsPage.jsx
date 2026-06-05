import {useQuery} from '@tanstack/react-query'
import {Link} from 'react-router-dom'
import {ArrowLeft, Clock, CheckCircle, XCircle} from 'lucide-react'
import {attemptService} from '../api/attemptService'
import {Spinner} from '../components/Spinner'
import {formatDate, getResultColor} from '../utils/format'
import {useState} from 'react'
import {NeonButton} from '../components/NeonButton'

export function AttemptsPage() {
    const {data, isLoading, error} = useQuery({
        queryKey: ['attempts'],
        queryFn: () => attemptService.getAttempts(0, 50),
    })

    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const {data: feedback, refetch: fetchFeedback} = useQuery({
        queryKey: ['feedback', selectedAttempt?.id],
        queryFn: () => attemptService.getAttemptFeedback(selectedAttempt.id),
        enabled: !!selectedAttempt,
    });

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size={32}/>
        </div>
    )

    if (error) return (
        <div className="min-h-screen flex items-center justify-center text-neon-red">
            Failed to load attempts
        </div>
    )

    const attempts = data?.content || []

    return (
        <div className="min-h-screen bg-void p-6">
            <div className="max-w-4xl mx-auto">
                <Link to="/"
                      className="inline-flex items-center gap-2 text-txt-secondary hover:text-cyan mb-6 transition-colors">
                    <ArrowLeft size={18}/> Back to Workspace
                </Link>

                <h1 className="text-2xl font-semibold text-txt-primary mb-6">My Attempts</h1>

                {attempts.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-8 text-center text-txt-muted">
                        No attempts yet. Run some code!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {attempts.map((attempt) => (
                            <div key={attempt.id}
                                 className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-txt-primary truncate">Problem
                                        ID: {attempt.problemId}</p>
                                    <p className="text-xs text-txt-muted mt-1 flex items-center gap-2">
                                        <Clock size={12}/> {formatDate(attempt.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
  <span className={`text-sm font-bold ${getResultColor(attempt.result)}`}>
	{attempt.result || 'PENDING'}
  </span>

                                    {attempt.executionTime > 0 && (
                                        <span className="text-xs text-txt-muted">
	  {attempt.executionTime}ms
</span>
                                    )}

                                    <NeonButton
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setSelectedAttempt(attempt)
                                            fetchFeedback()
                                        }}
                                    >
                                        Feedback
                                    </NeonButton>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AttemptsPage