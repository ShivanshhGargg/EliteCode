import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isLoading: false,
  error: null,
  setAuth: (user, accessToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    set({ user, accessToken, error: null });
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, error: null });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, accessToken: null, error: null });
  },
}));

export default useAuthStore
