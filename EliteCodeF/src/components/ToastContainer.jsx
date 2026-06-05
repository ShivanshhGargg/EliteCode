import { useState } from 'react'
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react'
import useToastStore from '../store/toastStore'

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
}

const styles = {
  success: 'border-neon-green/30 bg-neon-green/10 text-neon-green',
  error: 'border-neon-red/30 bg-neon-red/10 text-neon-red',
  info: 'border-cyan/30 bg-cyan/10 text-cyan',
  warning: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-300',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  const [hovered, setHovered] = useState(null)

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            onMouseEnter={() => setHovered(toast.id)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md cursor-pointer
              transition-all duration-300 hover:scale-[1.02] ${styles[toast.type]}`}
            style={{
              boxShadow: hovered === toast.id
                ? `0 0 20px ${toast.type === 'success' ? 'rgba(0,255,136,0.15)' : toast.type === 'error' ? 'rgba(255,51,102,0.15)' : toast.type === 'warning' ? 'rgba(250,204,21,0.15)' : 'rgba(0,240,255,0.15)'}`
                : 'none'
            }}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <X size={14} className="mt-1 opacity-60 hover:opacity-100" />
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
