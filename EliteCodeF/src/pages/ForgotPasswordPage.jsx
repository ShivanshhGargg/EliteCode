import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';
import useToastStore from '../store/toastStore';
import { NeonButton } from '../components/NeonButton';
import { getErrorMessage } from '../utils/error';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { addToast } = useToastStore();

    const { mutate, isPending } = useMutation({
        mutationFn: () => authService.forgotPassword(email),
        onSuccess: () => {
            addToast('If an account exists, a reset link was sent.', 'success');
        },
        onError: (err) => addToast(getErrorMessage(err), 'error'),
    });

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="glass-panel rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-semibold mb-4">Reset password</h2>
                <p className="text-sm text-txt-secondary mb-6">
                    Enter your email and we’ll send you a link to reset your password.
                </p>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-neon w-full mb-4"
                />
                <NeonButton onClick={() => mutate()} loading={isPending} variant="solid" className="w-full">
                    Send reset link
                </NeonButton>
                <div className="text-center mt-4">
                    <Link to="/login" className="text-xs text-cyan">Back to login</Link>
                </div>
            </div>
        </div>
    );
}