import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { hydrateAuth } from './hooks/useAuth'
import useUIStore from './store/uiStore'
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<WorkspacePage />} />
              <Route path="/attempts" element={<AttemptsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/problems" element={<ProblemsPage />} />
              <Route path="/admin/problems" element={<AdminProblemsPage />} />
              <Route path="/progress" element={<UserProgressPage />} />
              <Route path="/account-settings" element={<AccountSettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </QueryClientProvider>
  )
}