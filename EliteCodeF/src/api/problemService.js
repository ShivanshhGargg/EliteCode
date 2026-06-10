import axiosClient from './axiosClient'
import { cacheGet, cacheSet } from '../utils/cache'

export const problemService = {
  getProblems: async (page = 0, size = 20, difficulty = '', tags = []) => {
    const cacheKey = `problems_${page}_${size}_${difficulty}_${tags.join(',')}`
    const cached = cacheGet(cacheKey)
    if (cached) return cached

    const params = new URLSearchParams({ page, size })
    if (difficulty) params.append('difficulty', difficulty)
    if (tags.length) params.append('tags', tags.join(','))
    const res = await axiosClient.get(`/problems?${params}`)
    cacheSet(cacheKey, res.data, 2 * 60 * 1000) // 2 min for problem lists
    return res.data
  },
  getProblemById: async (id) => {
    const res = await axiosClient.get(`/problems/${id}`)
    return res.data
  },
  getProblemTestCases: async (problemId) => {
    const res = await axiosClient.get(`/problems/${problemId}/test-cases`);
    return res.data;
  },
  createProblem: async (data) => {
    const res = await axiosClient.post('/problems', data);
    // Invalidate problem caches after mutation
    cacheClear(); // simple: clear all problem caches
    return res.data;
  },
  updateProblem: async (id, data) => {
    const res = await axiosClient.put(`/problems/${id}`, data);
    cacheClear();
    return res.data;
  },
  deleteProblem: async (id) => {
    await axiosClient.delete(`/problems/${id}`);
    cacheClear();
  },
  getProblemSummaries: async (page = 0, size = 50, difficulty = '', title = '', tags = [], sortBy = 'createdAt', sortDir = 'desc') => {
    const cacheKey = `summaries_${page}_${size}_${difficulty}_${title}_${tags.join(',')}_${sortBy}_${sortDir}`
    const cached = cacheGet(cacheKey)
    if (cached) return cached

    const params = new URLSearchParams({ page, size, sortBy, sortDir })
    if (difficulty) params.append('difficulty', difficulty)
    if (title) params.append('title', title)
    if (tags.length) params.append('tags', tags.join(','))
    const res = await axiosClient.get(`/problems/summary?${params}`)
    cacheSet(cacheKey, res.data, 2 * 60 * 1000)
    return res.data
  },
  getTagStats: async () => {
    const cached = cacheGet('tagStats')
    if (cached) return cached

    const res = await axiosClient.get('/problems/tags/stats');
    cacheSet('tagStats', res.data, 10 * 60 * 1000) // 10 min for tag stats
    return res.data;
  },
}