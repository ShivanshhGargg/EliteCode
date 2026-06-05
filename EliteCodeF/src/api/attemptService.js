import axiosClient from './axiosClient'

export const attemptService = {
  submitAttempt: async (problemId, mode, code, input = '', language = 'JAVA') => {
    const res = await axiosClient.post('/attempts', { problemId, mode, code, input, language })
    return res.data
  },
  getAttempts: async (page = 0, size = 20) => {
    const res = await axiosClient.get(`/attempts?page=${page}&size=${size}`)
    return res.data
  },
  getAttemptById: async (id) => {
    const res = await axiosClient.get(`/attempts/${id}`)
    return res.data
  },
  getAttemptFeedback: async (attemptId) => {
    const res = await axiosClient.get(`/attempts/${attemptId}/feedback`)
    return res.data
  },
}
