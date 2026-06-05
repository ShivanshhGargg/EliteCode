export function TypingIndicator() {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-violet/15 border border-violet/20">
        <span className="text-violet text-xs font-bold">AI</span>
      </div>
      <div className="message-bubble-ai flex items-center gap-1.5 py-4">
        <span className="w-2 h-2 rounded-full bg-violet/60 animate-typing" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet/60 animate-typing" style={{ animationDelay: '200ms' }} />
        <span className="w-2 h-2 rounded-full bg-violet/60 animate-typing" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  )
}

export default TypingIndicator
