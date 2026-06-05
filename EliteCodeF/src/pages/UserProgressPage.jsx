import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, Trophy, TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'
import { userService } from '../api/userService'
import { attemptService } from '../api/attemptService'
import { Spinner } from '../components/Spinner'
import { formatDate, formatSuccessRate, getResultColor } from '../utils/format'

export function UserProgressPage() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: userService.getCurrentUser,
  })

  const { data: attemptsData, isLoading: attemptsLoading } = useQuery({
    queryKey: ['attempts', 'all'],
    queryFn: () => attemptService.getAttempts(0, 100),
  })

  if (userLoading || attemptsLoading) return <Spinner />

  const attempts = attemptsData?.content || []
  const totalAttempts = attempts.length
  const acceptedAttempts = attempts.filter(a => a.result === 'ACCEPTED').length
  const accuracy = totalAttempts > 0 ? acceptedAttempts / totalAttempts : 0
  const uniqueProblemsSolved = new Set(attempts.filter(a => a.result === 'ACCEPTED').map(a => a.problemId)).size

  // Group attempts by date for heatmap (simplified)
  const attemptsByDate = attempts.reduce((acc, a) => {
    const date = new Date(a.createdAt).toDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  // Calculate streak (simple: consecutive days with at least one attempt)
  let streak = 0
  const today = new Date().toDateString()
  if (attemptsByDate[today]) streak = 1
  // further logic could be added but keep simple

  const stats = [
    { icon: Trophy, label: 'Problems Solved', value: uniqueProblemsSolved, color: 'cyan' },
    { icon: TrendingUp, label: 'Accuracy', value: formatSuccessRate(accuracy), color: 'violet' },
    { icon: CheckCircle, label: 'Accepted', value: acceptedAttempts, color: 'neon-green' },
    { icon: Clock, label: 'Total Attempts', value: totalAttempts, color: 'magenta' },
  ]

  return (
    <div className="min-h-screen bg-void p-6">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-txt-secondary hover:text-cyan mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to Workspace
        </Link>

        <div className="glass-panel rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-white text-xl font-bold">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-txt-primary">{user?.firstName} {user?.lastName}</h1>
              <p className="text-txt-muted text-sm">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-4 text-center">
                <stat.icon size={20} className={`mx-auto mb-2 text-${stat.color}`} />
                <p className="text-2xl font-bold text-txt-primary">{stat.value}</p>
                <p className="text-xs text-txt-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-panel rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-txt-primary mb-4">Recent Attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-txt-muted text-center py-8">No attempts yet. Start coding!</p>
          ) : (
            <div className="space-y-3">
              {attempts.slice(0, 10).map(attempt => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-txt-primary">Problem #{attempt.problemId}</p>
                    <p className="text-xs text-txt-muted">{formatDate(attempt.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${getResultColor(attempt.result)}`}>
                      {attempt.result || 'PENDING'}
                    </span>
                    {attempt.executionTime > 0 && (
                      <span className="text-xs text-txt-muted">{attempt.executionTime}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}