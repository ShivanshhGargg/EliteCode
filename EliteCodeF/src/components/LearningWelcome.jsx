import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BookOpen, Brain, ChevronRight, ListChecks, Loader2, Sparkles } from 'lucide-react'
import { problemService } from '../api/problemService'
import { hintService } from '../api/hintService'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useWorkspaceStore from '../store/workspaceStore'
import ChatInterface from './ChatInterface'
import { getDifficultyBg, truncate } from '../utils/format'
import { getErrorMessage } from '../utils/error'

const TOPIC_INTROS = {
  array: 'Indexing, prefix sums, windows, and careful state tracking.',
  string: 'Pattern matching, parsing, frequency maps, and two-pointer scans.',
  hash: 'Fast lookup patterns for counting, pairing, and deduplication.',
  'two pointers': 'Opposing or same-direction scans that shrink brute force.',
  sliding: 'Maintain a moving window while preserving an invariant.',
  stack: 'Monotonic stacks, nested structure parsing, and rollback state.',
  queue: 'Breadth-first traversal, scheduling, and streaming order.',
  tree: 'Recursive structure, traversal order, and subtree information flow.',
  graph: 'Reachability, BFS/DFS, shortest paths, and connected components.',
  dp: 'State definitions, transitions, memoization, and tabulation.',
  dynamic: 'State definitions, transitions, memoization, and tabulation.',
  greedy: 'Local choices backed by exchange arguments or ordering.',
  binary: 'Search over sorted data, answer space, or monotonic predicates.',
  recursion: 'Break problems into smaller identical decisions.',
  backtracking: 'Explore choices, prune invalid branches, and restore state.',
}

const DEFAULT_TOPICS = [
  'Array',
  'String',
  'Hash Table',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
]

const normalize = (value = '') => value.toLowerCase().replace(/[-_]/g, ' ').trim()

const topicIntro = (topic) => {
  const key = normalize(topic)
  const matched = Object.keys(TOPIC_INTROS).find((item) => key.includes(item))
  return matched ? TOPIC_INTROS[matched] : 'A focused track of problems that build one reusable interview pattern.'
}

const pickSuggestions = (problems, selectedTopic) => {
  const scoped = selectedTopic === 'All'
      ? problems
      : problems.filter((problem) => problem.tags?.some((tag) => normalize(tag) === normalize(selectedTopic)))
  return [...scoped]
      .sort((a, b) => {
        const rank = { EASY: 0, MEDIUM: 1, HARD: 2 }
        return (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1)
      })
      .slice(0, 4)
}

