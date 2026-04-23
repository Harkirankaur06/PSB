'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import {
  UserPlus,
  TrendingUp,
  BarChart3,
  Target,
  CheckCircle,
  Shield,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useSecurityFeed } from '@/lib/app-data';

const iconMap: Record<string, JSX.Element> = {
  UserPlus: <UserPlus className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Lock: <Lock className="h-5 w-5" />,
  AlertTriangle: <AlertTriangle className="h-5 w-5" />,
};

export default function SecurityPage() {
  const { data, loading, error } = useSecurityFeed();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading security timeline...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load security timeline.'}</div>
      </MainLayout>
    );
  }

  const accountSecure = data.cyber.protectionScore >= 70 && data.status.hasPin;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Security Timeline</h1>
          <p className="text-muted-foreground">
            Activity and cyber decisions powered by your protection modules
          </p>
        </div>

        <Card className="p-6 bg-success/5 border-success/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                {accountSecure ? 'Your account is secure' : 'Security needs attention'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Protection score {data.cyber.protectionScore}/100 with trust score{' '}
                {data.cyber.trustScore}/100.
              </p>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h2>
          <div className="space-y-4">
            {data.timeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                    {iconMap[event.icon] || <CheckCircle className="h-5 w-5" />}
                  </div>
                  {index < data.timeline.length - 1 && <div className="w-0.5 h-12 bg-border" />}
                </div>

                <Card className="p-4 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security Features
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">PIN Verification</span>
              <span className="text-xs font-semibold text-success uppercase">
                {data.status.hasPin ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">Biometric Login</span>
              <span className="text-xs font-semibold text-success uppercase">
                {data.status.hasBiometric ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">Flagged Transactions</span>
              <span className="text-xs font-semibold text-warning uppercase">
                {data.cyber.summary.totalWarned + data.cyber.summary.totalBlocked}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
