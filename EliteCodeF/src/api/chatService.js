import axiosClient from './axiosClient';

const isLocalId = (id) => typeof id === 'string' && id.startsWith('local-');

export const chatService = {
  // Sessions
  getSessions: () => axiosClient.get('/chat/sessions').then(res => res.data),
  createSession: (mode, problemId, title) =>
      axiosClient.post('/chat/sessions', { mode, problemId, title }).then(res => res.data),
  deleteSession: (sessionId) => {
    if (isLocalId(sessionId)) return Promise.resolve();
    return axiosClient.delete(`/chat/sessions/${sessionId}`);
  },
  updateSessionTitle: (sessionId, title) => {
    if (isLocalId(sessionId)) return Promise.resolve();
    return axiosClient.put(`/chat/sessions/${sessionId}/title`, { title });
  },

  // Messages
  getSessionWithMessages: (sessionId) => {
    if (isLocalId(sessionId)) return Promise.resolve({ messages: [] });
    return axiosClient.get(`/chat/sessions/${sessionId}`).then(res => res.data);
  },
  sendMessage: (sessionId, role, content, problemSuggestions = null) => {
    if (isLocalId(sessionId)) {
      // Return a mock message object that matches the backend structure
      return Promise.resolve({
        id: `mock-${Date.now()}`,
        role,
        content,
        timestamp: new Date().toISOString(),
        problemSuggestions: problemSuggestions ? JSON.stringify(problemSuggestions) : null,
      });
    }
    return axiosClient.post(`/chat/sessions/${sessionId}/messages`, { role, content, problemSuggestions })
        .then(res => res.data);
  },
};