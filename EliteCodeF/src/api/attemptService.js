import axiosClient from './axiosClient'
import { cacheGet, cacheSet } from '../utils/cache'

export const attemptService = {
  submitAttempt: async (problemId, mode, code, input = '', language = 'JAVA') => {
    const res = await axiosClient.post('/attempts', { problemId, mode, code, input, language })
    // Invalidate solved dates after new attempt
    cacheClear('solvedDates')
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
  getSolvedProblemIds: async () => {
    const res = await axiosClient.get('/users/me/solved')
    return res.data
  },
  getSolvedDates: async () => {
    const cached = cacheGet('solvedDates')
    if (cached) return cached

    // Fetch all accepted attempts and extract unique dates
    const res = await axiosClient.get('/attempts?size=1000') // adjust as needed
    const attempts = res.data.content || []
    const acceptedDates = attempts
        .filter(a => a.result === 'ACCEPTED')
        .map(a => new Date(a.createdAt).toDateString())
    const uniqueDates = [...new Set(acceptedDates)]
    cacheSet('solvedDates', uniqueDates, 5 * 60 * 1000)
    return uniqueDates
  },
}