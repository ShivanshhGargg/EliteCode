import axios from 'axios'
import useAuthStore from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

let isRefreshing = false
let refreshSubscribers = []

const extractAccessToken = (payload) =>
    payload?.accessToken || payload?.access_token || payload?.token || payload?.data?.accessToken || null

const extractUser = (payload, fallbackUser) => {
  const source = payload?.data || payload?.user || payload || {}
  return {
    ...fallbackUser,
    id: source.userId || source.id || fallbackUser?.id,
    email: source.email || fallbackUser?.email,
    firstName: source.firstName ?? fallbackUser?.firstName,
    lastName: source.lastName ?? fallbackUser?.lastName,
  }
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addSubscriber(cb) {
  refreshSubscribers.push(cb)
}

axiosClient.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      // ✅ Also treat 403 as auth error
      if ((error.response?.status === 401 || error.response?.status === 403) && !original._retry) {
        original._retry = true
        if (isRefreshing) {
          return new Promise((resolve) => {
            addSubscriber((token) => {
              original.headers.Authorization = `Bearer ${token}`
              resolve(axiosClient(original))
            })
          })
        }
        isRefreshing = true
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
          const newAccessToken = extractAccessToken(data)
          if (!newAccessToken) {
            throw new Error('Missing access token in refresh response')
          }
          const currentUser = useAuthStore.getState().user
          const refreshedUser = extractUser(data, currentUser)
          useAuthStore.getState().setAuth(refreshedUser, newAccessToken)
          localStorage.setItem('user', JSON.stringify(refreshedUser))
          onRefreshed(newAccessToken)
          original.headers.Authorization = `Bearer ${newAccessToken}`
          return axiosClient(original)
        } catch (refreshError) {
          // Refresh failed – force logout
          useAuthStore.getState().logout()
          localStorage.removeItem('user')
          const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email']
          if (!publicPaths.includes(window.location.pathname)) {
            window.history.pushState({}, '', '/login')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      return Promise.reject(error)
    }
)

export default axiosClient
