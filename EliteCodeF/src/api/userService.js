import axiosClient from './axiosClient'

export const userService = {
  getCurrentUser: async () => {
    const res = await axiosClient.get('/users/me')
    return res.data
  },
  updateProfile: async (firstName, lastName, email) => {
    const res = await axiosClient.put('/users/me', { firstName, lastName, email })
    return res.data
  },
  getUserProgress: async (page = 0, size = 20) => {
    const res = await axiosClient.get(`/users/me/progress?page=${page}&size=${size}`)
    return res.data
  },
  deleteAccount: async () => {
    await axiosClient.delete('/users/me');
  },
  getAccounts: async () => {
    const res = await axiosClient.get('/users/me/accounts'); // backend must provide this endpoint
    return res.data;
  },
  unlinkAccount: async (accountId) => {
    await axiosClient.delete(`/users/me/accounts/${accountId}`);
  },
}
