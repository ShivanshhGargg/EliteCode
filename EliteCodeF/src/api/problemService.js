import axiosClient from './axiosClient'

export const problemService = {
  getProblems: async (page = 0, size = 20, difficulty = '', tags = []) => {
    const params = new URLSearchParams({ page, size })
    if (difficulty) params.append('difficulty', difficulty)
    if (tags.length) params.append('tags', tags.join(','))
    const res = await axiosClient.get(`/problems?${params}`)
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
    return res.data;
  },
  updateProblem: async (id, data) => {
    const res = await axiosClient.put(`/problems/${id}`, data);
    return res.data;
  },
  deleteProblem: async (id) => {
    await axiosClient.delete(`/problems/${id}`);
  },
}
