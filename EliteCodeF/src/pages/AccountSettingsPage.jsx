import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    ShieldCheck,
    KeyRound,
    Trash2,
    Link as LinkIcon,
    CalendarDays,
} from 'lucide-react'
import { userService } from '../api/userService'
import { authService } from '../api/authService'
import { useAuth } from '../hooks/useAuth'
import useToastStore from '../store/toastStore'
import { NeonButton } from '../components/NeonButton'
import { Spinner } from '../components/Spinner'
import { getErrorMessage } from '../utils/error'
import { TwoFactorSetup } from '../components/TwoFactorSetup'

const formatDate = (value) => {
    if (!value) return 'Not available'
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function AccountSettingsPage() {
    const navigate = useNavigate()
    const { addToast } = useToastStore()
    const { logout, login, accessToken } = useAuth()
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ['user'],
        queryFn: userService.getCurrentUser,
    })

    const { data: accounts = [] } = useQuery({
        queryKey: ['accounts'],
        queryFn: userService.getAccounts,
    })

    useEffect(() => {
        if (user) {
            setForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
            })
        }
    }, [user])

    const displayName = useMemo(() => {
        const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
        return fullName || user?.email?.split('@')[0] || 'EliteCode User'
    }, [user])

    const initials = useMemo(() => {
        const names = [user?.firstName, user?.lastName].filter(Boolean)
        if (names.length) return names.map((name) => name[0]).join('').slice(0, 2).toUpperCase()
        return user?.email?.[0]?.toUpperCase() || 'U'
    }, [user])

    const updateProfile = useMutation({
        mutationFn: () => userService.updateProfile(form.firstName, form.lastName, form.email),
        onSuccess: (updatedUser) => {
            addToast('Profile updated', 'success')
            login(updatedUser, accessToken)
            refetch()
        },
        onError: (err) => addToast(getErrorMessage(err), 'error'),
    })

    const changePassword = useMutation({
        mutationFn: () => authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
        onSuccess: () => {
            addToast('Password changed successfully', 'success')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        },
        onError: (err) => addToast(getErrorMessage(err), 'error'),
    })

    const deleteAccount = useMutation({
        mutationFn: () => userService.deleteAccount(),
        onSuccess: async () => {
            addToast('Account deleted', 'success')
            await logout()
            navigate('/login')
        },
        onError: (err) => addToast(getErrorMessage(err), 'error'),
    })

    const handlePasswordSubmit = (e) => {
        e.preventDefault()
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addToast('New passwords do not match', 'error')
            return
        }
        if (passwordForm.newPassword.length < 8) {
            addToast('Password must be at least 8 characters', 'error')
            return
        }
        changePassword.mutate()
    }

    if (isLoading) return <Spinner />

    return (
        <div className="min-h-screen bg-void px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-txt-secondary hover:text-cyan transition-colors">
                    <ArrowLeft size={18} /> Back to Workspace
                </Link>

                <section className="glass-panel rounded-2xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet to-magenta flex items-center justify-center text-2xl font-bold text-white shadow-neon-violet">
                                {initials}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.28em] text-txt-muted mb-2">Account</p>
                                <h1 className="text-3xl font-semibold text-txt-primary">{displayName}</h1>
                                <p className="text-sm text-txt-secondary mt-2 flex items-center gap-2">
                                    <Mail size={15} className="text-cyan" /> {user?.email}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 min-w-full md:min-w-[320px]">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <CalendarDays size={18} className="text-violet mb-3" />
                                <p className="text-xs text-txt-muted uppercase tracking-[0.18em]">Joined</p>
                                <p className="text-sm text-txt-primary mt-1">{formatDate(user?.createdAt)}</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <LinkIcon size={18} className="text-cyan mb-3" />
                                <p className="text-xs text-txt-muted uppercase tracking-[0.18em]">Linked</p>
                                <p className="text-sm text-txt-primary mt-1">{accounts.length || 1} account{(accounts.length || 1) === 1 ? '' : 's'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                                <User size={20} className="text-cyan" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-txt-primary">Profile Information</h2>
                                <p className="text-sm text-txt-muted">Keep your workspace identity up to date.</p>
                            </div>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate() }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-[0.18em] mb-2">First Name</label>
                                    <input
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        className="input-neon w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase tracking-[0.18em] mb-2">Last Name</label>
                                    <input
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        className="input-neon w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-txt-muted uppercase tracking-[0.18em] mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="input-neon w-full"
                                />
                            </div>
                            <NeonButton type="submit" variant="solid" loading={updateProfile.isPending}>
                                <Save size={14} className="mr-2" /> Save Changes
                            </NeonButton>
                        </form>
                    </section>

                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-violet/10 border border-violet/20 flex items-center justify-center">
                                <ShieldCheck size={20} className="text-violet" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-txt-primary">Security</h2>
                                <p className="text-sm text-txt-muted">Password and two-factor protection.</p>
                            </div>
                        </div>
                        <TwoFactorSetup />
                    </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-magenta/10 border border-magenta/20 flex items-center justify-center">
                                <KeyRound size={20} className="text-magenta" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-txt-primary">Change Password</h2>
                                <p className="text-sm text-txt-muted">Use at least 8 characters.</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="input-neon w-full"
                                placeholder="Current password"
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="input-neon w-full"
                                placeholder="New password"
                                required
                            />
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="input-neon w-full"
                                placeholder="Confirm new password"
                                required
                            />
                            <NeonButton type="submit" variant="solid" loading={changePassword.isPending}>
                                Update Password
                            </NeonButton>
                        </form>
                    </section>

                    <section className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center">
                                <LinkIcon size={20} className="text-cyan" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-txt-primary">Linked Accounts</h2>
                                <p className="text-sm text-txt-muted">Sign-in methods connected to this profile.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(accounts.length ? accounts : [{ provider: 'local', role: 'USER' }]).map((account, index) => (
                                <div key={account.id || index} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-txt-primary capitalize">{account.provider}</p>
                                        <p className="text-xs text-txt-muted mt-1">{account.role || 'USER'}</p>
                                    </div>
                                    <span className="text-xs text-neon-green bg-neon-green/10 border border-neon-green/20 rounded-full px-3 py-1">
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <section className="glass-panel rounded-2xl p-6 border-neon-red/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neon-red/10 border border-neon-red/25 flex items-center justify-center shrink-0">
                                <Trash2 size={20} className="text-neon-red" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-neon-red">Danger Zone</h2>
                                <p className="text-sm text-txt-secondary mt-1">Deleting your account permanently removes your profile and learning data.</p>
                            </div>
                        </div>
                        <NeonButton
                            variant="ghost"
                            onClick={() => {
                                if (window.confirm('Are you sure? This action is irreversible.')) deleteAccount.mutate()
                            }}
                            loading={deleteAccount.isPending}
                            className="border-neon-red/30 text-neon-red hover:bg-neon-red/10"
                        >
                            Delete Account
                        </NeonButton>
                    </div>
                </section>
            </div>
        </div>
    )
}
