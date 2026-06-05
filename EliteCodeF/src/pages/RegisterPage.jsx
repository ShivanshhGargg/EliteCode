import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, User, ArrowRight } from 'lucide-react'
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

export function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToastStore()

  const { mutate: handleRegister, isPending } = useMutation({
    mutationFn: () => authService.register(form.firstName, form.lastName, form.email, form.password),
    onSuccess: (data) => {
      const { userId, email, firstName, lastName, accessToken } = extractAuthResponse(data);
      login({ id: userId, email, firstName, lastName }, accessToken);
      addToast('Account created!', 'success');
      navigate('/');
    },
    onError: (error) => {
      const msg = getErrorMessage(error)
      addToast(msg, 'error')
      setErrors({ submit: msg })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const errs = {}
    if (!form.firstName) errs.firstName = 'Required'
    if (!form.lastName) errs.lastName = 'Required'
    if (!form.email) errs.email = 'Required'
    if (!form.password) errs.password = 'Required'
    if (form.password.length < 6) errs.password = 'Min 6 chars'
    if (form.password !== form.confirm) errs.confirm = 'No match'
    if (Object.keys(errs).length) { setErrors(errs); return }
    handleRegister()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-magenta/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md glass-panel rounded-[32px] p-8">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-magenta to-violet flex items-center justify-center mx-auto mb-4 shadow-[0_20px_40px_rgba(255,0,160,0.12)]">
            <User size={28} className="text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-txt-muted mb-3">Create your workspace</p>
          <h1 className="text-3xl font-semibold gradient-text mb-3">Join EliteCode</h1>
          <p className="text-sm text-txt-secondary leading-relaxed">Build your account and step into a calmer IDE-style learning environment.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">First</label>
              <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                placeholder="John" className={`input-neon ${errors.firstName ? 'border-neon-red/50' : ''}`} />
              {errors.firstName && <p className="text-neon-red text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Last</label>
              <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                placeholder="Doe" className={`input-neon ${errors.lastName ? 'border-neon-red/50' : ''}`} />
              {errors.lastName && <p className="text-neon-red text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="you@example.com" className={`input-neon ${errors.email ? 'border-neon-red/50' : ''}`} />
            {errors.email && <p className="text-neon-red text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="••••••••" className={`input-neon pr-12 ${errors.password ? 'border-neon-red/50' : ''}`} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-primary">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-neon-red text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Confirm</label>
            <input type="password" value={form.confirm} onChange={(e) => setForm({...form, confirm: e.target.value})}
              placeholder="••••••••" className={`input-neon ${errors.confirm ? 'border-neon-red/50' : ''}`} />
            {errors.confirm && <p className="text-neon-red text-xs mt-1">{errors.confirm}</p>}
          </div>

          {errors.submit && (
            <div className="p-3 rounded-xl bg-neon-red/10 border border-neon-red/20 text-neon-red text-sm">{errors.submit}</div>
          )}

          <NeonButton type="submit" variant="solid" size="lg" loading={isPending} className="w-full">
            Create Account <ArrowRight size={16} className="ml-2" />
          </NeonButton>
        </form>

        <p className="text-center text-sm text-txt-muted mt-6">
          Already have one?{' '}
          <Link to="/login" className="text-cyan hover:text-cyan/80 font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
