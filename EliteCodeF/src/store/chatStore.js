import { create } from 'zustand';
import { chatService } from '../api/chatService';

const getStorageKey = (userId) => `elitecode-chat-${userId}`;

const loadFromLocalStorage = (userId) => {
    if (!userId) return null;
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.debug('Failed to parse stored chat', e);
        }
    }
    return null;
};

const saveToLocalStorage = (userId, state) => {
    if (!userId) return;
    const key = getStorageKey(userId);
    const toStore = {
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        currentSessionByMode: state.currentSessionByMode,
        mode: state.mode,
        isSidebarOpen: state.isSidebarOpen,
    };
    localStorage.setItem(key, JSON.stringify(toStore));
};

const useChatStore = create((set, get) => ({
    sessions: [],
    currentSessionId: null,
    currentSessionByMode: {},
    mode: 'STANDARD',
    isSidebarOpen: true,
    isLoading: false,
    syncInProgress: false,
    currentUserId: null,

    initForUser: async (userId) => {
        if (get().currentUserId === userId && get().sessions.length > 0) return;
        set({ currentUserId: userId, isLoading: true });

        const cached = loadFromLocalStorage(userId);
        if (cached) {
            set({
                sessions: cached.sessions || [],
                currentSessionId: cached.currentSessionId || null,
                currentSessionByMode: cached.currentSessionByMode || {},
                mode: cached.mode || 'STANDARD',
                isSidebarOpen: cached.isSidebarOpen !== undefined ? cached.isSidebarOpen : true,
            });
        } else {
            set({ sessions: [], currentSessionId: null, currentSessionByMode: {}, mode: 'STANDARD', isSidebarOpen: true });
        }
        set({ isLoading: false });
    },

    createSession: async (problemId = null, title = null, modeOverride = null) => {
        const { currentUserId, mode } = get();
        const sessionMode = modeOverride || mode;
        try {
            const newSession = await chatService.createSession(sessionMode, problemId, title);
            set((state) => {
                const updated = {
                    sessions: [newSession, ...state.sessions],
                    currentSessionId: newSession.id,
                    currentSessionByMode: { ...state.currentSessionByMode, [sessionMode]: newSession.id },
                };
                saveToLocalStorage(currentUserId, { ...state, ...updated });
                return updated;
            });
            return newSession.id;
        } catch (err) {
            console.debug('Failed to create session on backend, using local fallback', err);
            const localId = `local-${Date.now()}`;
            const fallbackSession = {
                id: localId,
                title: title || `${sessionMode} Assistant`,
                mode: sessionMode,
                messages: [],
                hasWork: false,
                problemId: problemId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            set((state) => {
                const updated = {
                    sessions: [fallbackSession, ...state.sessions],
                    currentSessionId: localId,
                    currentSessionByMode: { ...state.currentSessionByMode, [sessionMode]: localId },
                };
                saveToLocalStorage(currentUserId, { ...state, ...updated });
                return updated;
            });
            return localId;
        }
    },

    setCurrentSession: (id) => {
        const { currentUserId, sessions } = get();
        const session = sessions.find(s => s.id === id);
        if (!session) return;
        set((state) => {
            const updated = {
                currentSessionId: id,
                currentSessionByMode: { ...state.currentSessionByMode, [session.mode]: id },
            };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
    },

    loadMessages: async (sessionId) => {
        if (sessionId.startsWith('local-')) {
            const cached = get().sessions.find(s => s.id === sessionId);
            return cached?.messages || [];
        }
        try {
            const fullSession = await chatService.getSessionWithMessages(sessionId);
            set((state) => {
                const updatedSessions = state.sessions.map(s =>
                    s.id === sessionId ? fullSession : s
                );
                const updated = { sessions: updatedSessions };
                saveToLocalStorage(state.currentUserId, { ...state, ...updated });
                return updated;
            });
            return fullSession.messages;
        } catch (err) {
            console.debug('Failed to load messages from backend, using local cache', err);
            const cached = get().sessions.find(s => s.id === sessionId);
            return cached?.messages || [];
        }
    },

    addMessage: async (sessionId, message, { countAsWork = true } = {}) => {
        const { currentUserId } = get();
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            sessionId,
            role: message.role,
            content: message.content,
            timestamp: new Date().toISOString(),
            problemSuggestions: message.problemSuggestions,
        };

        set((state) => {
            const updatedSessions = state.sessions.map(sess =>
                sess.id === sessionId
                    ? { ...sess, messages: [...(sess.messages || []), tempMessage], hasWork: countAsWork ? true : sess.hasWork }
                    : sess
            );
            const updated = { sessions: updatedSessions };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });

        // Skip backend call for local sessions
        if (sessionId.startsWith('local-')) return;

        chatService.sendMessage(sessionId, message.role, message.content, message.problemSuggestions || null)
            .then(saved => {
                set((state) => {
                    const updatedSessions = state.sessions.map(sess =>
                        sess.id === sessionId
                            ? { ...sess, messages: (sess.messages || []).map(m => m.id === tempId ? saved : m) }
                            : sess
                    );
                    const updated = { sessions: updatedSessions };
                    saveToLocalStorage(currentUserId, { ...state, ...updated });
                    return updated;
                });
            })
            .catch(err => console.debug('Failed to save message on backend (ignored)', err));
    },

    updateSessionTitle: async (sessionId, title) => {
        const { currentUserId } = get();
        set((state) => {
            const updatedSessions = state.sessions.map(sess =>
                sess.id === sessionId ? { ...sess, title } : sess
            );
            const updated = { sessions: updatedSessions };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
        if (!sessionId.startsWith('local-')) {
            chatService.updateSessionTitle(sessionId, title).catch(err => console.debug('Failed to update title on backend', err));
        }
    },

    deleteSession: async (sessionId) => {
        const { currentUserId } = get();
        set((state) => {
            const filtered = state.sessions.filter(s => s.id !== sessionId);
            const deleted = state.sessions.find(s => s.id === sessionId);
            const nextByMode = { ...state.currentSessionByMode };
            if (deleted && nextByMode[deleted.mode] === sessionId) {
                const replacement = filtered.find(s => s.mode === deleted.mode);
                nextByMode[deleted.mode] = replacement ? replacement.id : null;
            }
            const newCurrent = filtered.length ? filtered[0].id : null;
            const updated = {
                sessions: filtered,
                currentSessionId: newCurrent,
                currentSessionByMode: nextByMode,
            };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
        if (!sessionId.startsWith('local-')) {
            chatService.deleteSession(sessionId).catch(err => console.debug('Failed to delete session on backend', err));
        }
    },

    markSessionWork: (sessionId) => {
        const { currentUserId } = get();
        set((state) => {
            const updatedSessions = state.sessions.map(sess =>
                sess.id === sessionId ? { ...sess, hasWork: true } : sess
            );
            const updated = { sessions: updatedSessions };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
    },

    setMode: (mode) => {
        const { currentUserId, currentSessionByMode } = get();
        const modeSessionId = currentSessionByMode[mode] || null;
        set((state) => {
            const updated = { mode, currentSessionId: modeSessionId };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
    },

    toggleSidebar: () => {
        const { currentUserId } = get();
        set((state) => {
            const updated = { isSidebarOpen: !state.isSidebarOpen };
            saveToLocalStorage(currentUserId, { ...state, ...updated });
            return updated;
        });
    },
}));

export default useChatStore;