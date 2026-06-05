import { useEffect, useState } from 'react'
import axios from 'axios'
import useAuthStore from '../store/authStore'
import {authService} from "../api/authService.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
let hydrationPromise = null

const readUser = () => {
  try {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    return null
  }
}

const getAccessToken = (payload) =>
  payload?.accessToken || payload?.access_token || payload?.token || payload?.data?.accessToken || null

export const hydrateAuth = async () => {
  if (hydrationPromise) return hydrationPromise
  hydrationPromise = (async () => {
    const { setAuth, clearAuth, logout, setLoading } = useAuthStore.getState()
    setLoading(true)
    const storedUser = readUser()
    if (!storedUser) {
      clearAuth()
      setLoading(false)
      hydrationPromise = null
      return
    }

    setAuth(storedUser, null)

    try {
      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      const newAccessToken = getAccessToken(data)
      if (newAccessToken) {
        setAuth(storedUser, newAccessToken)
      } else {
        logout()
        localStorage.removeItem('user')
      }
    } catch {
      logout()
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
      hydrationPromise = null
    }
  })()
  return hydrationPromise
}

export function useAuth() {
  const { user, accessToken, isLoading, error, setAuth, clearAuth, logout } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    let active = true
    hydrateAuth().finally(() => {
      if (active) setIsHydrated(true)
    })
    return () => { active = false }
  }, [])

  const login = (user, accessToken) => {
    setAuth(user, accessToken)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) { /* ignore */ }
    logout();
    localStorage.removeItem('user');
  };

  return {
    user, accessToken, isLoading: !isHydrated || isLoading, error,
    isAuthenticated: !!accessToken && isHydrated, isHydrated,
    login, logout: handleLogout, setAuth, clearAuth,
  }
}
