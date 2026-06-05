import { create } from 'zustand'

const THEME_STORAGE_KEY = 'elitecode-theme'
const DEFAULT_THEME = 'aurora'

const loadTheme = () => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

const persistTheme = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore storage issues
  }
}

const useUIStore = create((set) => ({
  theme: loadTheme(),
  setTheme: (theme) => {
    persistTheme(theme)
    set({ theme })
  },
}))

export default useUIStore

