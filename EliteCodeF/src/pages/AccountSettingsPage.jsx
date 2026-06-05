import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Mail } from 'lucide-react'
import { userService } from '../api/userService'
import { authService } from '../api/authService'
import { useAuth } from '../hooks/useAuth'
import useToastStore from '../store/toastStore'
import { NeonButton } from '../components/NeonButton'
import { Spinner } from '../components/Spinner'
import { getErrorMessage } from '../utils/error'
import { TwoFactorSetup } from '../components/TwoFactorSetup'

export function AccountSettingsPage() {
    const navigate = useNavigate()
    const { addToast } = useToastStore()
    const { logout } = useAuth()
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ['user'],
        queryFn: userService.getCurrentUser,
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

    const updateProfile = useMutation({
        mutationFn: () => userService.updateProfile(form.firstName, form.lastName, form.email),
        onSuccess: () => {
            addToast('Profile updated', 'success')
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
        if (passwordForm.newPassword.length < 6) {
            addToast('Password must be at least 6 characters', 'error')
            return
        }
        changePassword.mutate()
    }

    if (isLoading) return <Spinner />

    return (
        <div className="min-h-screen bg-void p-6">
            <div className="max-w-3xl mx-auto">
                <Link to="/" className="inline-flex items-center gap-2 text-txt-secondary hover:text-cyan mb-6 transition-colors">
                    <ArrowLeft size={18} /> Back to Workspace
                </Link>

                <div className="space-y-6">
                    {/* Profile Info */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-txt-primary mb-4">Profile Information</h2>
                        <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate() }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">First Name</label>
                                    <input
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                        className="input-neon w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">Last Name</label>
                                    <input
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                        className="input-neon w-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">Email</label>
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
                    </div>

                    {/* Change Password */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-txt-primary mb-4">Change Password</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="input-neon w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="input-neon w-full"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-txt-muted uppercase mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="input-neon w-full"
                                    required
                                />
                            </div>
                            <NeonButton type="submit" variant="solid" loading={changePassword.isPending}>
                                Update Password
                            </NeonButton>
                        </form>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-xl font-semibold text-txt-primary mb-4">Two-Factor Authentication</h2>
                        <TwoFactorSetup />
                    </div>

                    {/* Danger Zone */}
                    <div className="glass-panel rounded-2xl p-6 border-neon-red/20">
                        <h2 className="text-xl font-semibold text-neon-red mb-4">Danger Zone</h2>
                        <p className="text-sm text-txt-secondary mb-4">Once you delete your account, there is no going back. All data will be permanently removed.</p>
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
                </div>
            </div>
        </div>
    )
}