export function LearningWelcome() {
  const [selectedTopic, setSelectedTopic] = useState('All')
  const { addToast } = useToastStore()
  const { setSelectedProblem } = useWorkspaceStore()
  const { sessions, currentSessionId, createSession, setCurrentSession, addMessage, updateSessionTitle } = useChatStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-problems'],
    queryFn: () => problemService.getProblems(0, 100),
  })

  const problems = data?.content || []
  const topics = useMemo(() => {
    const counts = new Map()
    problems.forEach((problem) => {
      ;(problem.tags || []).forEach((tag) => {
        const label = tag.trim()
        if (label) counts.set(label, (counts.get(label) || 0) + 1)
      })
    })
    const loadedTopics = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([topic]) => topic)
    return ['All', ...(loadedTopics.length ? loadedTopics : DEFAULT_TOPICS)]
  }, [problems])

  const visibleProblems = useMemo(() => {
    if (selectedTopic === 'All') return problems
    return problems.filter((problem) => problem.tags?.some((tag) => normalize(tag) === normalize(selectedTopic)))
  }, [problems, selectedTopic])

  const ensureLearningSession = () => {
    const current = sessions.find((session) => session.id === currentSessionId && session.mode === 'LEARNING')
    if (current) return current.id

    const existing = sessions.find((session) => session.mode === 'LEARNING')
    if (existing) {
      setCurrentSession(existing.id)
      return existing.id
    }

    return createSession(null, 'Learning Assistant', 'LEARNING')
  }

  const askAi = useMutation({
    mutationFn: async () => {
      const suggestions = pickSuggestions(problems, selectedTopic)
      const topicText = selectedTopic === 'All' ? 'a balanced DSA starter path' : selectedTopic
      const response = await hintService.requestHint(
          null,
          `Available questions: ${suggestions.map((problem) => `${problem.title} (${problem.difficulty})`).join(', ')}`,
          `Suggest a short learning path for ${topicText}. Keep it concise and mention why these questions are good practice.`,
          'LEARNING'
      )
      return { response, suggestions, topicText }
    },
    onSuccess: ({ response, suggestions, topicText }) => {
      const sessionId = ensureLearningSession()
      addMessage(sessionId, {
        id: `ai-suggestions-${Date.now()}`,
        role: 'assistant',
        content: response?.hint || `Here is a focused ${topicText} set. Start easy, then move into medium difficulty once the pattern feels stable.`,
        timestamp: new Date().toISOString(),
        problemSuggestions: suggestions,
      })
      hintService.generateSessionTitle({
        mode: 'LEARNING',
        problemTitle: '',
        conversation: `Topic: ${topicText}\nSuggestions: ${suggestions.map((problem) => problem.title).join(', ')}\n${response?.hint || ''}`,
      }).then((result) => {
        if (result?.title) updateSessionTitle(sessionId, result.title)
      }).catch(() => {})
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const selectProblem = (problem) => {
    setSelectedProblem(problem)
  }

  return (
      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(260px,28%)_minmax(420px,44%)_minmax(280px,28%)]">
        <section className="leetcode-panel flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-white/10 px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-txt-primary">
              <BookOpen size={16} className="text-violet" />
              Learn Mode
            </div>
            <p className="text-sm leading-relaxed text-txt-secondary">
              Pick a topic track, open a question, then use the tutor for hints, patterns, and code review.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {topics.map((topic) => {
                const active = selectedTopic === topic
                const count = topic === 'All'
                    ? problems.length
                    : problems.filter((problem) => problem.tags?.some((tag) => normalize(tag) === normalize(topic))).length
                return (
                    <button
                        key={topic}
                        onClick={() => setSelectedTopic(topic)}
                        className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                            active
                                ? 'border-violet/35 bg-violet/10 text-txt-primary'
                                : 'border-white/10 bg-white/[0.02] text-txt-secondary hover:border-white/20 hover:text-txt-primary'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium">{topic}</span>
                        <span className="text-[11px] text-txt-muted">{count}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-txt-muted">{topic === 'All' ? 'A balanced set across all available tracks.' : topicIntro(topic)}</p>
                    </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="leetcode-panel flex min-h-0 flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary">
                <ListChecks size={16} className="text-cyan" />
                Questions
              </div>
              <p className="mt-1 text-xs text-txt-muted">{selectedTopic} track</p>
            </div>
            <button
                onClick={() => askAi.mutate()}
                disabled={!problems.length || askAi.isPending}
                className="inline-flex items-center gap-2 rounded-md border border-violet/30 bg-violet/10 px-3 py-2 text-xs font-medium text-violet hover:bg-violet/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {askAi.isPending ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Ask AI
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-txt-muted">
                  <Loader2 size={18} className="mr-2 animate-spin" /> Loading questions...
                </div>
            ) : error ? (
                <div className="rounded-md border border-neon-red/20 bg-neon-red/10 p-4 text-sm text-neon-red">
                  Problems could not be loaded right now.
                </div>
            ) : visibleProblems.length === 0 ? (
                <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-txt-secondary">
                  No questions found for this topic yet.
                </div>
            ) : (
                <div className="space-y-2">
                  {visibleProblems.map((problem) => (
                      <button
                          key={problem.id}
                          onClick={() => selectProblem(problem)}
                          className="group w-full rounded-md border border-white/10 bg-white/[0.025] px-3 py-3 text-left transition-colors hover:border-cyan/25 hover:bg-white/[0.045]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-txt-primary group-hover:text-cyan">{problem.title}</h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-txt-muted">{truncate(problem.originalText, 130)}</p>
                          </div>
                          <ChevronRight size={15} className="mt-1 shrink-0 text-txt-muted group-hover:text-cyan" />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${getDifficultyBg(problem.difficulty)}`}>{problem.difficulty}</span>
                          {problem.tags?.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-txt-muted">{tag}</span>
                          ))}
                        </div>
                      </button>
                  ))}
                </div>
            )}
          </div>
        </section>

        <section className="leetcode-panel flex min-h-[360px] flex-col overflow-hidden xl:min-h-0">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary">
              <Brain size={16} className="text-violet" />
              AI Tutor
            </div>
            <p className="mt-1 text-xs text-txt-muted">Ask for a path, hint, or next question.</p>
          </div>
          <div className="min-h-0 flex-1">
            <ChatInterface showProblemPanel={false} learningProblems={visibleProblems} />
          </div>
        </section>
      </div>
  )
}

export default LearningWelcome
