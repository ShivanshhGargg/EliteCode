import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';
import useToastStore from '../store/toastStore';
import { NeonButton } from '../components/NeonButton';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const { addToast } = useToastStore();

    const { mutate, isPending } = useMutation({
        mutationFn: () => authService.resetPassword(token, newPassword),
        onSuccess: () => {
            addToast('Password reset successfully. Please log in.', 'success');
            navigate('/login');
        },
        onError: (err) => addToast(err.message, 'error'),
    });

    useEffect(() => {
        if (!token) navigate('/forgot-password');
    }, [token, navigate]);

    const handleSubmit = () => {
        if (newPassword !== confirm) {
            addToast('Passwords do not match', 'error');
            return;
        }
        mutate();
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="glass-panel rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-semibold mb-4">Set new password</h2>
                <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-neon w-full mb-3"
                />
                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="input-neon w-full mb-4"
                />
                <NeonButton onClick={handleSubmit} loading={isPending} variant="solid" className="w-full">
                    Reset password
                </NeonButton>
            </div>
        </div>
    );
}