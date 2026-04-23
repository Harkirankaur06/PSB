'use client';

import { useEffect, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://psb-backend.onrender.com';

interface SecurityStatus {
  hasPin: boolean;
  hasBiometric: boolean;
  biometricEnabled: boolean;
  hasWebAuthnCredentials: boolean;
  secondFactorVerified: boolean;
  needsSetup: boolean;
  requiresVerification: boolean;
  promptTrustDevice?: boolean;
  currentDevice?: {
    deviceId: string;
    deviceName?: string;
    lastUsed?: string;
    isTrusted?: boolean;
  } | null;
}

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  const deviceId = localStorage.getItem('deviceId');

  return {
    Authorization: `Bearer ${token}`,
    'x-device-id': deviceId || '',
  };
}

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [trustingDevice, setTrustingDevice] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          router.replace('/login');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/security/status`, {
          headers: getAuthHeaders(),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.error || 'Unable to verify session');
        }

        if (data.secondFactorVerified) {
          router.replace('/dashboard');
          return;
        }

        if (data.needsSetup) {
          router.replace('/onboarding');
          return;
        }

        setStatus(data);
      } catch (err) {
        console.error('Security status fetch failed', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load verification methods.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [router]);

  const handleBiometricVerify = async () => {
    setActionLoading(true);
    setError('');

    try {
      const optionsRes = await fetch(
        `${API_BASE_URL}/api/security/webauthn/authenticate/options`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );

      const options = await optionsRes.json();

      if (!optionsRes.ok) {
        throw new Error(options.error || 'Unable to start biometric verification');
      }

      const authResponse = await startAuthentication({
        optionsJSON: options,
      });

      const verifyRes = await fetch(
        `${API_BASE_URL}/api/security/webauthn/authenticate/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(authResponse),
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Biometric verification failed');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Biometric verification failed', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Biometric verification failed on this device.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handlePinVerify = async () => {
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'PIN verification failed');
      }

      if (!data.valid) {
        throw new Error('Incorrect PIN');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('PIN verification failed', err);
      setError(err instanceof Error ? err.message : 'PIN verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrustDevice = async () => {
    setTrustingDevice(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/trust-device`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to trust this device');
      }

      setStatus((current) =>
        current
          ? {
              ...current,
              promptTrustDevice: false,
              currentDevice: current.currentDevice
                ? { ...current.currentDevice, isTrusted: true }
                : current.currentDevice,
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to trust this device.');
    } finally {
      setTrustingDevice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8 text-center text-muted-foreground">
            Verifying your security setup...
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              Verify Your Identity
            </h1>

            <p className="text-muted-foreground">
              Confirm it&apos;s really you before continuing to your account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {status?.promptTrustDevice && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div>
                  <p className="font-medium text-foreground">Trust this device?</p>
                  <p className="text-sm text-muted-foreground">
                    {status.currentDevice?.deviceName || 'This device'} is new to your account.
                    Trusting it helps strengthen future login integrity and reduces friction.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTrustDevice}
                    disabled={trustingDevice}
                    className="flex-1"
                  >
                    {trustingDevice ? 'Trusting device...' : 'Trust This Device'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={trustingDevice}
                    className="flex-1"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            )}

            {status?.hasBiometric && (
              <Button
                onClick={handleBiometricVerify}
                disabled={actionLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {actionLoading ? 'Checking device...' : 'Use Device Biometrics'}
              </Button>
            )}

            {status?.hasPin && (
              <div className="space-y-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    maxLength={4}
                    placeholder="Enter your 4-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="pl-10"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={handlePinVerify}
                  disabled={actionLoading || pin.length !== 4}
                  className="w-full h-11"
                >
                  Verify with PIN
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
