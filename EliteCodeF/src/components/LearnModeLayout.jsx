import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Target, Zap } from 'lucide-react'
import ProblemExplorer from './ProblemExplorer'
import { CodeWorkspace } from './CodeWorkspace'
import CalendarWidget from './CalendarWidget'
import ChatInterface from './ChatInterface'
import useWorkspaceStore from '../store/workspaceStore'
import { attemptService } from '../api/attemptService'
import { getDifficultyBg } from '../utils/format'

export default function LearnModeLayout() {
    const { getSelectedProblem, setSelectedProblem } = useWorkspaceStore()
    const selectedProblem = getSelectedProblem('LEARNING')
    const [explorerCollapsed, setExplorerCollapsed] = useState(false)
    const [aiPanelCollapsed, setAiPanelCollapsed] = useState(false)

    // Fetch real solved dates and compute streak
    const { data: solvedDates = [] } = useQuery({
        queryKey: ['solved-dates'],
        queryFn: () => attemptService.getSolvedDates(),
        staleTime: 5 * 60 * 1000,
    })

    // Compute streak from solvedDates
    const computeStreak = () => {
        if (!solvedDates.length) return 0
        const dates = new Set(solvedDates)
        let streak = 0
        let current = new Date()
        current.setHours(0, 0, 0, 0)
        while (dates.has(current.toDateString())) {
            streak++
            current.setDate(current.getDate() - 1)
        }
        return streak
    }
    const streak = computeStreak()

    const handleCloseProblem = () => {
        setSelectedProblem(null, 'LEARNING')
    }

    const renderProblemDescriptionBar = () => {
        if (!selectedProblem) return null

        return (
            <div className="shrink-0 border-b border-white/10 bg-white/[0.015] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm font-semibold text-txt-primary">{selectedProblem.title}</h2>
                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${getDifficultyBg(selectedProblem.difficulty)}`}>
                                {selectedProblem.difficulty}
                            </span>
                        </div>
                        {selectedProblem.tags && selectedProblem.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {selectedProblem.tags.slice(0, 3).map(tag => (
                                    <span key={tag} className="text-[10px] text-txt-muted bg-white/[0.03] px-1.5 py-0.5 rounded border border-white/5">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-violet bg-violet/5 px-2 py-1 rounded-md">
                            <Target size={12} />
                            <span className="font-medium">{streak} day streak</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // When no problem is selected – show Problem Explorer full width + AI panel
    if (!selectedProblem) {
        return (
            <div className="flex-1 flex min-h-0 overflow-hidden gap-3">
                <div className="flex-1 min-w-0 overflow-hidden leetcode-panel flex flex-col">
                    <div className="flex-1 min-h-0">
                        <ProblemExplorer />
                    </div>
                </div>

                <div className={`shrink-0 transition-all duration-300 ease-out flex flex-col gap-3 ${aiPanelCollapsed ? 'w-12' : 'w-[min(360px,28vw)]'}`}>
                    {aiPanelCollapsed ? (
                        <div className="h-full flex flex-col items-center pt-3">
                            <button onClick={() => setAiPanelCollapsed(false)} className="p-2 rounded-lg hover:bg-white/10 text-txt-muted">
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-end px-1">
                                <button onClick={() => setAiPanelCollapsed(true)} className="p-1 rounded hover:bg-white/10 text-txt-muted">
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                            <CalendarWidget solvedDates={solvedDates} streak={streak} />
                            <div className="flex-1 min-h-0 overflow-hidden leetcode-panel flex flex-col">
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    <ChatInterface showProblemPanel={false} learningProblems={[]} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    // When a problem is selected – three‑column layout
    const explorerWidth = explorerCollapsed ? 'w-12' : 'w-[min(400px,30vw)]'
    const aiWidth = aiPanelCollapsed ? 'w-12' : 'w-[min(360px,28vw)]'

    return (
        <div className="flex-1 flex min-h-0 overflow-hidden gap-3">
            {/* LEFT: Problem Explorer */}
            <div className={`${explorerWidth} shrink-0 transition-all duration-300 ease-out`}>
                {explorerCollapsed ? (
                    <div className="h-full flex flex-col items-center pt-3">
                        <button onClick={() => setExplorerCollapsed(false)} className="p-2 rounded-lg hover:bg-white/10 text-txt-muted hover:text-txt-primary">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <button onClick={() => setExplorerCollapsed(true)} className="p-1 rounded hover:bg-white/10 text-txt-muted">
                                <ChevronLeft size={14} />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ProblemExplorer />
                        </div>
                    </div>
                )}
            </div>

            {/* CENTRE: Code Workspace */}
            <div className="flex-1 min-w-0 flex flex-col gap-0 overflow-hidden">
                {renderProblemDescriptionBar()}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <CodeWorkspace onCloseProblem={handleCloseProblem} />
                </div>
            </div>

            {/* RIGHT: AI Tutor */}
            <div className={`${aiWidth} shrink-0 transition-all duration-300 ease-out flex flex-col gap-3`}>
                {aiPanelCollapsed ? (
                    <div className="h-full flex flex-col items-center pt-3">
                        <button onClick={() => setAiPanelCollapsed(false)} className="p-2 rounded-lg hover:bg-white/10 text-txt-muted">
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-end px-1">
                            <button onClick={() => setAiPanelCollapsed(true)} className="p-1 rounded hover:bg-white/10 text-txt-muted">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <CalendarWidget solvedDates={solvedDates} streak={streak} />
                        <div className="flex-1 min-h-0 overflow-hidden leetcode-panel flex flex-col">
                            <div className="flex-1 min-h-0 overflow-hidden">
                                <ChatInterface showProblemPanel={false} learningProblems={[]} />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}