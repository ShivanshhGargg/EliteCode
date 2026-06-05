import axiosClient from './axiosClient'

export const authService = {
  login: async (email, password , totpCode) => {
    const res = await axiosClient.post('/auth/login', { email, password , totpCode})
    return res.data
  },
  register: async (firstName, lastName, email, password) => {
    const res = await axiosClient.post('/auth/register', { firstName, lastName, email, password })
    return res.data
  },
  loginWithGoogle: async (idToken, totpCode = null) => {
    const res = await axiosClient.post('/auth/oauth/google', { idToken, totpCode });
    return res.data;
  },
  loginWithGithub: async (accessToken, totpCode = null) => {
    const res = await axiosClient.post('/auth/oauth/github', { accessToken, totpCode });
    return res.data;
  },
  setupTwoFactor: async () => {
    const res = await axiosClient.post('/auth/2fa/setup');
    return res.data;
  },
  enableTwoFactor: async (totpCode) => {
    const res = await axiosClient.post('/auth/2fa/enable', { totpCode });
    return res.data;
  },
  disableTwoFactor: async (totpCode) => {
    const res = await axiosClient.post('/auth/2fa/disable', { totpCode });
    return res.data;
  },
  forgotPassword: async (email) => {
    await axiosClient.post('/auth/forgot-password', { email });
  },
  resetPassword: async (token, newPassword) => {
    await axiosClient.post('/auth/reset-password', { token, newPassword });
  },
  verifyEmail: async (token) => {
    await axiosClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  },
  resendVerification: async (email) => {
    await axiosClient.post('/auth/resend-verification', { email });
  },
  logout: async () => {
    await axiosClient.post('/auth/logout');
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await axiosClient.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
}
