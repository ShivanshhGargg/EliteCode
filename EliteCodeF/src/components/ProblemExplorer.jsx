// src/components/ProblemExplorer.jsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { Search, ListChecks, ChevronRight, Circle, Loader2, Sparkles, Filter } from 'lucide-react'
import { problemService } from '../api/problemService'
import { hintService } from '../api/hintService'
import { attemptService } from '../api/attemptService'
import useWorkspaceStore from '../store/workspaceStore'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import { getDifficultyBg, truncate } from '../utils/format'
import { getErrorMessage } from '../utils/error'

const normalize = (value = '') => value.toLowerCase().replace(/[-_]/g, ' ').trim()
const PAGE_SIZE = 50
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD']
const STATUS_OPTIONS = ['All', 'Solved', 'Unsolved']

// Get solved problem IDs once
let solvedIdsCache = null
const getSolvedIds = async () => {
  if (solvedIdsCache) return solvedIdsCache
  try {
    const ids = await attemptService.getSolvedProblemIds()
    solvedIdsCache = new Set(ids)
    return solvedIdsCache
  } catch {
    return new Set()
  }
}

// Generate fallback intro for a tag (no backend needed)
function generateFallbackIntro(tag) {
  const fallbacks = {
    'Array': 'Indexed collections – storing and manipulating ordered data.',
    'String': 'Text processing, pattern matching, and manipulation.',
    'Hash Table': 'Key‑value lookups for fast data retrieval.',
    'Dynamic Programming': 'Optimizing overlapping subproblems with memoization or tabulation.',
    'Math': 'Mathematical computations, number theory, and combinatorics.',
    'Sorting': 'Arranging elements in a specific order efficiently.',
    'Greedy': 'Making locally optimal choices to reach a global optimum.',
    'Depth-First Search': 'Traversing trees or graphs by exploring as far as possible along each branch.',
    'Binary Search': 'Divide‑and‑conquer search on sorted arrays.',
    'Matrix': '2D grid problems – rotations, traversals, and transformations.',
    'Breadth-First Search': 'Level‑order traversal of trees or graphs.',
    'Two Pointers': 'Efficient linear scans using two indices.',
    'Bit Manipulation': 'Working with binary representations and bitwise operations.',
    'Tree': 'Hierarchical data structures with root and child nodes.',
    'Binary Tree': 'Each node has at most two children – classic recursion problems.',
    'Prefix Sum': 'Precomputed running totals for range sum queries.',
    'Heap': 'Priority queue for always accessing the min/max element.',
    'Graph Theory': 'Nodes connected by edges – traversals, shortest paths, and connectivity.',
    'Stack': 'LIFO data structure – parsing, backtracking, and depth‑first problems.',
    'Simulation': 'Step‑by‑step modelling of a process or rules.',
    'Counting': 'Frequency counting and occurrence tracking.',
    'Sliding Window': 'Efficient subarray/substring problems using a moving window.',
    'Backtracking': 'Generating all possibilities with pruning.',
    'Union-Find': 'Disjoint set for connectivity and dynamic grouping.',
    'Enumeration': 'Iterating over all possible cases or combinations.',
    'Monotonic Stack': 'Finding next greater/smaller element in O(n).',
    'Linked List': 'Pointer‑based sequential data structure.',
    'Number Theory': 'Integer properties – primes, GCD, modular arithmetic.',
    'Recursion': 'Functions that call themselves – divide‑and‑conquer style.',
    'Divide and Conquer': 'Split problem, solve recursively, combine results.',
    'Bitmask': 'Using bits to represent states or subsets.',
    'Memoization': 'Caching computed results to avoid redundant work.',
    'Trie': 'Prefix tree for efficient string storage and search.',
    'Topological Sort': 'Ordering directed acyclic graph nodes.',
    'Ordered Set': 'Sorted unique elements with logarithmic operations.',
    'Geometry': 'Points, lines, shapes, and spatial calculations.',
    'Binary Search Tree': 'Ordered tree with O(log n) search, insert, delete.',
    'Queue': 'FIFO data structure – BFS, scheduling, etc.',
    'Game Theory': 'Turn‑based strategy and optimal play problems.',
    'Segment Tree': 'Range queries and updates with log(n) complexity.',
    'Hash Function': 'Mapping arbitrary data to fixed‑size values.',
    'Binary Indexed Tree': 'Fenwick tree – efficient prefix sums and updates.',
    'Combinatorics': 'Counting, permutations, and arrangements.',
    'String Matching': 'Searching for patterns in text (KMP, Rabin‑Karp).',
    'Shortest Path': 'Finding minimal routes (Dijkstra, Bellman‑Ford, Floyd).',
    'Rolling Hash': 'Efficient substring hashing for pattern matching.',
    'Monotonic Queue': 'Maintaining min/max in a sliding window.',
    'Brainteaser': 'Logical puzzles that require clever insights.',
    'Merge Sort': 'Divide‑and‑conquer stable sorting algorithm.',
    'Counting Sort': 'Non‑comparison integer sorting using frequency.',
    'Quickselect': 'Selection algorithm to find k‑th smallest element.',
    'Probability and Statistics': 'Chance and data analysis problems.',
    'Bucket Sort': 'Distribute elements into buckets and sort individually.',
    'Sweep Line': 'Event‑based scanning for geometry or intervals.',
    'Suffix Array': 'Lexicographic ordering of all suffixes.',
    'Minimum Spanning Tree': 'Connect all nodes with minimal total weight (Kruskal, Prim).',
    'Eulerian Circuit': 'Path that visits every edge exactly once.',
    'Radix Sort': 'Digit‑by‑digit sorting of integers.',
    'Strongly Connected Component': 'Maximal subgraph where every pair is reachable.',
    'Biconnected Component': 'Maximal subgraph with no articulation points.',
    'Interactive': 'Problems that require user interaction during solving.',
    'Randomized': 'Algorithms that use randomness for efficiency.',
  };

  if (fallbacks[tag]) return fallbacks[tag];
  const firstWord = tag.split(' ')[0];
  if (fallbacks[firstWord]) return fallbacks[firstWord];
  return `Practice problems for the "${tag}" topic – covering key patterns and techniques.`;
}

