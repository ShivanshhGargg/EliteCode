import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Paperclip, Sparkles, X, ChevronDown, ChevronUp, Plus, History, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { hintService } from '../api/hintService'
import useChatStore from '../store/chatStore'
import useToastStore from '../store/toastStore'
import useInterviewStore from '../store/interviewStore'
import useWorkspaceStore from '../store/workspaceStore'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { NeonButton } from './NeonButton'
import { getErrorMessage } from '../utils/error'
import { getDifficultyBg } from '../utils/format'

const modeWelcomes = {
  STANDARD: 'Ask me anything about the problem or your code. I can help you debug, optimise, or explain.',
  INTERVIEW: 'Welcome to Interview Mode. Choose topics and difficulty to begin your timed technical interview.',
  LEARNING: 'Learning mode – I will guide you step by step. Write your code and ask for explanations or hints.',
}

const modePrompts = {
  STANDARD: ['Analyse this code', 'Suggest improvements', 'Explain the algorithm'],
  INTERVIEW: ['Ask me the next question', 'Give a hint without solution', 'What is the complexity?'],
  LEARNING: ['Explain step by step', 'What is the pattern?', 'Show me a simpler example'],
}

const modeConversationGuides = {
  STANDARD: [
    'Mode: STANDARD',
    'Act as a practical coding assistant.',
    'Answer the user directly with explanation, trade-offs, complexity, and code when useful.',
  ].join('\n'),
  INTERVIEW: [
    'Mode: INTERVIEW',
    'Act as a technical interviewer, not a tutor.',
    'Ask one focused question at a time, evaluate the candidate answer briefly, and avoid giving a full solution unless the candidate explicitly asks after the interview is over.',
    'If the candidate asks a genuine interviewer question, answer naturally and then continue the interview.',
  ].join('\n'),
  LEARNING: [
    'Mode: LEARNING',
    'Act as a DSA tutor like a guided practice platform.',
    'Use progressive hints, pattern recognition, and alternative approaches. Do not reveal the complete solution until the learner asks for it or submits code for analysis.',
  ].join('\n'),
}

const modeAssistantMeta = {
  STANDARD: { label: 'Coding Assistant', accent: 'text-cyan' },
  INTERVIEW: { label: 'Interviewer', accent: 'text-magenta' },
  LEARNING: { label: 'DSA Tutor', accent: 'text-violet' },
}

const extractHintText = (payload) =>
    payload?.hint || payload?.content || payload?.message || payload?.response || 'I could not generate a hint right now.'

const wantsProblemSuggestions = (text = '') => {
  const lower = text.toLowerCase()
  return lower.includes('suggest') && (lower.includes('question') || lower.includes('problem') || lower.includes('practice'))
}

const MAX_FILE_SIZE = 1 * 1024 * 1024
const FORBIDDEN_EXTENSIONS = ['.zip', '.gz', '.rar', '.7z', '.tar', '.exe', '.dll', '.bin', '.class', '.jar']

const readFileHeader = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (!(result instanceof ArrayBuffer)) {
          resolve('')
          return
        }
        const arr = new Uint8Array(result)
        const header = Array.from(arr.slice(0, 8))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        resolve(header)
      }
      reader.readAsArrayBuffer(file.slice(0, 8))
    })

const isArchiveByHeader = (header) => {
  return header.startsWith('504b0304') || header.startsWith('52617221') || header.startsWith('377abcaf')
}

const isFileAllowed = async (file) => {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
  if (FORBIDDEN_EXTENSIONS.includes(ext)) return false
  if (file.type && file.type.startsWith('image/')) return false
  const header = await readFileHeader(file)
  return !isArchiveByHeader(header)
}

const readFileAsText = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result || '')
      reader.onerror = reject
      reader.readAsText(file)
    })

