import { Palette, Check } from 'lucide-react'
import useUIStore from '../store/uiStore'
import { THEME_ORDER, THEME_PRESETS } from '../utils/theme'

export function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme } = useUIStore()

  return (
    <div className={`space-y-2 ${compact ? '' : 'rounded-2xl border border-white/5 bg-white/[0.03] p-3'}`}>
      {!compact && (
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-txt-muted">
          <Palette size={12} />
          Theme
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {THEME_ORDER.map((key) => {
          const preset = THEME_PRESETS[key]
          const active = theme === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTheme(key)}
              className={`group flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition-all duration-200 ${
                active
                  ? 'border-cyan/35 bg-cyan/10 text-txt-primary shadow-[0_10px_25px_rgba(0,240,255,0.08)]'
                  : 'border-white/5 bg-white/[0.03] text-txt-secondary hover:border-white/10 hover:bg-white/[0.05] hover:text-txt-primary'
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-xl border border-white/10"
                style={{ background: preset.background }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{preset.label}</span>
                <span className="block truncate text-[10px] text-txt-muted">{preset.description}</span>
              </span>
              {active ? <Check size={14} className="text-cyan" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeSwitcher

