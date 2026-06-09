import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import ChatInterface from '../components/ChatInterface'
import { CodeWorkspace } from '../components/CodeWorkspace'
import { TopBar } from '../components/TopBar'
import { LearningWelcome } from '../components/LearningWelcome'
import useChatStore from '../store/chatStore'
import useInterviewStore from '../store/interviewStore'
import useWorkspaceStore from '../store/workspaceStore'
import { ToastContainer } from '../components/ToastContainer'
import useUIStore from '../store/uiStore'
import { getThemePreset } from '../utils/theme'
import { getDifficultyBg, getModeDescription } from '../utils/format'
import { BookOpen, ListChecks, MessageCircle, Share2, Target, Minimize2, Maximize2, PanelRightClose, PanelLeftClose, X } from 'lucide-react'
import useToastStore from '../store/toastStore'
import { InterviewStartModal } from '../components/InterviewStartModal'
import { hintService } from '../api/hintService'

export function WorkspacePage() {
    const navigate = useNavigate()
    const {
        mode,
        currentSessionId,
        isSidebarOpen,
        toggleSidebar,
        setMode,
        createSession,
        setCurrentSession,
        addMessage,
        updateSessionTitle,
        sessions
    } = useChatStore()
    const theme = useUIStore((state) => state.theme)
    const themePreset = getThemePreset(theme)
    const { addToast } = useToastStore()
    const { startSession, getSession, getActiveInterviewSession } = useInterviewStore()
    const { selectedProblem, setSelectedProblem } = useWorkspaceStore()
    const isStandard = mode === 'STANDARD'

    const sessionData = useInterviewStore((state) => state.sessions[currentSessionId])
    const isSessionStarted = sessionData?.started === true

    const [showInterviewModal, setShowInterviewModal] = useState(false)
    const [descriptionCollapsed, setDescriptionCollapsed] = useState(false)
    const [aiCollapsed, setAiCollapsed] = useState(false)
    const [codeMaximized, setCodeMaximized] = useState(false)

    const handleCloseModal = () => {
        setShowInterviewModal(false)
        setMode('STANDARD')
    }

    const handleStartInterview = (topics, difficulty, timeLimit) => {
        const activeInterview = getActiveInterviewSession();
        if (activeInterview) {
            setCurrentSession(activeInterview.sessionId);
            addToast('End the active interview before starting a new one.', 'warning');
            return;
        }

        const currentInterviewData = getSession(currentSessionId);
        let sessionId = currentSessionId;
        if (!sessionId || sessions.find((s) => s.id === sessionId)?.mode !== 'INTERVIEW' || currentInterviewData?.endedAt) {
            sessionId = createSession(selectedProblem?.id || null, 'Interview Assistant', 'INTERVIEW');
        }
        setCurrentSession(sessionId);

        startSession(sessionId, {
            mode: 'INTERVIEW',
            topics,
            difficulty,
            timeLimit
        });
        addMessage(sessionId, {
            id: `interview-started-${Date.now()}`,
            role: 'assistant',
            content: `Interview started. Difficulty: ${difficulty}. Topics: ${topics.join(', ')}.`,
            timestamp: new Date().toISOString(),
        });
        hintService.generateSessionTitle({
            mode: 'INTERVIEW',
            problemTitle: selectedProblem?.title || '',
            conversation: `Interview started\nDifficulty: ${difficulty}\nTopics: ${topics.join(', ')}`
        }).then((result) => {
            if (result?.title) updateSessionTitle(sessionId, result.title)
        }).catch(() => {})

        setShowInterviewModal(false);
    }

    const mainMarginLeft = isSidebarOpen && isStandard ? '300px' : '0px'

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
        } catch {
            addToast('Failed to copy link', 'error')
        }
    }

    const showDescription = !codeMaximized && !descriptionCollapsed
    const showAi = !codeMaximized && !aiCollapsed
    const gridColumns = codeMaximized
        ? 'xl:grid-cols-1'
        : showDescription && showAi
            ? 'xl:grid-cols-[minmax(280px,34%)_minmax(380px,42%)_minmax(260px,24%)]'
            : showDescription
                ? 'xl:grid-cols-[minmax(300px,36%)_minmax(520px,64%)]'
                : showAi
                    ? 'xl:grid-cols-[minmax(520px,68%)_minmax(280px,32%)]'
                    : 'xl:grid-cols-1'

    const workspaceControls = (
        <>
            <button
                onClick={() => setDescriptionCollapsed((value) => !value)}
                className="rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary"
                title={descriptionCollapsed ? 'Show description' : 'Hide description'}
            >
                <PanelLeftClose size={14} />
            </button>
            <button
                onClick={() => setAiCollapsed((value) => !value)}
                className="rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary"
                title={aiCollapsed ? 'Show AI chat' : 'Hide AI chat'}
            >
                <PanelRightClose size={14} />
            </button>
            <button
                onClick={() => {
                    const next = !codeMaximized
                    setCodeMaximized(next)
                    if (next) {
                        setDescriptionCollapsed(true)
                        setAiCollapsed(true)
                    } else {
                        setDescriptionCollapsed(false)
                        setAiCollapsed(false)
                    }
                }}
                className="rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary"
                title={codeMaximized ? 'Restore workspace' : 'Maximize code editor'}
            >
                {codeMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
        </>
    )

    const renderProblemPanel = () => (
        <section className="leetcode-panel flex min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 relative border-b border-white/10 px-4 py-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-txt-secondary">
                        {mode === 'INTERVIEW' ? <Target size={14} className="text-magenta" /> : <BookOpen size={14} className="text-violet" />}
                        <span>{mode === 'INTERVIEW' ? 'Interview Prompt' : 'Problem'}</span>
                    </div>
                    <button
                        onClick={() => setDescriptionCollapsed(true)}
                        className="rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary"
                        title="Minimize description"
                    >
                        <Minimize2 size={14} />
                    </button>
                </div>

                {/* Close button – only visible when a problem is selected */}
                {selectedProblem && (
                    <button
                        onClick={() => setSelectedProblem(null)}
                        className="absolute top-3 right-12 rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary transition-colors"
                        title="Close problem"
                    >
                        <X size={14} />
                    </button>
                )}

                {selectedProblem ? (
                    <>
                        <h1 className="text-lg font-semibold leading-snug text-txt-primary">{selectedProblem.title}</h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${getDifficultyBg(selectedProblem.difficulty)}`}>
                                {selectedProblem.difficulty}
                            </span>
                            {selectedProblem.tags?.slice(0, 4).map((tag) => (
                                <span key={tag} className="rounded border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-txt-muted">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-semibold text-txt-primary">No problem selected</h1>
                        <p className="mt-2 text-sm leading-relaxed text-txt-secondary">
                            Pick a coding problem to unlock run, submit, hints, and interview follow-ups.
                        </p>
                        <button
                            onClick={() => navigate('/problems')}
                            className="mt-4 inline-flex items-center gap-2 rounded-md border border-cyan/30 bg-cyan/10 px-3 py-2 text-sm font-medium text-cyan hover:bg-cyan/15"
                        >
                            <ListChecks size={14} /> Browse Problems
                        </button>
                    </>
                )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
                {selectedProblem ? (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-txt-secondary">
                        {selectedProblem.originalText || 'No description available.'}
                    </div>
                ) : (
                    <div className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-txt-secondary">
                        {getModeDescription(mode)}
                    </div>
                )}
            </div>
        </section>
    )

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-void">
            <div className="absolute inset-0 pointer-events-none" style={{ background: themePreset.background }} />
            <ToastContainer />

            {isStandard && <Sidebar />}

            <main
                className="relative z-10 h-full transition-all duration-300 ease-out"
                style={{ marginLeft: mainMarginLeft }}
            >
                <div className="h-full p-4 md:p-5 lg:p-6 flex flex-col gap-4 overflow-hidden">
                    {isStandard && (
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-txt-secondary hover:text-cyan transition-colors text-sm"
                            >
                                <Share2 size={14} /> Share Session
                            </button>
                        </div>
                    )}

                    {isStandard ? (
                        <div className="flex-1 min-h-0 overflow-hidden max-w-4xl mx-auto w-full">
                            <ChatInterface />
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
                            <TopBar onToggleSidebar={toggleSidebar} />

                            {mode === 'LEARNING' && !selectedProblem ? (
                                <LearningWelcome />
                            ) : mode === 'INTERVIEW' && !isSessionStarted ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="leetcode-panel p-8 max-w-md w-full text-center">
                                        <div className="w-14 h-14 rounded-lg bg-magenta/10 border border-magenta/20 flex items-center justify-center mx-auto mb-4">
                                            <Target size={28} className="text-magenta" />
                                        </div>
                                        <h2 className="text-xl font-semibold text-txt-primary mb-2">Interview Mode</h2>
                                        <p className="text-sm text-txt-secondary mb-6">
                                            Configure your interview session. Copy/paste will be disabled and your score tracked.
                                        </p>
                                        <button
                                            onClick={() => setShowInterviewModal(true)}
                                            className="px-6 py-2 rounded-md bg-magenta/10 border border-magenta/20 text-magenta hover:bg-magenta/20 transition-all"
                                        >
                                            Configure & Start
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`grid flex-1 min-h-0 grid-cols-1 gap-3 overflow-hidden ${gridColumns}`}>
                                    {showDescription && renderProblemPanel()}
                                    <div className="min-h-[420px] overflow-hidden xl:min-h-0">
                                        <CodeWorkspace workspaceControls={workspaceControls} />
                                    </div>
                                    {showAi && (
                                        <section className="leetcode-panel flex min-h-[320px] flex-col overflow-hidden xl:min-h-0">
                                            <div className="shrink-0 border-b border-white/10 px-4 py-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-sm font-semibold text-txt-primary">
                                                            <MessageCircle size={15} className={mode === 'INTERVIEW' ? 'text-magenta' : 'text-violet'} />
                                                            {mode === 'INTERVIEW' ? 'Interviewer' : 'Tutor'}
                                                        </div>
                                                        <p className="mt-1 text-xs text-txt-muted">{getModeDescription(mode)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setAiCollapsed(true)}
                                                        className="rounded-md p-1.5 text-txt-muted hover:bg-white/10 hover:text-txt-primary"
                                                        title="Minimize AI chat"
                                                    >
                                                        <Minimize2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="min-h-0 flex-1">
                                                <ChatInterface showProblemPanel={false} />
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <InterviewStartModal
                isOpen={showInterviewModal}
                onClose={handleCloseModal}
                onStart={handleStartInterview}
            />
        </div>
    )
}