import { Loader2 } from 'lucide-react'

const variants = {
  cyan: 'bg-cyan/10 text-cyan border-cyan/25 hover:bg-cyan/15 hover:shadow-glow-sm hover:border-cyan/40',
  magenta: 'bg-magenta/10 text-magenta border-magenta/25 hover:bg-magenta/15 hover:shadow-neon-magenta hover:border-magenta/40',
  violet: 'bg-violet/10 text-violet border-violet/25 hover:bg-violet/15 hover:shadow-neon-violet hover:border-violet/40',
  ghost: 'bg-transparent text-txt-secondary border-transparent hover:text-txt-primary hover:bg-white/[0.04]',
  solid: 'bg-cyan text-void border-cyan hover:bg-cyan/90 hover:shadow-[0_12px_30px_rgba(0,240,255,0.18)]',
}

export function NeonButton({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-sm',
    icon: 'p-2',
  }

  return (
    <button
      disabled={disabled || loading}
      className={`relative overflow-hidden rounded-2xl font-medium transition-all duration-300 border
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

export default NeonButton
