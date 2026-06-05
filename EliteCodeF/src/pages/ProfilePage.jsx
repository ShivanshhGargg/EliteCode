// src/pages/ProfilePage.jsx
import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Save, User, Mail, Calendar, Trophy, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../api/userService'
import useToastStore from '../store/toastStore'
import { NeonButton } from '../components/NeonButton'
import { Spinner } from '../components/Spinner'
import ThemeSwitcher from '../components/ThemeSwitcher'
import { formatDate, formatSuccessRate } from '../utils/format'
import { getErrorMessage } from '../utils/error'
import { TwoFactorSetup } from '../components/TwoFactorSetup'
import { useAuth } from '../hooks/useAuth';
import { queryClient } from "../api/queryClient.js";

export function ProfilePage() {
    const navigate = useNavigate()
    const { addToast } = useToastStore()
    const [isEditing, setIsEditing] = useState(false)
    const [form, setForm] = useState({})
    const { logout } = useAuth();

    const { data: user, isLoading, refetch } = useQuery({
        queryKey: ['user'],
        queryFn: userService.getCurrentUser,
    })

    useEffect(() => {
        if (user) {
            setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '' })
        }
    }, [user])

    const { data: progress } = useQuery({
        queryKey: ['progress'],
        queryFn: () => userService.getUserProgress(0, 20),
    })

    const { mutate: update, isPending } = useMutation({
        mutationFn: () => userService.updateProfile(form.firstName, form.lastName, form.email),
        onSuccess: () => {
            addToast('Profile updated', 'success')
            setIsEditing(false)
            refetch()
        },
        onError: (e) => addToast(getErrorMessage(e), 'error'),
    })

    const deleteMutation = useMutation({
        mutationFn: () => userService.deleteAccount(),
        onSuccess: async () => {
            addToast('Account deleted successfully', 'success');
            try {
                await logout();
            } catch (err) {
                console.error('Logout error:', err);
            } finally {
                navigate('/login');
            }
        },
        onError: (err) => addToast(getErrorMessage(err), 'error'),
    });

    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: userService.getAccounts,
        enabled: !!user,
    });

    const unlinkMutation = useMutation({
        mutationFn: (accountId) => userService.unlinkAccount(accountId),
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
            addToast('Account unlinked', 'success');
        },
    });

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Spinner size={32} />
        </div>
    )

    return (
        <div className="min-h-screen bg-void">
            <div className="max-w-4xl mx-auto px-6 py-10">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-txt-secondary hover:text-cyan transition-colors mb-8">
                    <ArrowLeft size={18} /> Back to Workspace
                </button>

                <div className="glass-panel rounded-[32px] p-6 md:p-8 mb-6">
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-white text-2xl font-bold shadow-[0_20px_40px_rgba(0,240,255,0.12)]">
                            {user?.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-txt-primary">
                                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0] || 'User'}
                            </h1>
                            <p className="text-txt-secondary mt-1">{user?.email}</p>
                        </div>
                    </div>
                    <p className="text-sm text-txt-secondary leading-relaxed max-w-2xl">
                        Manage your public profile, review progress, and keep your coding workspace synchronized with the backend.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    {[
                        { icon: Trophy, label: 'Solved', value: progress?.content?.reduce((a, b) => a + (b.attempts || 0), 0) || 0, color: 'cyan' },
                        { icon: TrendingUp, label: 'Accuracy', value: formatSuccessRate(progress?.content?.reduce((a, b) => a + (b.successRate || 0), 0) / (progress?.content?.length || 1)), color: 'violet' },
                        { icon: Calendar, label: 'Member Since', value: user?.createdAt ? formatDate(user.createdAt).split(',')[0] : 'N/A', color: 'magenta' },
                    ].map((stat) => (
                        <div key={stat.label} className="glass-panel rounded-[28px] p-5 text-center">
                            <stat.icon size={20} className={`mx-auto mb-2 text-${stat.color}`} />
                            <p className="text-2xl font-semibold gradient-text">{stat.value}</p>
                            <p className="text-xs text-txt-muted mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="glass-panel rounded-[32px] p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-txt-primary">Account Details</h2>
                        <NeonButton variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </NeonButton>
                        <NeonButton variant="ghost" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>
                            Delete account
                        </NeonButton>
                    </div>

                    {isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); update() }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">First Name</label>
                                    <input value={form.firstName} onChange={(e) => setForm({...form, firstName: e.target.value})}
                                           className="input-neon" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Last Name</label>
                                    <input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})}
                                           className="input-neon" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-[0.24em] mb-2">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}
                                       className="input-neon" />
                            </div>
                            <NeonButton type="submit" variant="solid" loading={isPending}>
                                <Save size={14} className="mr-2" /> Save Changes
                            </NeonButton>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 py-3 border-b border-white/5">
                                <User size={16} className="text-txt-muted" />
                                <div>
                                    <p className="text-xs text-txt-muted uppercase tracking-[0.24em]">Name</p>
                                    <p className="text-sm text-txt-primary">{user?.firstName} {user?.lastName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-3 border-b border-white/5">
                                <Mail size={16} className="text-txt-muted" />
                                <div>
                                    <p className="text-xs text-txt-muted uppercase tracking-[0.24em]">Email</p>
                                    <p className="text-sm text-txt-primary">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 py-3">
                                <Calendar size={16} className="text-txt-muted" />
                                <div>
                                    <p className="text-xs text-txt-muted uppercase tracking-[0.24em]">Joined</p>
                                    <p className="text-sm text-txt-primary">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="glass-panel rounded-[32px] p-6 md:p-8 mt-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-txt-primary">Appearance</h2>
                        <span className="text-[10px] uppercase tracking-[0.28em] text-txt-muted">Themes</span>
                    </div>
                    <ThemeSwitcher />
                </div>

                <div className="glass-panel rounded-[32px] p-6 md:p-8 mt-6">
                    <h2 className="text-lg font-semibold text-txt-primary mb-6">Security</h2>
                    <TwoFactorSetup />
                </div>
            </div>

            <div className="glass-panel rounded-[32px] p-6 mt-6">
                <h2 className="text-lg font-semibold mb-4">Linked Accounts</h2>
                {accounts?.length === 0 && <p className="text-txt-muted">No linked accounts</p>}
                {accounts?.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center py-2 border-b border-white/5">
                        <span>{acc.provider} ({acc.email})</span>
                        {acc.provider !== 'local' && (
                            <NeonButton size="sm" variant="ghost" onClick={() => unlinkMutation.mutate(acc.id)}>Unlink</NeonButton>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProfilePage