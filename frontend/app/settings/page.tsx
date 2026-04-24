'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Bell, Eye, ChevronRight } from 'lucide-react';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import { apiRequest } from '@/lib/api-client';
import { setDuressProtection } from '@/lib/behavior-monitor';
import { useSessionSecurity } from '@/lib/session-security';

export default function SettingsPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();
  const { duressActive, refreshStatus, status } = useSessionSecurity();
  const [duressPassword, setDuressPassword] = useState('');
  const [duressStatus, setDuressStatus] = useState('');
  const [duressLoading, setDuressLoading] = useState(false);
  const [resolvePassword, setResolvePassword] = useState('');
  const [resolvePin, setResolvePin] = useState('');
  const [resolveOtp, setResolveOtp] = useState('');
  const [resolveStatus, setResolveStatus] = useState('');
  const [resolveOtpLoading, setResolveOtpLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const overviewSecurityStatus = data?.cyber.securityStatus;
  const recoveryActive =
    duressActive ||
    status?.accessMode === 'duress' ||
    Boolean(status?.restrictedMode) ||
    overviewSecurityStatus?.accessMode === 'duress' ||
    Boolean(overviewSecurityStatus?.restrictedMode);
  const hasDuressPasswordConfigured =
    status?.hasDuressPassword ?? overviewSecurityStatus?.hasDuressPassword ?? false;

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading settings...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load settings.'}</div>
      </MainLayout>
    );
  }

  const nameParts = data.profile.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const saveDuressPassword = async () => {
    if (!duressPassword.trim()) {
      setDuressStatus('Enter a private access password first.');
      return;
    }

    setDuressLoading(true);
    setDuressStatus('');

    try {
      await apiRequest('/api/security/duress-password', {
        method: 'POST',
        body: JSON.stringify({ duressPassword }),
      });
      setDuressPassword('');
      await refreshStatus();
      window.dispatchEvent(new Event('legend-security-refresh'));
      setDuressStatus('Private access password saved.');
    } catch (err) {
      setDuressStatus(err instanceof Error ? err.message : 'Unable to save private access password.');
    } finally {
      setDuressLoading(false);
    }
  };

  const startProductTour = () => {
    window.localStorage.removeItem('legend.appTourComplete');
    window.dispatchEvent(new Event('legend-tour:start'));
  };

  const sendResolveOtp = async () => {
    setResolveOtpLoading(true);
    setResolveStatus('');

    try {
      const response = await apiRequest<{ deliveryMode: string; expiresAt: string }>(
        '/api/security/duress-resolution/send-otp',
        {
          method: 'POST',
        }
      );

      setResolveStatus(
        response.deliveryMode === 'smtp'
          ? 'OTP sent to your registered email.'
          : 'OTP generated. Email is in fallback mode, so check backend logs if needed.'
      );
    } catch (err) {
      setResolveStatus(
        err instanceof Error ? err.message : 'Unable to send the protected-mode OTP.'
      );
    } finally {
      setResolveOtpLoading(false);
    }
  };

  const resolveDuressSession = async () => {
    if (!resolvePassword.trim() || resolvePin.length !== 4 || resolveOtp.length !== 6) {
      setResolveStatus('Enter the private password, 4-digit PIN, and 6-digit OTP first.');
      return;
    }

    setResolveLoading(true);
    setResolveStatus('');

    try {
      await apiRequest('/api/security/duress-resolution/resolve', {
        method: 'POST',
        body: JSON.stringify({
          duressPassword: resolvePassword,
          pin: resolvePin,
          otp: resolveOtp,
        }),
      });

      setResolvePassword('');
      setResolvePin('');
      setResolveOtp('');
      setDuressProtection(false);
      await refreshStatus();
      window.dispatchEvent(new Event('legend-security-refresh'));
      setResolveStatus('Protected mode cleared. Full account functionality has been restored.');
    } catch (err) {
      setResolveStatus(
        err instanceof Error ? err.message : 'Unable to exit protected mode right now.'
      );
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage account preferences using your current profile and security data
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
              <Input type="text" defaultValue={firstName} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
              <Input type="text" defaultValue={lastName} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <Input type="email" defaultValue={data.profile.email} className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tracked Net Worth</label>
              <Input type="text" defaultValue={formatCurrency(data.metrics.netWorth)} className="w-full" />
            </div>
          </div>
          <Button className="mt-6 bg-primary hover:bg-primary/90">Save Changes</Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security & Privacy
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Trust Score</h3>
                <p className="text-sm text-muted-foreground">Dynamic cyber trust from backend</p>
              </div>
              <span className="text-xs font-semibold text-success uppercase">
                {data.profile.trustScore}/100
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">PIN Verification</h3>
                <p className="text-sm text-muted-foreground">Step-up authentication for sensitive actions</p>
              </div>
              <span className="text-xs font-semibold text-success uppercase">
                {data.cyber.securityStatus.hasPin ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Biometric Login</h3>
                <p className="text-sm text-muted-foreground">Face or fingerprint sign-in status</p>
              </div>
              <span className="text-xs font-semibold text-success uppercase">
                {data.cyber.securityStatus.hasBiometric ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Trusted Devices</h3>
                <p className="text-sm text-muted-foreground">Devices seen on your account</p>
              </div>
              <Button variant="outline" size="sm">
                {data.profile.devices.length} devices
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="mb-3">
                <h3 className="font-medium text-foreground">Private access setup</h3>
                <p className="text-sm text-muted-foreground">
                  Configure a hidden secondary password that signs in using protected mode.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  type="password"
                  value={duressPassword}
                  onChange={(e) => setDuressPassword(e.target.value)}
                  placeholder="Set private access password"
                />
                <Button onClick={saveDuressPassword} disabled={duressLoading}>
                  {duressLoading ? 'Saving...' : 'Save private password'}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Status: {hasDuressPasswordConfigured ? 'Configured' : 'Not configured'}
              </p>
              {duressStatus && <p className="mt-2 text-xs text-primary">{duressStatus}</p>}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              {
                title: 'Large Transactions',
                description: `Alert when cyber engine sees unusual payments (${data.cyber.summary.totalWarned} warnings).`,
              },
              {
                title: 'Portfolio Alerts',
                description: `Track portfolio change of ${data.dashboard.portfolio.changePercent}% this cycle.`,
              },
              {
                title: 'Goal Progress',
                description: `${data.goals.length} active goals are monitored for drift.`,
              },
              {
                title: 'Security Events',
                description: `${data.cyber.summary.totalBlocked} blocked attempts and live verification status.`,
              },
            ].map((notification) => (
              <div
                key={notification.title}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div>
                  <h3 className="font-medium text-foreground">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">{notification.description}</p>
                </div>
                <div className="w-12 h-7 rounded-full bg-primary/30 relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Privacy & Data
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Download Your Data</h3>
                <p className="text-sm text-muted-foreground">Export profile, goals, and financial records</p>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Marketing Communications</h3>
                <p className="text-sm text-muted-foreground">Receive updates about new features</p>
              </div>
              <div className="w-12 h-7 rounded-full bg-primary/30 relative cursor-pointer">
                <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <h2 className="text-lg font-semibold text-foreground mb-6">Account Management</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span>Sign Out All Devices</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between text-destructive">
              <span>Delete Account</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-foreground">Product Tour</h3>
                <p className="text-sm text-muted-foreground">
                  Replay the guided walk-through for navigation, alerts, and safety controls.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={startProductTour}
                data-duress-allow="true"
              >
                Start Tour
              </Button>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-4"
            data-duress-allow="true"
          >
            <div className="mb-4">
              <h3 className="font-medium text-foreground">Protected Mode Recovery</h3>
              <p className="text-sm text-muted-foreground">
                {recoveryActive
                  ? 'Use this only after the duress event is over. Confirm private password, PIN, and OTP to restore full access.'
                  : 'Protected mode is currently inactive. This recovery flow stays ready in case you need it later.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Input
                type="password"
                value={resolvePassword}
                onChange={(e) => setResolvePassword(e.target.value)}
                placeholder="Private password"
                data-duress-allow="true"
              />
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={resolvePin}
                onChange={(e) => setResolvePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4-digit PIN"
                data-duress-allow="true"
              />
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={resolveOtp}
                onChange={(e) => setResolveOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit OTP"
                data-duress-allow="true"
              />
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row">
              <Button
                variant="outline"
                onClick={sendResolveOtp}
                disabled={resolveOtpLoading}
                data-duress-allow="true"
              >
                {resolveOtpLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
              <Button
                onClick={resolveDuressSession}
                disabled={resolveLoading}
                data-duress-allow="true"
              >
                {resolveLoading ? 'Restoring access...' : "I'm safe now"}
              </Button>
            </div>

            {resolveStatus && <p className="mt-3 text-sm text-foreground">{resolveStatus}</p>}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
