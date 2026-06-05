import axiosClient from './axiosClient'

export const hintService = {
  requestHint: async (problemId, currentApproach, specificQuestion = '', mode = 'LEARNING', attemptId = null) => {
    const res = await axiosClient.post('/hints', {
      problemId, currentApproach, specificQuestion, mode,
      ...(attemptId && { attemptId }),
    })
    return res.data
  },
  generateSessionTitle: async ({ mode, problemTitle = '', conversation }) => {
    const res = await axiosClient.post('/hints/title', {
      mode,
      problemTitle,
      conversation,
    })
    return res.data
  },
}
