import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useInterviewStore = create(persist((set, get) => ({
    sessions: {},

    startSession: (sessionId, options = {}) => {
        const { topics = [], difficulty = 'MEDIUM', mode = 'INTERVIEW', timeLimit = null } = options;
        const isInterview = mode === 'INTERVIEW';
        set((state) => ({
            sessions: {
                ...state.sessions,
                [sessionId]: {
                    started: true,
                    paused: false,
                    mode,
                    score: isInterview ? 100 : null,
                    startTime: Date.now(),
                    elapsed: 0,
                    remaining: timeLimit,
                    timeLimit: timeLimit,
                    topics: isInterview ? topics : [],
                    difficulty: isInterview ? difficulty : null,
                },
            },
        }));
    },

    deductPoints: (sessionId, points) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session?.started || session.mode !== 'INTERVIEW') return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: { ...session, score: Math.max(0, session.score - points) },
                },
            };
        }),

    updateTimer: (sessionId, elapsed, remaining) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session || session.paused) return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: { ...session, elapsed, remaining },
                },
            };
        }),

    pauseTimer: (sessionId) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: { ...session, paused: true },
                },
            };
        }),

    resumeTimer: (sessionId) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;
            const now = Date.now();
            const newStartTime = now - (session.elapsed * 1000);
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: { ...session, paused: false, startTime: newStartTime },
                },
            };
        }),

    resetTimer: (sessionId) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: {
                        ...session,
                        elapsed: 0,
                        remaining: session.timeLimit,
                        startTime: Date.now(),
                        paused: false,
                    },
                },
            };
        }),

    addTime: (sessionId, seconds) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session || !session.timeLimit) return state;
            const newTimeLimit = session.timeLimit + seconds;
            const newRemaining = (session.remaining || 0) + seconds;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: {
                        ...session,
                        timeLimit: newTimeLimit,
                        remaining: newRemaining,
                    },
                },
            };
        }),

    endSession: (sessionId) =>
        set((state) => {
            const session = state.sessions[sessionId];
            if (!session) return state;
            return {
                sessions: {
                    ...state.sessions,
                    [sessionId]: {
                        ...session,
                        started: false,
                        paused: true,
                        endedAt: Date.now(),
                        finalScore: session.mode === 'INTERVIEW' ? session.score : null,
                    },
                },
            };
        }),

    // New: completely remove session from store (for quitting)
    clearSession: (sessionId) =>
        set((state) => {
            const newSessions = { ...state.sessions };
            delete newSessions[sessionId];
            return { sessions: newSessions };
        }),

    // End interview and clear it (quits)
    endAndClearInterview: (sessionId) => {
        get().endSession(sessionId);
        get().clearSession(sessionId);
    },

    resetSession: (sessionId) =>
        set((state) => {
            const newSessions = { ...state.sessions };
            delete newSessions[sessionId];
            return { sessions: newSessions };
        }),

    getSession: (sessionId) => get().sessions[sessionId],

    getActiveInterviewSession: () => {
        const entries = Object.entries(get().sessions);
        const active = entries.find(([, session]) => session?.started && session.mode === 'INTERVIEW');
        return active ? { sessionId: active[0], ...active[1] } : null;
    },
}), {
    name: 'elitecode-interview-state',
    partialize: (state) => ({ sessions: state.sessions }),
}));

export default useInterviewStore;