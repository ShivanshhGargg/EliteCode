import { User, Bot, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import useWorkspaceStore from '../store/workspaceStore'
import { getDifficultyBg } from '../utils/format'

export function MessageBubble({ message, isUser, compact = false, mode = 'STANDARD' }) {
  const { setSelectedProblem } = useWorkspaceStore()
  const accentClass = mode === 'INTERVIEW' ? 'text-magenta' : mode === 'LEARNING' ? 'text-violet' : 'text-cyan'
  const avatarClass = isUser
      ? 'bg-cyan/10 border border-cyan/15'
      : mode === 'INTERVIEW'
          ? 'bg-magenta/10 border border-magenta/15'
          : 'bg-violet/10 border border-violet/15'

  const openSuggestion = (problem) => {
    setSelectedProblem(problem)
  }

  return (
    <div className={`flex ${compact ? 'gap-2.5' : 'gap-4'} ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 ${compact ? 'w-6 h-6 rounded-md' : 'w-8 h-8 rounded-lg'} flex items-center justify-center ${avatarClass}`}>
        {isUser ? <User size={compact ? 13 : 16} className="text-cyan" /> : <Bot size={compact ? 13 : 16} className={accentClass} />}
      </div>
      <div className={`${compact ? 'max-w-[88%]' : 'max-w-[82%]'} ${isUser ? 'message-bubble-user' : 'message-bubble-ai'} ${compact ? 'px-3 py-2 text-[13px] rounded-lg' : ''}`}>
        {isUser ? (
          <p className="text-sm leading-relaxed text-[color:var(--txt-primary)]">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeSanitize]}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  return inline ? (
                    <code className="bg-white/10 px-1.5 py-0.5 rounded text-cyan font-mono text-xs" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-void/80 border border-white/10 rounded-lg p-4 overflow-x-auto my-3">
                      <code className="font-mono text-xs text-txt-secondary" {...props}>{children}</code>
                    </pre>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.problemSuggestions?.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.problemSuggestions.map((problem) => (
                  <button
                    key={problem.id}
                    onClick={() => openSuggestion(problem)}
                    className="group flex w-full items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-left transition-colors hover:border-cyan/25 hover:bg-white/[0.055]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-txt-primary group-hover:text-cyan">{problem.title}</span>
                      <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${getDifficultyBg(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                    </span>
                    <ChevronRight size={14} className="shrink-0 text-txt-muted group-hover:text-cyan" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-[10px] text-txt-muted mt-2 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble
