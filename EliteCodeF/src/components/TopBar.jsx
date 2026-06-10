import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
    User, LogOut, Settings,
    Target, BookOpen, Sparkles, Zap, ChevronDown, Menu, XCircle,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useInterviewStore from '../store/interviewStore'

const MODES = [
    { key: 'STANDARD', icon: Sparkles, label: 'Standard', color: 'cyan' },
    { key: 'INTERVIEW', icon: Target, label: 'Interview', color: 'magenta' },
    { key: 'LEARNING', icon: BookOpen, label: 'Learning', color: 'violet' },
]

export function TopBar({ onToggleSidebar }) {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { addToast } = useToastStore()
    const { getActiveInterviewSession, endAndClearInterview } = useInterviewStore()
    const {
        mode, setMode, currentSessionByMode,
        currentSessionId,
        createSession, setCurrentSession, addMessage
    } = useChatStore()

    const [showProfileMenu, setShowProfileMenu] = useState(false)
    const [profilePos, setProfilePos] = useState({ top: 0, left: 0 })
    const profileButtonRef = useRef(null)
    const profileMenuRef = useRef(null)

    const activeInterview = getActiveInterviewSession()
    const isActiveInterview = Boolean(activeInterview)
    const isInterviewStarted = mode === 'INTERVIEW' && isActiveInterview

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

    const handleQuitInterview = async () => {
        if (!activeInterview) return

        const confirmed = window.confirm('End this interview? Your progress will be lost.')
        if (!confirmed) return

        const sessionId = activeInterview.sessionId

        // Add final message before ending
        await addMessage(sessionId, {
            id: `interview-ended-${Date.now()}`,
            role: 'assistant',
            content: `Interview ended manually. Final score: ${activeInterview.score ?? 0}. You can start a new interview anytime.`,
            timestamp: new Date().toISOString(),
        })

        endAndClearInterview(sessionId)
        setMode('STANDARD')

        // Ensure we have a STANDARD session
        if (!currentSessionByMode.STANDARD) {
            createSession(null, 'Standard Assistant', 'STANDARD')
        } else {
            setCurrentSession(currentSessionByMode.STANDARD)
        }

        addToast('Interview ended', 'info')
    }

    const handleModeChange = (newMode) => {
        if (newMode === mode) return

        if (isActiveInterview) {
            const confirmMsg = 'You have an active interview. Do you want to end it and switch mode?'
            if (window.confirm(confirmMsg)) {
                // End interview
                const sessionId = activeInterview.sessionId
                addMessage(sessionId, {
                    id: `interview-ended-${Date.now()}`,
                    role: 'assistant',
                    content: `Interview ended early. Final score: ${activeInterview.score ?? 0}.`,
                    timestamp: new Date().toISOString(),
                }).catch(() => {})
                endAndClearInterview(sessionId)
                // Now switch mode
                setMode(newMode)
                if (!currentSessionByMode[newMode]) {
                    createSession(null, `${newMode} Assistant`, newMode)
                }
                addToast(`Switched to ${newMode} mode`, 'info')
            }
            return
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
                    {isInterviewStarted && (
                        <button
                            onClick={handleQuitInterview}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neon-red/30 bg-neon-red/10 text-neon-red hover:bg-neon-red/20 transition-colors"
                            title="End interview"
                        >
                            <XCircle size={14} /> Quit Interview
                        </button>
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
        </>
    )
}