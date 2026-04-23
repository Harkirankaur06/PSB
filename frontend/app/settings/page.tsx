'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Lock, Bell, Eye, ChevronRight } from 'lucide-react';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';

export default function SettingsPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

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
        </Card>
      </div>
    </MainLayout>
  );
}