export default function ChatInterface({ showProblemPanel = true, learningProblems = [] }) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState([])
  const [problemPanelOpen, setProblemPanelOpen] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const { addToast } = useToastStore()
  const {
    mode,
    sessions,
    currentSessionId,
    createSession,
    addMessage,
    updateSessionTitle,
    setCurrentSession,
    setMode,
    deleteSession,
    loadMessages,
  } = useChatStore()
  const { getActiveInterviewSession } = useInterviewStore()
  const { getSelectedProblem, setSelectedProblem } = useWorkspaceStore()

  // ✅ Use mode-specific selected problem
  const selectedProblem = getSelectedProblem(mode)

  const session = useMemo(
      () => sessions.find((item) => item.id === currentSessionId) || null,
      [sessions, currentSessionId]
  )
  const messages = session?.messages || []
  const sessionData = useInterviewStore((state) => state.sessions[currentSessionId])
  const isSessionStarted = mode === 'INTERVIEW' ? sessionData?.started === true : true

  const ensureSession = async (withWelcome = false) => {
    let sess = sessions.find((item) => item.id === currentSessionId) || null
    let sessId = sess?.id || null

    if (!sess || sess.mode !== mode) {
      const existing = sessions.find((item) => item.mode === mode)
      if (existing) {
        setCurrentSession(existing.id)
        sessId = existing.id
        sess = existing
      } else {
        const newId = await createSession(selectedProblem?.id || null, `${mode} Assistant`, mode)
        sessId = newId
        sess = { id: newId, messages: [] }
        setCurrentSession(newId)
      }
    }

    if (withWelcome && sessId) {
      const latestSession = sessions.find((item) => item.id === sessId) || sess
      if ((latestSession?.messages || []).length === 0) {
        const welcomeContent = modeWelcomes[mode] || modeWelcomes.STANDARD
        await addMessage(sessId, {
          id: `welcome-${sessId}`,
          role: 'assistant',
          content: welcomeContent,
          timestamp: new Date().toISOString(),
        }, { countAsWork: false })
      }
    }

    return sessId
  }

  // Copy/paste disable for INTERVIEW mode
  useEffect(() => {
    if (mode !== 'INTERVIEW' || !isSessionStarted) return

    const disableEvents = (e) => {
      e.preventDefault()
      return false
    }
    document.addEventListener('copy', disableEvents)
    document.addEventListener('cut', disableEvents)
    document.addEventListener('paste', disableEvents)
    document.addEventListener('contextmenu', disableEvents)
    return () => {
      document.removeEventListener('copy', disableEvents)
      document.removeEventListener('cut', disableEvents)
      document.removeEventListener('paste', disableEvents)
      document.removeEventListener('contextmenu', disableEvents)
    }
  }, [mode, isSessionStarted, addToast])

  // Listen for time‑up events
  useEffect(() => {
    const handleTimeUp = (event) => {
      if (mode === 'INTERVIEW' && session?.id === event.detail.sessionId) {
        addMessage(session.id, {
          id: `interview-time-up-${Date.now()}`,
          role: 'assistant',
          content: `Time is up. Final score: ${event.detail.finalScore ?? 'completed'}.`,
          timestamp: new Date().toISOString(),
        })
      }
    }
    window.addEventListener('elitecode-time-up', handleTimeUp)
    return () => window.removeEventListener('elitecode-time-up', handleTimeUp)
  }, [mode, session?.id, addMessage])

  const suggestionPills = modePrompts[mode] || modePrompts.STANDARD
  const assistantMeta = modeAssistantMeta[mode] || modeAssistantMeta.STANDARD
  const canAttach = mode !== 'INTERVIEW' || !isSessionStarted
  const isEmbedded = !showProblemPanel
  const historySessions = sessions.filter((item) => item.hasWork)
  const activeInterview = getActiveInterviewSession()
  const embeddedAccent =
      mode === 'INTERVIEW'
          ? {
            text: 'text-magenta',
            border: 'border-magenta/25',
            bg: 'bg-magenta/10',
            hover: 'hover:text-magenta hover:border-magenta/40',
            focus: 'focus-within:border-magenta/35',
          }
          : {
            text: 'text-violet',
            border: 'border-violet/25',
            bg: 'bg-violet/10',
            hover: 'hover:text-violet hover:border-violet/40',
            focus: 'focus-within:border-violet/35',
          }

  const handleNewSession = async () => {
    if (activeInterview) {
      addToast('End the active interview before starting another session.', 'warning')
      return
    }
    await createSession(selectedProblem?.id || null, `${mode} Assistant`, mode)
    setHistoryOpen(false)
  }

  const handleSelectHistory = (target) => {
    if (activeInterview && target.id !== activeInterview.sessionId) {
      addToast('End the active interview before opening another session.', 'warning')
      return
    }
    setMode(target.mode)
    setCurrentSession(target.id)
    setHistoryOpen(false)
  }

  const handleDeleteHistory = async (event, target) => {
    event.stopPropagation()
    if (activeInterview && target.id === activeInterview.sessionId) {
      addToast('End the active interview before deleting it.', 'warning')
      return
    }
    await deleteSession(target.id)
  }

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    const next = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        addToast(`${file.name} is too large (max 1MB)`, 'error')
        continue
      }
      const allowed = await isFileAllowed(file)
      if (!allowed) {
        addToast(`File type "${file.name}" is not allowed`, 'error')
        continue
      }
      try {
        const content = await readFileAsText(file)
        if (/(.)\1{500,}/.test(content)) {
          addToast(`File contains suspicious pattern`, 'error')
          continue
        }
        next.push({ name: file.name, size: file.size, content })
      } catch {
        addToast(`Failed to read ${file.name}`, 'error')
      }
    }
    if (next.length) setAttachments((prev) => [...prev, ...next])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ content, sessionId }) => {
      const targetMessages = sessions.find((item) => item.id === sessionId)?.messages || messages
      const currentApproach = targetMessages
          .filter((item) => item.role === 'user')
          .slice(-5)
          .map((item) => item.content)
          .join('\n') || content
      const modeGuide = modeConversationGuides[mode] || modeConversationGuides.STANDARD
      const guidedContext = `${modeGuide}\n\nRecent candidate/user context:\n${currentApproach}`
      const guidedQuestion = `${modeGuide}\n\nUser message:\n${content}`
      return hintService.requestHint(selectedProblem?.id || null, guidedContext, guidedQuestion, mode, null)
    },
    onSuccess: async (data, { content, sessionId }) => {
      if (!sessionId) return
      await addMessage(sessionId, {
        id: Date.now(),
        role: 'assistant',
        content: extractHintText(data),
        timestamp: new Date().toISOString(),
        ...(mode === 'LEARNING' && wantsProblemSuggestions(content) && learningProblems.length
            ? { problemSuggestions: learningProblems.slice(0, 4) }
            : {}),
      })
      const latestSession = sessions.find((item) => item.id === sessionId)
      if (latestSession && latestSession.title.endsWith('Assistant')) {
        try {
          const result = await hintService.generateSessionTitle({
            mode,
            problemTitle: selectedProblem?.title || '',
            conversation: [
              ...latestSession.messages.filter((item) => !String(item.id).startsWith('welcome-')),
              { role: 'assistant', content: extractHintText(data) },
            ]
                .slice(-4)
                .map((item) => `${item.role}: ${item.content}`)
                .join('\n'),
          })
          if (result?.title) await updateSessionTitle(sessionId, result.title)
        } catch (err) {}
      }
      if (mode === 'INTERVIEW' && isSessionStarted) {
        const lower = (data?.hint || '').toLowerCase()
        if (lower.includes('wrong') || lower.includes('incorrect') || lower.includes('error')) {
          window.dispatchEvent(new CustomEvent('elitecode-deduct-points', { detail: 10 }))
        }
      }
    },
    onError: (error) => {
      addToast(getErrorMessage(error), 'error')
      if (mode === 'INTERVIEW' && isSessionStarted) {
        window.dispatchEvent(new CustomEvent('elitecode-deduct-points', { detail: 5 }))
      }
    },
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isPending) return

    const sessionId = await ensureSession(true)
    if (!sessionId) return

    const attachmentText = attachments.length
        ? `\n\nUploaded files:\n${attachments
            .map((file) => `--- ${file.name} (${file.size} bytes) ---\n${file.content}`)
            .join('\n\n')}`
        : ''

    const finalMessage = `${input.trim()}${attachmentText}`

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: finalMessage,
      timestamp: new Date().toISOString(),
    }
    await addMessage(sessionId, userMsg)
    setInput('')
    setAttachments([])
    sendMessage({ content: finalMessage, sessionId })
  }

  const handleSuggestion = (value) => {
    setInput(value)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isPending])

  useEffect(() => {
    if (isSessionStarted) inputRef.current?.focus()
  }, [isSessionStarted, session?.id])

  // Load messages when a session is selected and it doesn't have messages loaded yet
  useEffect(() => {
    if (currentSessionId && session && (!session.messages || session.messages.length === 0)) {
      loadMessages(currentSessionId)
    }
  }, [currentSessionId, session, loadMessages])

  return (
      <div className={`flex h-full flex-col overflow-hidden ${showProblemPanel ? 'rounded-2xl glass-panel' : 'bg-[#0b1020]/70'}`}>
        {!showProblemPanel && (
            <div className="relative shrink-0 border-b border-white/10 bg-white/[0.015] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${mode === 'INTERVIEW' ? 'bg-magenta' : 'bg-violet'}`} />
                  <span className="h-px w-8 bg-white/15" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                      onClick={handleNewSession}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.025] text-txt-secondary ${embeddedAccent.hover}`}
                      title="New session"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                      onClick={() => setHistoryOpen((open) => !open)}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.025] text-txt-secondary ${embeddedAccent.hover}`}
                      title="History"
                  >
                    <History size={14} />
                  </button>
                </div>
              </div>
              {historyOpen && (
                  <div className="absolute right-3 top-[calc(100%+6px)] z-50 max-h-80 w-72 overflow-y-auto rounded-md border border-white/10 bg-[#080d19]/95 p-1 shadow-2xl backdrop-blur">
                    {historySessions.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-txt-muted">No sessions yet</div>
                    ) : historySessions.map((item) => (
                        <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSelectHistory(item)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') handleSelectHistory(item)
                            }}
                            className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-white/5 ${
                                currentSessionId === item.id ? 'text-txt-primary bg-white/[0.04]' : 'text-txt-secondary'
                            }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.title || 'Untitled'}</span>
                            <span className="block text-[10px] uppercase tracking-[0.16em] text-txt-muted">{item.mode.toLowerCase()}</span>
                          </span>
                          <button
                              type="button"
                              onClick={(event) => handleDeleteHistory(event, item)}
                              className="rounded p-1 text-txt-muted opacity-0 hover:bg-neon-red/10 hover:text-neon-red group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                    ))}
                  </div>
              )}
            </div>
        )}
        {/* Problem Statement Panel (collapsible) */}
        {showProblemPanel && selectedProblem && (
            <div className="shrink-0 border-b border-white/10">
              <button
                  onClick={() => setProblemPanelOpen(!problemPanelOpen)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-txt-primary">{selectedProblem.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getDifficultyBg(selectedProblem.difficulty)}`}>
                {selectedProblem.difficulty}
              </span>
                </div>
                {problemPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {problemPanelOpen && (
                  <div className="px-5 pb-4 max-h-[40vh] overflow-y-auto prose prose-invert prose-sm">
                    <div className="whitespace-pre-wrap text-sm text-txt-secondary leading-relaxed">
                      {selectedProblem.originalText || 'No description available.'}
                    </div>
                    {selectedProblem.tags && selectedProblem.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {selectedProblem.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-txt-muted">
                      {tag}
                    </span>
                          ))}
                        </div>
                    )}
                  </div>
              )}
            </div>
        )}

        {/* AI Chat Messages */}
        <div ref={scrollRef} className={`flex-1 overflow-y-auto ${isEmbedded ? 'space-y-3 px-3 py-3' : 'space-y-4 px-5 py-4'}`}>
          {messages.length === 0 && (
              <div className={`${isEmbedded ? `rounded-md ${embeddedAccent.border} ${embeddedAccent.bg} p-3` : 'rounded-2xl border border-white/5 bg-white/[0.03] p-4'} space-y-3`}>
                {!isEmbedded && (
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className={assistantMeta.accent} />
                      <span className="text-xs font-medium text-txt-primary">{assistantMeta.label}</span>
                    </div>
                )}
                <p className={`${isEmbedded ? 'text-xs' : 'text-sm'} text-txt-secondary leading-relaxed`}>
                  {mode === 'LEARNING'
                      ? 'I will help you understand the problem step by step. Write code and ask for hints or explanations.'
                      : mode === 'INTERVIEW'
                          ? 'I will act as your technical interviewer. Ask me questions or request a hint.'
                          : 'Ask me anything about the problem or your code. I can help you debug, optimise, or explain.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestionPills.map((item) => (
                      <button
                          key={item}
                          onClick={() => handleSuggestion(item)}
                          className={`${isEmbedded ? 'rounded-md px-2.5 py-1 text-[11px]' : 'rounded-full px-3 py-1.5 text-xs'} border border-white/10 bg-white/[0.02] text-txt-secondary ${isEmbedded ? embeddedAccent.hover : 'hover:border-cyan/30 hover:text-cyan'} transition-colors`}
                      >
                        {item}
                      </button>
                  ))}
                </div>
              </div>
          )}
          {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isUser={msg.role === 'user'} compact={isEmbedded} mode={mode} />
          ))}
          {isPending && <TypingIndicator />}
        </div>

        {/* Chat Input */}
        <div className={`${isEmbedded ? 'p-3 bg-black/20' : 'p-4 bg-black/10'} shrink-0 border-t border-white/10`}>
          <form onSubmit={handleSubmit} className="relative">
            {canAttach && attachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-txt-secondary">
                  {file.name}
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-txt-muted hover:text-neon-red">
                    <X size={12} />
                  </button>
                </span>
                  ))}
                </div>
            )}
            <div className={`flex items-end gap-2 ${isEmbedded ? 'rounded-md p-1.5' : 'rounded-2xl p-2'} border border-white/10 bg-white/[0.03] ${isEmbedded ? embeddedAccent.focus : 'focus-within:border-cyan/30'} transition-all`}>
              {canAttach && (
                  <>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`${isEmbedded ? 'rounded-md p-1.5' : 'rounded-xl p-2'} text-txt-muted hover:text-txt-primary hover:bg-white/5 transition-colors`}>
                      <Paperclip size={16} />
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                  </>
              )}
              <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  placeholder={canAttach ? 'Ask a question or request a hint...' : 'Ask a question (copy/paste disabled)'}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-txt-primary placeholder:text-txt-muted outline-none py-2 px-1 min-h-[40px]"
              />
              <NeonButton
                  type="submit"
                  variant="solid"
                  size="icon"
                  loading={isPending}
                  disabled={!input.trim() || isPending || !isSessionStarted}
                  className="rounded-full w-9 h-9 flex items-center justify-center"
              >
                <Send size={16} />
              </NeonButton>
            </div>
          </form>
        </div>
      </div>
  )
}