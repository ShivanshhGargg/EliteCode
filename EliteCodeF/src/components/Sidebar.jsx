import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PanelLeftClose, PanelLeftOpen, Plus, MessageSquare,
  Target, BookOpen, Sparkles, Zap, Trash2, User, LogOut, Settings
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useInterviewStore from '../store/interviewStore'

const MODES = [
  { key: 'STANDARD', icon: Sparkles, label: 'Standard', color: 'cyan', description: 'Balanced AI help and execution' },
  { key: 'INTERVIEW', icon: Target, label: 'Interview', color: 'magenta', description: 'Question-first technical coaching' },
  { key: 'LEARNING', icon: BookOpen, label: 'Learning', color: 'violet', description: 'Progressive hints and teaching' },
]

const colorMap = {
  cyan: 'text-cyan bg-cyan/10 border-cyan/20',
  magenta: 'text-magenta bg-magenta/10 border-magenta/20',
  violet: 'text-violet bg-violet/10 border-violet/20',
}

export function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { addToast } = useToastStore()
  const { getActiveInterviewSession } = useInterviewStore()
  const {
    isSidebarOpen, toggleSidebar,
    mode, setMode, currentSessionByMode,
    sessions, currentSessionId,
    createSession, setCurrentSession, deleteSession,
  } = useChatStore()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const activeInterview = getActiveInterviewSession()
  const isActiveInterview = Boolean(activeInterview)
  const standardHistory = sessions.filter((session) => session.mode === 'STANDARD' && session.hasWork)

  const handleNewChat = () => {
    const newId = createSession(null, 'STANDARD Assistant', 'STANDARD')
    setCurrentSession(newId)
  }

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

  return (
      <>
        {!isSidebarOpen && (
            <button
                onClick={toggleSidebar}
                className="fixed left-4 top-4 z-50 p-2.5 rounded-2xl glass-panel text-txt-secondary hover:text-cyan transition-all duration-300"
            >
              <PanelLeftOpen size={20} />
            </button>
        )}

        <aside
            className={`fixed left-0 top-0 h-screen glass-panel border-r border-white/5 flex flex-col transition-all duration-300 ease-out z-40 ${
                isSidebarOpen ? 'w-[300px] translate-x-0' : 'w-[300px] -translate-x-full'
            }`}
        >
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center shadow-[0_12px_24px_rgba(0,240,255,0.14)]">
                  <Zap size={16} className="text-void" />
                </div>
                <div>
                  <span className="block text-lg font-semibold gradient-text tracking-tight">EliteCode</span>
                  <span className="block text-[10px] uppercase tracking-[0.28em] text-txt-muted">IDE workspace</span>
                </div>
              </div>
              <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-xl text-txt-muted hover:text-txt-primary hover:bg-white/5 transition-colors"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>

            <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-cyan/10 border border-cyan/20
              text-cyan text-sm font-medium hover:bg-cyan/20 hover:shadow-glow-sm transition-all duration-300 active:scale-95"
            >
              <Plus size={16} />
              New Session
            </button>
          </div>

          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-txt-muted mb-3 px-1">Workspace Modes</p>
            <div className="space-y-2">
              {MODES.map((m) => {
                const Icon = m.icon
                const isActive = mode === m.key
                return (
                    <button
                        key={m.key}
                        onClick={() => handleModeChange(m.key)}
                        className={`w-full flex items-start gap-3 px-3 py-3 rounded-2xl text-left text-sm transition-all duration-300 border
                    ${isActive
                            ? `${colorMap[m.color]} shadow-[0_12px_30px_rgba(0,0,0,0.16)]`
                            : 'text-txt-secondary bg-white/[0.03] border-white/5 hover:text-txt-primary hover:border-white/10 hover:bg-white/[0.05]'
                        }`}
                    >
                      <Icon size={16} className="mt-0.5 shrink-0" />
                      <span className="min-w-0 flex-1">
                    <span className="block font-medium">{m.label}</span>
                    <span className="block text-[11px] leading-relaxed text-txt-muted">{m.description}</span>
                  </span>
                    </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-txt-muted mb-3 px-1">Standard History</p>
            <div className="space-y-1">
              {standardHistory.length === 0 && (
                  <p className="text-xs text-txt-muted px-3 py-4 text-center">No chats yet</p>
              )}
              {standardHistory.map((session) => (
                  <div
                      key={session.id}
                      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                  ${currentSessionId === session.id
                          ? 'bg-white/5 border border-white/10 text-txt-primary'
                          : 'text-txt-secondary hover:text-txt-primary hover:bg-white/5'
                      }`}
                  >
                    <button
                        onClick={() => {
                          setMode('STANDARD')
                          setCurrentSession(session.id)
                        }}
                        className="flex items-center gap-2 flex-1 text-left overflow-hidden"
                    >
                      <MessageSquare size={14} className="shrink-0" />
                      <span className="truncate">{session.title || 'Untitled'}</span>
                    </button>
                    <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-neon-red/10 hover:text-neon-red transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
              ))}
            </div>
          </div>

          {/* Profile section (for Standard mode) */}
          <div className="p-4 border-t border-white/5 relative">
            <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-white text-xs font-bold shadow-[0_12px_24px_rgba(255,0,160,0.12)]">
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm text-txt-primary truncate">{user?.firstName || user?.email || 'User'}</p>
                <p className="text-[10px] text-txt-muted">Standard Mode</p>
              </div>
            </button>

            {showUserMenu && (
                <div className="absolute bottom-full left-4 right-4 mb-2 glass-panel rounded-2xl overflow-hidden shadow-2xl">
                  <button
                      onClick={() => { navigate('/progress'); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/5 transition-colors"
                  >
                    <User size={14} /> Progress
                  </button>
                  <button
                      onClick={() => { navigate('/account-settings'); setShowUserMenu(false) }}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-txt-secondary hover:text-txt-primary hover:bg-white/5 transition-colors"
                  >
                    <Settings size={14} /> Account Settings
                  </button>
                  <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-txt-secondary hover:text-neon-red hover:bg-neon-red/5 transition-colors"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
            )}
          </div>
        </aside>
      </>
  )
}