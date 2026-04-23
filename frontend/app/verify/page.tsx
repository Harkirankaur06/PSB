'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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
      window.dispatchEvent(new Event('legend-security-refresh'));
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
        if (data.needsSetup) {
          router.replace('/onboarding');
          return;
        }

        if (!data.promptTrustDevice) {
          router.replace('/dashboard');
          return;
        }
      }

      setStatus(data);
      setOtpOpen(Boolean(data.requiresVerification || data.promptTrustDevice));
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
      if (status?.needsSetup) {
        router.push('/onboarding');
        return;
      }

      router.push('/dashboard');
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
            const mustStayOpen =
              Boolean(status?.requiresVerification) && !status?.secondFactorVerified;
            setOtpOpen(mustStayOpen ? true : open);
            track(open ? 'dialog_open' : 'dialog_close', {
              detail: 'OTP trust dialog',
            });
          }}
        >
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Verify Login</DialogTitle>
              <DialogDescription>
                Enter the OTP sent to your email to finish signing in.
                {status?.promptTrustDevice
                  ? ' This will also mark the current device as trusted.'
                  : ''}
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
              OTP verification is required before continuing to your account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div>
                <p className="font-medium text-foreground">Login OTP required</p>
                <p className="text-sm text-muted-foreground">
                  Send and verify the email OTP to complete this sign-in.
                  {status?.currentDevice?.deviceName
                    ? ` Current device: ${status.currentDevice.deviceName}.`
                    : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setOtpOpen(true)}
                  disabled={trustingDevice}
                  className="w-full"
                >
                  Open OTP Verification
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
