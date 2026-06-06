import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, MailWarning, ArrowRight } from 'lucide-react'
import { authService } from '../api/authService'
import { Spinner } from '../components/Spinner'
import { getErrorMessage } from '../utils/error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const status = searchParams.get('status')
  const redirectMessage = searchParams.get('message')

  const verifyEmail = useMutation({
    mutationFn: () => authService.verifyEmail(token),
  })

  useEffect(() => {
    if (token && !status) verifyEmail.mutate()
  }, [token, status])

  const isMissingToken = !token && !status
  const isSuccess = status === 'success' || verifyEmail.isSuccess
  const isError = status === 'error' || verifyEmail.isError || isMissingToken
  const errorMessage = redirectMessage || (verifyEmail.error ? getErrorMessage(verifyEmail.error) : null)

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md glass-panel rounded-[32px] p-8 text-center">
        {verifyEmail.isPending && !status && (
          <>
            <Spinner />
            <p className="mt-5 text-sm text-txt-secondary">Verifying your email...</p>
          </>
        )}

        {isSuccess && (
          <>
            <div className="w-14 h-14 rounded-3xl bg-neon-green/10 border border-neon-green/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={30} className="text-neon-green" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-txt-muted mb-3">Email verified</p>
            <h1 className="text-3xl font-semibold gradient-text mb-3">You are ready</h1>
            <p className="text-sm text-txt-secondary leading-relaxed mb-6">
              Your EliteCode account is active. Sign in with your email and password to continue.
            </p>
            <Link to="/login" className="btn-neon inline-flex items-center justify-center">
              Sign In <ArrowRight size={16} className="ml-2" />
            </Link>
          </>
        )}

        {isError && !isSuccess && (
          <>
            <div className="w-14 h-14 rounded-3xl bg-neon-red/10 border border-neon-red/25 flex items-center justify-center mx-auto mb-4">
              <MailWarning size={30} className="text-neon-red" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-txt-muted mb-3">Verification failed</p>
            <h1 className="text-3xl font-semibold gradient-text mb-3">Link unavailable</h1>
            <p className="text-sm text-txt-secondary leading-relaxed mb-6">
              {isMissingToken ? 'This verification link is missing a token.' : errorMessage}
            </p>
            <Link to="/login" className="btn-neon inline-flex items-center justify-center">
              Back to Sign In <ArrowRight size={16} className="ml-2" />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default VerifyEmailPage
