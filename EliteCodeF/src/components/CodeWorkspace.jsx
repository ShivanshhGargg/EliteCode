import { useState, useEffect, useRef } from 'react'
import { Play, Bug, CheckCircle, ChevronDown, Clock, Cpu, Minimize2, Maximize2, GripHorizontal, Loader2, Terminal } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { attemptService } from '../api/attemptService'
import { hintService } from '../api/hintService'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useWorkspaceStore from '../store/workspaceStore'
import { CodeEditor } from './CodeEditor'
import { NeonButton } from './NeonButton'
import { usePollAttempt } from '../hooks/usePollAttempt'
import { getErrorMessage } from '../utils/error'
import { formatTime } from '../utils/format'

const STARTER_CODE = {
  JAVA: `class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}`,
  PYTHON: `class Solution:
    def solve(self, nums):
        # Write your solution here
        return 0`,
  JAVASCRIPT: `function solve(nums) {
    // Write your solution here
    return 0;
}`,
  CPP: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`,
}

const LANGUAGES = [
  { value: 'JAVA', label: 'Java' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'CPP', label: 'C++' },
]

export function CodeWorkspace({ workspaceControls = null }) {
  const [code, setCode] = useState(STARTER_CODE.JAVA)
  const [language, setLanguage] = useState('JAVA')
  const [attemptId, setAttemptId] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [resultsHeight, setResultsHeight] = useState(35) // percentage of available space
  const [isResultsMinimized, setIsResultsMinimized] = useState(false)
  const isDraggingHeight = useRef(false)
  const containerRef = useRef(null)

  const { mode, currentSessionId, markSessionWork, updateSessionTitle } = useChatStore()
  const { addToast } = useToastStore()
  const { selectedProblem } = useWorkspaceStore()

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: () => {
      if (!selectedProblem?.id) {
        throw new Error('Select a problem before running code')
      }
      return attemptService.submitAttempt(
          selectedProblem.id,
          mode,
          code,
          '',
          language
      )
    },
    onSuccess: (data) => {
      setAttemptId(data.id)
      setFeedback(null)
      if (currentSessionId) {
        markSessionWork(currentSessionId)
        hintService.generateSessionTitle({
          mode,
          problemTitle: selectedProblem?.title || '',
          conversation: `${language} code run submitted for ${selectedProblem?.title || 'a coding problem'}\n${code.slice(0, 1200)}`,
        }).then((result) => {
          if (result?.title) updateSessionTitle(currentSessionId, result.title)
        }).catch(() => {})
      }
    },
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  })

  const { attempt, isLoading: polling } = usePollAttempt(attemptId, async (data) => {
    if (data.status === 'FAILED') {
      addToast('Some tests failed', 'error')
    }
    try {
      const feedbackData = await attemptService.getAttemptFeedback(data.id)
      setFeedback(feedbackData)
    } catch (err) {
      console.error('Feedback fetch failed', err)
    }
  })

  useEffect(() => {
    setCode(STARTER_CODE[language])
  }, [language])

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    setCode(STARTER_CODE[newLang])
  }

  const handleDebug = () => {
    if (!selectedProblem?.id) {
      return
    }
    submit()
  }

  const handleSubmitAttempt = () => {
    if (!selectedProblem?.id) {
      return
    }
    submit()
  }

  const isLearnMode = mode === 'LEARNING'
  const timeComplexity = feedback?.timeComplexity || attempt?.timeComplexity || '—'
  const spaceComplexity = feedback?.spaceComplexity || attempt?.spaceComplexity || '—'
  const testResults = feedback?.testResults || attempt?.testResults || []
  const isLoading = isSubmitting || polling

  const handleMouseMove = (e) => {
    if (!isDraggingHeight.current) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const toolbar = document.getElementById('code-workspace-toolbar')
    const toolbarHeight = toolbar?.offsetHeight || 48
    const availableHeight = rect.height - toolbarHeight
    const mouseYRelative = e.clientY - rect.top - toolbarHeight
    let newHeight = ((availableHeight - mouseYRelative) / availableHeight) * 100
    newHeight = Math.min(Math.max(newHeight, 15), 70)
    setResultsHeight(newHeight)
  }

  const handleMouseUp = () => {
    isDraggingHeight.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const startResize = (e) => {
    e.preventDefault()
    isDraggingHeight.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Calculate editor height based on results panel state
  const getEditorHeight = () => {
    if (isResultsMinimized) return '100%'
    return `calc(100% - ${resultsHeight}% - 12px)` // 12px for gap + handle
  }

  return (
      <div ref={containerRef} className="leetcode-panel flex h-full min-h-0 flex-col overflow-hidden">
        <div id="code-workspace-toolbar" className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary">
              <Terminal size={15} className="text-cyan" />
              Code
            </div>
            <div className="relative">
              <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="appearance-none bg-black/40 border border-white/15 rounded-md px-3 py-1.5 pr-8 text-sm text-txt-primary cursor-pointer hover:bg-black/60 focus:outline-none focus:ring-1 focus:ring-cyan/50"
              >
                {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-muted pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NeonButton variant="ghost" size="sm" onClick={handleDebug} disabled={isLoading}>
              <Bug size={12} className="mr-1" /> Debug
            </NeonButton>
            {isLearnMode && (
                <NeonButton variant="solid" size="sm" loading={isLoading} disabled={!selectedProblem?.id || isLoading} onClick={handleSubmitAttempt}>
                  <Play size={12} className="mr-1" /> Run
                </NeonButton>
            )}
            <NeonButton variant="solid" size="sm" loading={isLoading} disabled={!selectedProblem?.id || isLoading} onClick={handleSubmitAttempt}>
              <CheckCircle size={12} className="mr-1" /> Submit
            </NeonButton>
          </div>

          <div className="flex items-center gap-1">{workspaceControls}</div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-3 pt-0">
          <div className="rounded-md overflow-hidden border border-white/10" style={{ height: getEditorHeight() }}>
            <CodeEditor
                value={code}
                onChange={setCode}
                height="100%"
                language={language.toLowerCase()}
            />
          </div>

          {!isResultsMinimized && (
              <div
                  className="relative h-1 cursor-row-resize group my-2"
                  onMouseDown={startResize}
              >
                <div className="absolute inset-x-0 -top-1 h-3 bg-cyan/0 group-hover:bg-cyan/20 transition-colors rounded-full" />
                <GripHorizontal size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan/50 group-hover:text-cyan" />
              </div>
          )}

          <div
              className="rounded-md bg-black/30 border border-white/10 overflow-hidden flex flex-col"
              style={{ height: isResultsMinimized ? 'auto' : `${resultsHeight}%` }}
          >
            <div className="shrink-0 px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-semibold text-txt-muted uppercase tracking-wider">Test Results</span>
              <button
                  onClick={() => setIsResultsMinimized(!isResultsMinimized)}
                  className="p-1 rounded hover:bg-white/10 text-txt-muted transition-colors"
              >
                {isResultsMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
            </div>
            {!isResultsMinimized && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
                  {isLoading && !attempt ? (
                      <div className="text-txt-muted text-center py-6">
                        <Loader2 size={20} className="mx-auto mb-2 animate-spin opacity-60" />
                        <p className="text-xs">Running tests...</p>
                      </div>
                  ) : attempt ? (
                      <>
                        <div className={`font-mono font-bold ${attempt.status === 'COMPLETED' ? 'text-neon-green' : 'text-neon-red'}`}>
                          {attempt.status === 'COMPLETED' ? '✓ All tests passed' : '✗ Some tests failed'}
                        </div>
                        {attempt.executionTime && (
                            <div className="flex items-center gap-2 text-txt-muted">
                              <Clock size={12} />
                              <span>Executed in {formatTime(attempt.executionTime)}</span>
                            </div>
                        )}

                        <div className="border-t border-white/10 pt-2">
                          <div className="text-xs font-semibold text-txt-muted mb-1">Complexity</div>
                          <div className="space-y-1 text-xs">
                            <div>Time: <span className="text-violet-300">{timeComplexity}</span></div>
                            <div>Space: <span className="text-violet-300">{spaceComplexity}</span></div>
                          </div>
                        </div>

                        {testResults.length > 0 && (
                            <div className="border-t border-white/10 pt-2">
                              <div className="text-xs font-semibold text-txt-muted mb-1">Test cases</div>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {testResults.map((tc, idx) => (
                                    <div key={idx} className={`text-xs p-1.5 rounded ${tc.passed ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            <span className={tc.passed ? 'text-neon-green' : 'text-neon-red'}>
                              {tc.passed ? '✓' : '✗'} Test {idx + 1}
                            </span>
                                      {!tc.passed && tc.expected !== undefined && (
                                          <div className="text-txt-muted mt-0.5 text-[11px]">
                                            Expected: {String(tc.expected)}<br />
                                            Got: {String(tc.actual)}
                                          </div>
                                      )}
                                    </div>
                                ))}
                              </div>
                            </div>
                        )}
                      </>
                  ) : (
                      <div className="text-txt-muted text-center py-6">
                        <Cpu size={20} className="mx-auto mb-1 opacity-40" />
                        <p className="text-xs">{selectedProblem?.id ? 'Run or submit to see results' : 'Select a problem to run code'}</p>
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  )
}
