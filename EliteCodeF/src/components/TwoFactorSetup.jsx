import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../api/authService';
import useToastStore from '../store/toastStore';
import { NeonButton } from './NeonButton';
import { QRCodeSVG } from 'qrcode.react'; // install: npm install qrcode.react

export function TwoFactorSetup() {
    const [step, setStep] = useState('init'); // init, showQR, verify
    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [code, setCode] = useState('');
    const { addToast } = useToastStore();

    const setupMutation = useMutation({
        mutationFn: () => authService.setupTwoFactor(),
        onSuccess: (data) => {
            setSecret(data.secret);
            setOtpauthUrl(data.otpauthUrl);
            setStep('showQR');
        },
        onError: (err) => addToast(err.message, 'error'),
    });

    const enableMutation = useMutation({
        mutationFn: (code) => authService.enableTwoFactor(code),
        onSuccess: () => {
            addToast('2FA enabled successfully', 'success');
            setStep('enabled');
        },
        onError: (err) => addToast(err.message, 'error'),
    });

    const disableMutation = useMutation({
        mutationFn: (code) => authService.disableTwoFactor(code),
        onSuccess: () => {
            addToast('2FA disabled', 'success');
            setStep('init');
        },
        onError: (err) => addToast(err.message, 'error'),
    });

    if (step === 'init') {
        return (
            <div>
                <NeonButton onClick={() => setupMutation.mutate()}>Set up 2FA</NeonButton>
                {disableMutation.isIdle && (
                    <NeonButton variant="ghost" onClick={() => setStep('disable')} className="ml-2">Disable 2FA</NeonButton>
                )}
            </div>
        );
    }

    if (step === 'showQR') {
        return (
            <div className="space-y-4">
                <p>Scan this QR code with Google Authenticator or any TOTP app:</p>
                <QRCodeSVG value={otpauthUrl} size={200} />
                <p>Or manually enter the secret: <code className="bg-black/30 p-1 rounded">{secret}</code></p>
                <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-neon w-48"
                />
                <NeonButton onClick={() => enableMutation.mutate(code)} loading={enableMutation.isPending}>
                    Verify and Enable
                </NeonButton>
            </div>
        );
    }

    if (step === 'disable') {
        return (
            <div className="space-y-4">
                <p>Enter your current TOTP code to disable 2FA:</p>
                <input
                    type="text"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-neon w-48"
                />
                <NeonButton onClick={() => disableMutation.mutate(code)} variant="magenta" loading={disableMutation.isPending}>
                    Disable 2FA
                </NeonButton>
            </div>
        );
    }

    return <div>2FA is enabled. Your account is protected.</div>;
}