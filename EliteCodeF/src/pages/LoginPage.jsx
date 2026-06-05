import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Zap, ArrowRight, Github } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../api/authService'
import { useAuth } from '../hooks/useAuth'
import useToastStore from '../store/toastStore'
import { NeonButton } from '../components/NeonButton'
import { getErrorMessage } from '../utils/error'

const extractAuthResponse = (data) => ({
  userId: data?.userId || data?.data?.userId || data?.user?.id,
  email: data?.email || data?.data?.email || data?.user?.email,
  firstName: data?.firstName || data?.data?.firstName || data?.user?.firstName,
  lastName: data?.lastName || data?.data?.lastName || data?.user?.lastName,
  accessToken: data?.accessToken || data?.access_token || data?.token || data?.data?.accessToken,
});

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [showTotp, setShowTotp] = useState(false)
  const [totpCode, setTotpCode] = useState('')
  const [pendingLoginData, setPendingLoginData] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToastStore()

  const { mutate: handleLogin, isPending } = useMutation({
    mutationFn: () => authService.login(email, password, showTotp ? totpCode : null),
    onSuccess: (data) => {
      const { userId, email, firstName, lastName, accessToken } = extractAuthResponse(data);
      login({ id: userId, email, firstName, lastName }, accessToken);
      addToast('Signed in successfully', 'success');
      navigate('/');
    },
    onError: (error) => {
      const msg = getErrorMessage(error)
      if (msg.includes('2FA') || msg.includes('code')) {
        setShowTotp(true)
        addToast('Enter your 2FA code', 'info')
      } else {
        addToast(msg, 'error')
        setErrors({ submit: msg })
      }
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    if (!email) { setErrors({ email: 'Required' }); return }
    if (!password && !showTotp) { setErrors({ password: 'Required' }); return }
    handleLogin()
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await authService.loginWithGoogle(credentialResponse.credential, showTotp ? totpCode : null)
      const { userId, email: userEmail, firstName, lastName, accessToken } = extractAuthResponse(data)
      login({ id: userId, email: userEmail, firstName, lastName }, accessToken)
      addToast('Google sign-in successful', 'success')
      navigate('/')
    } catch (error) {
      const msg = getErrorMessage(error)
      if (msg.includes('2FA') || msg.includes('code')) {
        setShowTotp(true)
        addToast('Enter your 2FA code', 'info')
        // Store pending login data to retry with TOTP
        setPendingLoginData({ type: 'google', token: credentialResponse.credential })
      } else {
        addToast(msg, 'error')
      }
    }
  }

  const handleGithubLogin = () => {
    // For GitHub, you need to implement a popup that gets the access token.
    // This is a simplified version using a popup that redirects to your backend callback.
    // But your backend expects a GitHub access token directly – the easiest is to use a library like @octokit/auth-oauth-app.
    // Alternatively, add a backend endpoint that exchanges a code for token.
    // Here's a placeholder that opens GitHub OAuth flow (you must set up a redirect URI to your frontend, then exchange code for token via backend).
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/github/callback`
    const popup = window.open(
        `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`,
        'github-auth',
        'width=600,height=700'
    )
    // You'll need to handle the callback page (create a route /auth/github/callback) that extracts the code,
    // sends it to your backend, and then receives the access token.
    addToast('GitHub login requires additional setup – see console', 'info')
  }

  const resendVerification = useMutation({
    mutationFn: () => authService.resendVerification(email),
    onSuccess: () => addToast('Verification email sent', 'success'),
    onError: (err) => addToast(getErrorMessage(err), 'error'),
  });

  return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet/5 rounded-full blur-[120px]" />

        <div className="relative w-full max-w-md glass-panel rounded-[32px] p-8">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center mx-auto mb-4 shadow-[0_20px_40px_rgba(0,240,255,0.12)]">
              <Zap size={28} className="text-void" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-txt-muted mb-3">Sign in to continue</p>
            <h1 className="text-3xl font-semibold gradient-text mb-3">EliteCode</h1>
            <p className="text-sm text-txt-secondary leading-relaxed">AI-powered problem solving with a calmer, more focused workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="you@example.com" className={`input-neon ${errors.email ? 'border-neon-red/50' : ''}`} />
              {errors.email && <p className="text-neon-red text-xs mt-1.5">{errors.email}</p>}
            </div>

            {!showTotp && (
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={password}
                           onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                           className={`input-neon pr-12 ${errors.password ? 'border-neon-red/50' : ''}`} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary transition-colors">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-neon-red text-xs mt-1.5">{errors.password}</p>}
                </div>
            )}

            <Link to="/forgot-password" className="text-xs text-cyan hover:text-cyan/80 transition-colors">
              Forgot password?
            </Link>

            {showTotp && (
                <div>
                  <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">2FA Code</label>
                  <input
                      type="text"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="000000"
                      className="input-neon"
                      autoComplete="off"
                  />
                  <p className="text-xs text-txt-muted mt-1">Enter the 6-digit code from your authenticator app</p>
                </div>
            )}

            {errors.submit && (
                <div className="p-3 rounded-xl bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm">
                  {errors.submit}
                </div>
            )}

            {errors.submit && errors.submit.includes('verify your email') && (
                <button
                    type="button"
                    onClick={() => resendVerification.mutate(email)}
                    className="text-xs text-cyan underline mt-2"
                >
                  Resend verification email
                </button>
            )}

            <NeonButton type="submit" variant="solid" size="lg" loading={isPending} className="w-full">
              {showTotp ? 'Verify & Sign In' : 'Sign In'} <ArrowRight size={16} className="ml-2" />
            </NeonButton>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-surface px-2 text-txt-muted">Or continue with</span></div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => addToast('Google login failed', 'error')}
                    theme="filled_black"
                    shape="pill"
                    width="100%"
                    text="continue_with"
                />
              </div>
              <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-sm text-txt-primary opacity-50 cursor-not-allowed"
              >
                <Github size={18} /> GitHub (soon)
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-txt-muted mt-6">
            New here?{' '}
            <Link to="/register" className="text-cyan hover:text-cyan/80 font-medium transition-colors">Create account</Link>
          </p>
        </div>
      </div>
  )
}

export default LoginPage
