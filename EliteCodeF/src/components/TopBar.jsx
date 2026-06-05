import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
    User, LogOut, Settings,
    Target, BookOpen, Sparkles, Zap, ChevronDown, Menu, Timer,
    Pause, Play, RotateCcw, PlusCircle, StopCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useInterviewStore from '../store/interviewStore'
import { ModeTimer } from './ModeTimer'
import { LearningTimerModal } from './LearningTimerModal'

const MODES = [
    { key: 'STANDARD', icon: Sparkles, label: 'Standard', color: 'cyan' },
    { key: 'INTERVIEW', icon: Target, label: 'Interview', color: 'magenta' },
    { key: 'LEARNING', icon: BookOpen, label: 'Learning', color: 'violet' },
]

export function TopBar({ onToggleSidebar }) {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { addToast } = useToastStore()
    const { pauseTimer, resumeTimer, resetTimer, addTime, endSession, getSession, getActiveInterviewSession } = useInterviewStore()
    const {
        mode, setMode, currentSessionByMode,
        currentSessionId,
        createSession, setCurrentSession, addMessage
    } = useChatStore()

    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [showTimerModal, setShowTimerModal] = useState(false)
    const [profilePos, setProfilePos] = useState({ top: 0, left: 0 })
    const profileButtonRef = useRef(null)
    const profileMenuRef = useRef(null)

    const sessionData = getSession(currentSessionId)
    const activeInterview = getActiveInterviewSession()
    const isTimerRunning = sessionData?.started && !sessionData?.paused
    const hasTimer = sessionData?.timeLimit != null
    const isActiveInterview = Boolean(activeInterview)

    useEffect(() => {
        if (showProfileMenu && profileButtonRef.current) {
            const rect = profileButtonRef.current.getBoundingClientRect()
            setProfilePos({ top: rect.bottom + 4, left: rect.right - 180 })
        }
    }, [showProfileMenu])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                profileButtonRef.current &&
                !profileButtonRef.current.contains(e.target) &&
                !profileMenuRef.current?.contains(e.target)
            ) {
                setShowProfileMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleModeChange = (newMode) => {
        if (newMode === mode) return
        if (isActiveInterview && newMode !== 'INTERVIEW') {
            addToast('End the interview before switching modes.', 'warning')
            return
        }
        if (isActiveInterview && newMode === 'INTERVIEW') {
            setCurrentSession(activeInterview.sessionId)
        }
        setMode(newMode)
        if (!currentSessionByMode[newMode]) {
            createSession(null, `${newMode} Assistant`, newMode)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handlePauseResume = () => {
        if (!currentSessionId) return
        if (isTimerRunning) {
            pauseTimer(currentSessionId)
        } else {
            resumeTimer(currentSessionId)
        }
    }

    const handleResetTimer = () => {
        if (!currentSessionId) return
        resetTimer(currentSessionId)
    }

    const handleAddTime = (seconds) => {
        if (!currentSessionId) return
        addTime(currentSessionId, seconds)
    }

    const handleSetTimer = () => {
        if (!currentSessionId) {
            const newId = createSession(null, 'Learning Assistant', 'LEARNING')
            setCurrentSession(newId)
        }
        setShowTimerModal(true)
    }

    const handleEndInterview = () => {
        const interview = getActiveInterviewSession()
        if (!interview) return

        endSession(interview.sessionId)
        addMessage(interview.sessionId, {
            id: `interview-ended-${Date.now()}`,
            role: 'assistant',
            content: `Interview ended. Final score: ${interview.score ?? 0}. Review your answers, note weak areas, and start a fresh interview when you are ready.`,
            timestamp: new Date().toISOString(),
        })
        setCurrentSession(interview.sessionId)
        setMode('STANDARD')
    }

    // Navigation helpers
    const goToProgress = () => {
        setShowProfileMenu(false)
        navigate('/progress')
    }

    const goToAccountSettings = () => {
        setShowProfileMenu(false)
        navigate('/account-settings')
    }

    return (
        <>
            <div className="shrink-0 glass-panel rounded-2xl border border-white/10 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {onToggleSidebar && (
                        <button
                            onClick={onToggleSidebar}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center">
                            <Zap size={14} className="text-void" />
                        </div>
                        <span className="text-sm font-semibold gradient-text hidden sm:inline">EliteCode</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-0.5">
                        {MODES.map((m) => {
                            const Icon = m.icon
                            const isActive = mode === m.key
                            return (
                                <button
                                    key={m.key}
                                    onClick={() => handleModeChange(m.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${isActive
                                        ? `bg-${m.color}/20 text-${m.color} shadow-sm`
                                        : 'text-txt-muted hover:text-txt-primary hover:bg-white/10'}`}
                                >
                                    <Icon size={14} />
                                    {m.label}
                                </button>
                            )
                        })}
                    </div>

                </div>

                <div className="flex items-center gap-3">
                    {mode === 'LEARNING' && (
                        <div className="flex items-center gap-2">
                            <ModeTimer mode="LEARNING" sessionId={currentSessionId} />
                            {hasTimer && (
                                <>
                                    <button
                                        onClick={handlePauseResume}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                                        title={isTimerRunning ? 'Pause' : 'Resume'}
                                    >
                                        {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                                    </button>
                                    <button
                                        onClick={handleResetTimer}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                                        title="Reset timer"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleAddTime(300)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                                        title="Add 5 minutes"
                                    >
                                        <PlusCircle size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleAddTime(600)}
                                        className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                                        title="Add 10 minutes"
                                    >
                                        <PlusCircle size={14} className="text-cyan" />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleSetTimer}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-txt-muted transition-colors"
                                title="Set timer"
                            >
                                <Timer size={14} />
                            </button>
                        </div>
                    )}
                    {mode === 'INTERVIEW' && (
                        <div className="flex items-center gap-2">
                            <ModeTimer mode="INTERVIEW" sessionId={currentSessionId} />
                            {isActiveInterview && (
                                <button
                                    onClick={handleEndInterview}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-neon-red/25 bg-neon-red/10 px-2.5 py-1.5 text-xs font-medium text-neon-red hover:bg-neon-red/20 transition-colors"
                                    title="End interview"
                                >
                                    <StopCircle size={14} /> End
                                </button>
                            )}
                        </div>
                    )}

                    <button
                        ref={profileButtonRef}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-white text-xs font-bold">
                            {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-txt-primary hidden sm:inline">{user?.firstName || user?.email?.split('@')[0] || 'User'}</span>
                        <ChevronDown size={12} className="text-txt-muted" />
                    </button>
                </div>
            </div>

            {showProfileMenu && createPortal(
                <div
                    ref={profileMenuRef}
                    className="fixed w-48 glass-panel rounded-xl border border-white/10 shadow-2xl z-[1000]"
                    style={{ top: profilePos.top, left: profilePos.left }}
                >
                    <button
                        onClick={goToProgress}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/5"
                    >
                        <User size={14} /> Progress
                    </button>
                    <button
                        onClick={goToAccountSettings}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/5"
                    >
                        <Settings size={14} /> Account Settings
                    </button>
                    <hr className="border-white/10 my-1" />
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-txt-secondary hover:text-neon-red hover:bg-white/5"
                    >
                        <LogOut size={14} /> Logout
                    </button>
                </div>,
                document.body
            )}

            <LearningTimerModal
                isOpen={showTimerModal}
                onClose={() => setShowTimerModal(false)}
                sessionId={currentSessionId}
            />
        </>
    )
}
