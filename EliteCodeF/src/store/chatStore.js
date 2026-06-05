import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import useInterviewStore from './interviewStore'

const useChatStore = create(persist((set, get) => ({
  sessions: [],
  currentSessionId: null,
  currentSessionByMode: {},
  mode: 'STANDARD',
  isSidebarOpen: true,

  setMode: (mode) => {
    const modeSessionId = get().currentSessionByMode[mode] || null
    set({ mode, currentSessionId: modeSessionId })
  },
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),

  createSession: (problemId = null, problemTitle = 'New Chat', modeOverride = null) => {
    const id = crypto.randomUUID();
    const sessionMode = modeOverride || get().mode;
    const session = {
      id,
      problemId,
      title: problemTitle,
      mode: sessionMode,
      messages: [],
      hasWork: false,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      sessions: [session, ...s.sessions],
      currentSessionId: id,
      currentSessionByMode: { ...s.currentSessionByMode, [sessionMode]: id },
    }));
    return id;
  },

  setCurrentSession: (id) =>
      set((s) => {
        const session = s.sessions.find((item) => item.id === id)
        return {
          currentSessionId: id,
          currentSessionByMode: session
              ? { ...s.currentSessionByMode, [session.mode]: id }
              : s.currentSessionByMode,
        }
      }),

  addMessage: (sessionId, message, options = {}) =>
      set((s) => ({
        sessions: s.sessions.map((sess) =>
            sess.id === sessionId
                ? {
                    ...sess,
                    messages: [...sess.messages, message],
                    hasWork: options.countAsWork === false ? sess.hasWork : true,
                }
                : sess
        ),
      })),

  updateSessionTitle: (sessionId, title) =>
      set((s) => ({
        sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, title } : sess
        ),
      })),

  markSessionWork: (sessionId) =>
      set((s) => ({
        sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, hasWork: true } : sess
        ),
      })),

  deleteSession: (sessionId) =>
      set((s) => {
        // Also remove any interview store session data
        const { resetSession } = useInterviewStore.getState();
        resetSession(sessionId);

        const filtered = s.sessions.filter((sess) => sess.id !== sessionId)
        const deleted = s.sessions.find((sess) => sess.id === sessionId)
        const nextCurrentByMode = { ...s.currentSessionByMode }
        if (deleted && nextCurrentByMode[deleted.mode] === sessionId) {
          const replacement = filtered.find((sess) => sess.mode === deleted.mode)
          if (replacement) {
            nextCurrentByMode[deleted.mode] = replacement.id
          } else {
            delete nextCurrentByMode[deleted.mode]
          }
        }
        return {
          sessions: filtered,
          currentSessionId: filtered.find((sess) => sess.id === s.currentSessionId) ? s.currentSessionId : (nextCurrentByMode[s.mode] || null),
          currentSessionByMode: nextCurrentByMode,
        }
      }),

  getCurrentSession: () => {
    const { sessions, currentSessionId } = get()
    return sessions.find((s) => s.id === currentSessionId) || null
  },
}), {
  name: 'elitecode-chat-state',
  partialize: (state) => ({
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    currentSessionByMode: state.currentSessionByMode,
    mode: state.mode,
    isSidebarOpen: state.isSidebarOpen,
  }),
}))

export default useChatStore