export default function ProblemExplorer() {
  const [selectedTopic, setSelectedTopic] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const tagDropdownRef = useRef(null)
  const { addToast } = useToastStore()
  const { setSelectedProblem, getSelectedProblem } = useWorkspaceStore()
  const { sessions, currentSessionId, createSession, setCurrentSession, addMessage, updateSessionTitle } = useChatStore()

  // Fetch tag stats
  const { data: tagStats, isLoading: tagsLoading } = useQuery({
    queryKey: ['tag-stats'],
    queryFn: () => problemService.getTagStats(),
    staleTime: 5 * 60 * 1000,
  })

  // All available tags (from tagStats keys)
  const allTags = useMemo(() => {
    if (!tagStats) return []
    return Object.keys(tagStats).sort()
  }, [tagStats])

  // Infinite query for problems
  const {
    data: problemsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: problemsLoading,
    error: problemsError,
  } = useInfiniteQuery({
    queryKey: ['learning-problems-paginated', selectedTopic, selectedDifficulty],
    queryFn: ({ pageParam = 0 }) => {
      if (selectedTopic === 'All') {
        return problemService.getProblems(pageParam, PAGE_SIZE, selectedDifficulty)
      }
      return problemService.getProblems(pageParam, PAGE_SIZE, selectedDifficulty, [selectedTopic])
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length
      return nextPage < lastPage.totalPages ? nextPage : undefined
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000,
  })

  const allProblems = problemsData?.pages.flatMap(page => page.content) || []
  const totalElements = problemsData?.pages[0]?.totalElements || 0

  // Get solved set
  const [solvedSet, setSolvedSet] = useState(new Set())
  useEffect(() => {
    getSolvedIds().then(setSolvedSet)
  }, [])

  // Apply filters
  const filteredProblems = useMemo(() => {
    let filtered = allProblems

    if (searchQuery.trim()) {
      const q = normalize(searchQuery)
      filtered = filtered.filter(p =>
          normalize(p.title).includes(q) ||
          p.tags?.some(t => normalize(t).includes(q))
      )
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty)
    }

    if (selectedStatus === 'Solved') {
      filtered = filtered.filter(p => solvedSet.has(p.id))
    } else if (selectedStatus === 'Unsolved') {
      filtered = filtered.filter(p => !solvedSet.has(p.id))
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(p =>
          p.tags?.some(tag => selectedTags.includes(tag))
      )
    }

    return filtered
  }, [allProblems, searchQuery, selectedDifficulty, selectedStatus, selectedTags, solvedSet])

  const topics = useMemo(() => {
    if (!tagStats) return ['All']
    return ['All', ...Object.keys(tagStats)]
  }, [tagStats])

  const getTopicCount = (topic) => {
    if (topic === 'All') return totalElements
    return tagStats?.[topic] || 0
  }

  // Get topic intro using fallback generator
  const getTopicIntro = (topic) => {
    if (topic === 'All') return 'A balanced set across all available tracks.'
    return generateFallbackIntro(topic)
  }

  // Infinite scroll observer
  const loadMoreRef = useRef(null)
  const handleObserver = useCallback((entries) => {
    const [entry] = entries
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: '100px',
    })
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [handleObserver])

  const ensureLearningSession = async () => {
    const existing = sessions.find(s => s.mode === 'LEARNING')
    if (existing) {
      setCurrentSession(existing.id)
      return existing.id
    }
    return await createSession(null, 'Learning Assistant', 'LEARNING')
  }

  const askAiMutation = useMutation({
    mutationFn: async () => {
      const suggestions = filteredProblems.slice(0, 4)
      const topicText = selectedTopic === 'All' ? 'a balanced DSA starter path' : selectedTopic
      const diffText = selectedDifficulty ? ` (${selectedDifficulty} difficulty)` : ''
      const response = await hintService.requestHint(
          null,
          `Available questions: ${suggestions.map(p => `${p.title} (${p.difficulty})`).join(', ')}`,
          `Suggest a short learning path for ${topicText}${diffText}. Keep it concise and mention why these questions are good practice.`,
          'LEARNING'
      )
      return { response, suggestions, topicText }
    },
    onSuccess: async ({ response, suggestions, topicText }) => {
      const sessionId = await ensureLearningSession()
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
        conversation: `Topic: ${topicText}\nSuggestions: ${suggestions.map(p => p.title).join(', ')}\n${response?.hint || ''}`,
      }).then(result => {
        if (result?.title) updateSessionTitle(sessionId, result.title)
      }).catch(() => {})
    },
    onError: err => addToast(getErrorMessage(err), 'error'),
  })

  const selectProblem = (problem) => {
    setSelectedProblem(problem, 'LEARNING')
  }

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedDifficulty('')
    setSelectedStatus('All')
    setSearchQuery('')
    setSelectedTags([])
  }

  const isLoading = tagsLoading || (problemsLoading && allProblems.length === 0)
  if (problemsError) return <div className="p-4 text-neon-red">Failed to load problems</div>

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setShowTagDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
      <div className="leetcode-panel flex h-full min-h-0 flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 px-4 py-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-txt-primary">
            <ListChecks size={16} className="text-violet" />
            Problem Explorer
          </div>
          <p className="text-xs leading-relaxed text-txt-muted">{getTopicIntro(selectedTopic)}</p>
        </div>

        {/* Topic pills */}
        <div className="shrink-0 border-b border-white/10 px-3 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
            {topics.map(topic => (
                <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap ${
                        selectedTopic === topic
                            ? 'bg-violet/10 text-violet border border-violet/25'
                            : 'bg-white/[0.02] text-txt-muted border border-transparent hover:border-white/10 hover:text-txt-secondary'
                    }`}
                >
                  {topic} <span className="opacity-60">{getTopicCount(topic)}</span>
                </button>
            ))}
          </div>
        </div>

        {/* Filters row: Difficulty, Status, Tag dropdown, Clear */}
        <div className="shrink-0 border-b border-white/10 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty */}
            <div className="flex items-center gap-1 bg-white/5 rounded-md p-0.5">
              {DIFFICULTIES.map(diff => (
                  <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? '' : diff)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                          selectedDifficulty === diff
                              ? 'bg-cyan/20 text-cyan'
                              : 'text-txt-muted hover:text-txt-primary'
                      }`}
                  >
                    {diff}
                  </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1 bg-white/5 rounded-md p-0.5">
              {STATUS_OPTIONS.map(status => (
                  <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                          selectedStatus === status
                              ? 'bg-cyan/20 text-cyan'
                              : 'text-txt-muted hover:text-txt-primary'
                      }`}
                  >
                    {status}
                  </button>
              ))}
            </div>

            {/* Tag dropdown */}
            <div className="relative" ref={tagDropdownRef}>
              <button
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 text-txt-muted hover:text-txt-primary"
              >
                <Filter size={12} />
                Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
              </button>
              {showTagDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-64 max-h-48 overflow-y-auto rounded-md border border-white/10 bg-black/90 backdrop-blur z-20 p-2">
                    <div className="flex flex-wrap gap-1">
                      {allTags.map(tag => (
                          <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                                  selectedTags.includes(tag)
                                      ? 'bg-cyan/20 text-cyan'
                                      : 'bg-white/5 text-txt-muted hover:text-txt-primary'
                              }`}
                          >
                            {tag}
                          </button>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            {/* Clear filters */}
            <button
                onClick={clearFilters}
                className="px-2 py-1 rounded-md text-[11px] font-medium text-txt-muted hover:text-cyan transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="shrink-0 px-3 py-2 border-b border-white/10">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-muted" />
            <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by title or tag..."
                className="w-full bg-black/30 border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-cyan/30 transition-colors"
            />
          </div>
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 size={24} className="animate-spin text-cyan" /></div>
          ) : filteredProblems.length === 0 ? (
              <div className="text-center py-8"><p className="text-xs text-txt-muted">No problems match your filters</p></div>
          ) : (
              <div className="divide-y divide-white/[0.04]">
                {filteredProblems.map((problem, idx) => {
                  const isSelected = getSelectedProblem('LEARNING')?.id === problem.id
                  const globalNumber = idx + 1
                  const isSolved = solvedSet.has(problem.id)
                  return (
                      <button
                          key={problem.id}
                          onClick={() => selectProblem(problem)}
                          className={`w-full text-left px-4 py-3 transition-all group ${
                              isSelected
                                  ? 'bg-violet/[0.06] border-l-2 border-l-violet'
                                  : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[11px] font-mono text-txt-muted w-6 shrink-0 text-right">{globalNumber}</span>
                          <Circle size={14} className={`shrink-0 mt-0.5 ${isSolved ? 'fill-neon-green text-neon-green' : 'text-txt-muted'}`} />
                          <div className="min-w-0 flex-1">
                            <h3 className={`text-[13px] font-medium truncate ${isSelected ? 'text-violet' : 'text-txt-primary group-hover:text-txt-primary'}`}>
                              {problem.title}
                              {isSolved && <span className="ml-2 text-[9px] text-neon-green">✓</span>}
                            </h3>
                            <p className="text-[11px] text-txt-muted mt-0.5 line-clamp-1">{truncate(problem.originalText, 80)}</p>
                          </div>
                          <ChevronRight size={12} className={`shrink-0 mt-1 transition-colors ${isSelected ? 'text-violet' : 'text-txt-muted group-hover:text-txt-secondary'}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-2 pl-8">
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${getDifficultyBg(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                          {problem.tags?.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[9px] text-txt-muted bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                        {tag}
                      </span>
                          ))}
                        </div>
                      </button>
                  )
                })}
              </div>
          )}
          {/* Linear buffering indicator */}
          {isFetchingNextPage && (
              <div className="my-4 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-1 rounded-full bg-gradient-to-r from-cyan to-violet animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }} />
              </div>
          )}
          {/* Sentinel for infinite scroll */}
          {hasNextPage && !isFetchingNextPage && <div ref={loadMoreRef} className="h-10" />}
        </div>

        {/* Ask AI button */}
        <div className="shrink-0 border-t border-white/10 px-3 py-2">
          <button
              onClick={() => askAiMutation.mutate()}
              disabled={!filteredProblems.length || askAiMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-md border border-violet/20 bg-violet/[0.06] px-3 py-2 text-xs font-medium text-violet hover:bg-violet/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles size={12} />
            {askAiMutation.isPending ? 'Generating...' : 'Ask AI for a Learning Path'}
          </button>
        </div>
      </div>
  )
}