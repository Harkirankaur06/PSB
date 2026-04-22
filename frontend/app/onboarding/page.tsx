'use client';

import { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Fingerprint, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://psb-backend.onrender.com';

type OnboardingStep = 'welcome' | 'biometric' | 'pin' | 'complete';

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  const deviceId = localStorage.getItem('deviceId');

  return {
    Authorization: `Bearer ${token}`,
    'x-device-id': deviceId || '',
  };
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometric = async () => {
    setLoading(true);
    setError('');

    try {
      const optionsRes = await fetch(
        `${API_BASE_URL}/api/security/webauthn/register/options`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(options.error || 'Unable to start biometric setup');
      }

      const registrationResponse = await startRegistration({
        optionsJSON: options,
      });

      const verifyRes = await fetch(
        `${API_BASE_URL}/api/security/webauthn/register/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(registrationResponse),
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Biometric setup failed');
      }

      setStep('pin');
    } catch (err) {
      console.error('Biometric setup failed', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Biometric setup failed on this device.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    setError('');

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/create-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to set PIN');
      }

      setStep('complete');
    } catch (err) {
      console.error('PIN setup failed', err);
      setError(err instanceof Error ? err.message : 'Failed to set PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (step === 'welcome') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-3xl font-bold text-foreground mb-2">
                Secure Your Account
              </h1>

              <p className="text-muted-foreground">
                Set up device biometrics and a PIN to protect your financial data
              </p>
            </div>

            <Button
              onClick={() => setStep('biometric')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              Start Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/dashboard"
                  className="text-primary hover:underline font-medium"
                >
                  Skip for now
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'biometric') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4">
                <Fingerprint className="w-10 h-10 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Enable Device Biometrics
              </h1>

              <p className="text-muted-foreground">
                Register fingerprint, Face ID, Windows Hello, or your device passkey
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleBiometric}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              >
                {loading ? 'Enabling...' : 'Enable Biometric'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('pin')}
                className="w-full h-11"
              >
                Continue with PIN Only
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'pin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Set Your PIN
              </h1>

              <p className="text-muted-foreground">
                Create a 4-digit PIN as backup authentication
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <Input
                type="password"
                maxLength={4}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />

              <Input
                type="password"
                maxLength={4}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <Button
              onClick={handlePinSubmit}
              disabled={loading}
              className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {loading ? 'Saving...' : 'Set PIN'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />

            <h1 className="text-3xl font-bold text-foreground mb-2">
              All Set!
            </h1>

            <p className="text-muted-foreground">
              Your account security setup is complete
            </p>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
          >
            Go to Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
}
