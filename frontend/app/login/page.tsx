'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBehaviorMonitor } from '@/lib/behavior-monitor';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const previousPasswordLength = useRef(0);
  const panicHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panicTriggered = useRef(false);
  const { snapshot, track } = useBehaviorMonitor('login');

  const startHiddenPanicTrigger = () => {
    panicTriggered.current = false;

    if (panicHoldTimer.current) {
      clearTimeout(panicHoldTimer.current);
    }

    panicHoldTimer.current = setTimeout(() => {
      panicTriggered.current = true;
      track('duress_signal', { detail: 'Hidden panic trigger opened private options' });
      setSafetyOpen(true);
    }, 1800);
  };

  const stopHiddenPanicTrigger = () => {
    if (panicHoldTimer.current) {
      clearTimeout(panicHoldTimer.current);
      panicHoldTimer.current = null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    track('submit_attempt', { detail: 'Login submitted' });

    try {
      const data = await apiRequest<{
        accessToken: string;
        refreshToken: string;
        deviceId: string;
      }>('/api/auth/login', {
        auth: false,
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('deviceId', data.deviceId);

      router.push('/verify');
    } catch (err: any) {
      track('submit_failure', {
        detail: err?.message || 'Login failed',
      });
      setError(err.message || 'Something went wrong');
    }

    setLoading(false);
  };

  const anomalyTone =
    snapshot?.anomalyLevel === 'high'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : snapshot?.anomalyLevel === 'medium'
        ? 'border-primary/30 bg-primary/5 text-primary'
        : 'border-border bg-muted/40 text-muted-foreground';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Dialog
          open={safetyOpen}
          onOpenChange={(open) => {
            setSafetyOpen(open);
            track(open ? 'dialog_open' : 'dialog_close', {
              detail: 'Coercion support dialog',
            });
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Private account options</DialogTitle>
              <DialogDescription>
                If you have already configured a private access password, use it in the normal
                password field to enter protected mode without changing the visible login flow.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Use your private access password in the same password field when you need protected mode.
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  track('safe_exit', { detail: 'Safe exit chosen from login' });
                  window.location.href = 'https://www.google.com';
                }}
              >
                <X className="h-4 w-4" />
                Safe exit now
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setSafetyOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">L.E.G.E.N.D.</h1>
          <p className="text-muted-foreground">Sign in to your financial journey</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Private access uses the same login form and can be configured later from settings.
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setSafetyOpen(true)}>
                Private options
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {snapshot && (
              <div className={`rounded-lg border p-3 text-xs ${anomalyTone}`}>
                Session anomaly score {snapshot.anomalyScore}/100.
                {snapshot.correctionCount > 0
                  ? ` ${snapshot.correctionCount} correction events have been recorded.`
                  : ' Interaction pattern looks normal so far.'}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  if (nextValue.length < email.length) {
                    track('field_correction', { field: 'email' });
                  } else {
                    track('field_change', { field: 'email' });
                  }
                  setEmail(nextValue);
                }}
                className="w-full"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (nextValue.length < previousPasswordLength.current) {
                      track('field_correction', { field: 'password' });
                    } else {
                      track('field_change', { field: 'password' });
                    }
                    previousPasswordLength.current = nextValue.length;
                    setPassword(nextValue);
                  }}
                  className="w-full pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    track('password_toggle', {
                      detail: showPassword ? 'Password hidden' : 'Password revealed',
                    });
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
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
              onClick={(event) => {
                if (panicTriggered.current) {
                  event.preventDefault();
                  panicTriggered.current = false;
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <Link href="#" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="#" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
