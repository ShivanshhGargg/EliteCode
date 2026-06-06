import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { hydrateAuth } from './hooks/useAuth'
import useUIStore from './store/uiStore'
import useAuthStore from './store/authStore'
import ErrorBoundary from './components/ErrorBoundary'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"  // ✅ correct package for React
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
    user,  // ✅ must return user for role checks
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

function AdminRoute({ children }) {
  const location = useLocation()
  const { user, isAuthenticated, isLoading } = useAuthGate()
  const isAdmin = user?.role === 'admin'

  if (isLoading) return <Spinner />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!isAdmin) return <Navigate to="/" replace />
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

  return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
              <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
              <Route path="/reset-password" element={<PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>} />
              <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmailPage /></PublicOnlyRoute>} />

              <Route path="/" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
              <Route path="/attempts" element={<ProtectedRoute><AttemptsPage /></ProtectedRoute>} />
              <Route path="/problems" element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />

              <Route path="/admin/problems" element={<AdminRoute><AdminProblemsPage /></AdminRoute>} />
              <Route path="/progress" element={<ProtectedRoute><UserProgressPage /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Analytics />
            <SpeedInsights />
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
  )
}