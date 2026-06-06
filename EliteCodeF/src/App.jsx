import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { hydrateAuth } from './hooks/useAuth'
import useUIStore from './store/uiStore'
import useAuthStore from './store/authStore'
import ErrorBoundary from './components/ErrorBoundary'
import axiosClient from './api/axiosClient'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { WorkspacePage } from './pages/WorkspacePage'
import NotFoundPage from './pages/NotFoundPage'
import AttemptsPage from './pages/AttemptsPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ProblemsPage } from './pages/ProblemsPage'
import { AdminProblemsPage } from './pages/AdminProblemsPage'
import { UserProgressPage } from './pages/UserProgressPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { Spinner } from './components/Spinner'

function useAuthGate() {
  const { user, accessToken, isLoading } = useAuthStore()
  return {
    isAuthenticated: Boolean(user && accessToken),
    isLoading,
  }
}

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuthGate()

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthGate()

  if (isLoading) return <Spinner />
  if (isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const theme = useUIStore((state) => state.theme)

  useEffect(() => {
    hydrateAuth()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    axiosClient.get('/public/ping').catch(() => console.warn('Backend unreachable'))
  }, [])

  return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
              <Route path="/attempts" element={<ProtectedRoute><AttemptsPage /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/problems" element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
              <Route path="/admin/problems" element={<ProtectedRoute><AdminProblemsPage /></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><UserProgressPage /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
  )
}
