import { create } from 'zustand'

const useToastStore = create((set, get) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    if (duration > 0) {
      setTimeout(() => get().removeToast(id), duration)
    }
    return id
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export default useToastStore
