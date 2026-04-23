'use client';

import { useEffect, useRef, useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Fingerprint,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useBehaviorMonitor } from '@/lib/behavior-monitor';
import { apiRequest } from '@/lib/api-client';

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
  accessMode?: 'normal' | 'duress';
  restrictedMode?: boolean;
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
  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpStatus, setOtpStatus] = useState('');
  const panicHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { track, setDuressProtection } = useBehaviorMonitor('verify');

  const activatePrivateSession = async () => {
    try {
      await apiRequest('/api/security/private-session', {
        method: 'POST',
      });
      setDuressProtection(true);
      track('duress_signal', {
        detail: 'Private session activated on backend',
      });
      setStatus((current) =>
        current
          ? {
              ...current,
              accessMode: 'duress',
              restrictedMode: true,
            }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to continue on this device.');
    }
  };

  const startHiddenPanicTrigger = () => {
    if (panicHoldTimer.current) {
      clearTimeout(panicHoldTimer.current);
    }

    panicHoldTimer.current = setTimeout(() => {
      activatePrivateSession();
    }, 1800);
  };

  const stopHiddenPanicTrigger = () => {
    if (panicHoldTimer.current) {
      clearTimeout(panicHoldTimer.current);
      panicHoldTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (panicHoldTimer.current) {
        clearTimeout(panicHoldTimer.current);
      }
    };
  }, []);

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
          if (!data.promptTrustDevice) {
            router.replace('/dashboard');
            return;
          }
        }

        if (data.needsSetup) {
          router.replace('/onboarding');
          return;
        }

        setStatus(data);
        setOtpOpen(Boolean(data.promptTrustDevice));
      } catch (err) {
        console.error('Security status fetch failed', err);
        setError(
          err instanceof Error ? err.message : 'Unable to load verification methods.'
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
    track('submit_attempt', { detail: 'Biometric verification started' });

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
      track('submit_failure', { detail: 'Biometric verification failed' });
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
    track('submit_attempt', { detail: 'PIN verification started' });

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
      track('submit_failure', {
        detail: err instanceof Error ? err.message : 'PIN verification failed',
      });
      setError(err instanceof Error ? err.message : 'PIN verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setTrustingDevice(true);
    setError('');
    setOtpStatus('');
    track('otp_request', { detail: 'OTP requested for device trust' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/otp/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to send OTP');
      }

      setOtpStatus(
        data.deliveryMode === 'smtp'
          ? 'OTP sent to your email.'
          : 'OTP generated. Email service is in fallback mode; check backend logs.'
      );
    } catch (err) {
      track('otp_failure', {
        detail: err instanceof Error ? err.message : 'Unable to send OTP',
      });
      setError(err instanceof Error ? err.message : 'Unable to send OTP.');
    } finally {
      setTrustingDevice(false);
    }
  };

  const handleVerifyOtp = async () => {
    setTrustingDevice(true);
    setError('');
    track('otp_attempt', { detail: 'OTP verification attempted' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unable to verify OTP');
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
      setOtpOpen(false);
      setOtp('');
      setOtpStatus('Device trusted successfully.');
    } catch (err) {
      track('otp_failure', {
        detail: err instanceof Error ? err.message : 'Unable to verify OTP',
      });
      setError(err instanceof Error ? err.message : 'Unable to verify OTP.');
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
        <Dialog
          open={otpOpen}
          onOpenChange={(open) => {
            setOtpOpen(open);
            track(open ? 'dialog_open' : 'dialog_close', {
              detail: 'OTP trust dialog',
            });
          }}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Verify New Device</DialogTitle>
              <DialogDescription>
                We detected a new device login. Send an OTP to your email and verify it before
                trusting this device.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Button onClick={handleSendOtp} disabled={trustingDevice} className="w-full">
                {trustingDevice ? 'Sending OTP...' : 'Send OTP to Email'}
              </Button>

              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length < otp.length) {
                    track('field_correction', { field: 'otp' });
                  } else {
                    track('field_change', { field: 'otp' });
                  }
                  setOtp(value);
                }}
              />

              {otpStatus && <p className="text-sm text-muted-foreground">{otpStatus}</p>}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOtpOpen(false)}
                disabled={trustingDevice}
              >
                Later
              </Button>
              <Button onClick={handleVerifyOtp} disabled={trustingDevice || otp.length !== 6}>
                {trustingDevice ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
              <button
                type="button"
                className="inline-flex items-center justify-center"
                onPointerDown={startHiddenPanicTrigger}
                onPointerUp={stopHiddenPanicTrigger}
                onPointerLeave={stopHiddenPanicTrigger}
                onPointerCancel={stopHiddenPanicTrigger}
                onKeyDown={(event) => {
                  if (event.key === ' ' || event.key === 'Enter') {
                    startHiddenPanicTrigger();
                  }
                }}
                onKeyUp={stopHiddenPanicTrigger}
                aria-label="Verification shield"
              >
                <ShieldCheck className="w-8 h-8 text-primary" />
              </button>
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
            {status?.promptTrustDevice && !otpOpen && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div>
                  <p className="font-medium text-foreground">Trust this device?</p>
                  <p className="text-sm text-muted-foreground">
                    {status.currentDevice?.deviceName || 'This device'} is new to your account.
                    Verify it by email OTP before marking it as trusted.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setOtpOpen(true)}
                    disabled={trustingDevice}
                    className="w-full"
                  >
                    Open OTP Popup
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
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length < pin.length) {
                        track('field_correction', { field: 'pin' });
                      } else {
                        track('field_change', { field: 'pin' });
                      }
                      setPin(value);
                    }}
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
