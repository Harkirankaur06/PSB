'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  FileText,
  ArrowRight,
  ScanSearch,
} from 'lucide-react';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import Link from 'next/link';

const statusConfig = {
  pending: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  recommended: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
  scheduled: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  completed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
};

const priorityConfig = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-muted text-muted-foreground',
};

const iconMap = {
  pending: FileText,
  recommended: DollarSign,
  scheduled: Clock,
  completed: CheckCircle,
};

export default function ActionCenterPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading actions...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load action center.'}</div>
      </MainLayout>
    );
  }

  const totalPotentialValue = data.actions.reduce((sum, item) => sum + item.value, 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Action Center</h1>
          <p className="text-muted-foreground">
            AI recommendations and cyber prompts prioritized from your live account data
          </p>
        </div>

        <Card className="border-primary/20 bg-primary/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">SecureWealth Twin workflow</p>
              <p className="text-sm text-muted-foreground">
                Open the explicit hackathon flow that connects recommendation, fraud signals,
                risk scoring, and final action control.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/twin">
                Open Twin
                <ScanSearch className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Actions</p>
            <p className="text-3xl font-bold text-foreground">{data.actions.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold text-warning">
              {data.actions.filter((item) => item.status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Recommended</p>
            <p className="text-3xl font-bold text-primary">
              {data.actions.filter((item) => item.status === 'recommended').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Potential Value</p>
            <p className="text-3xl font-bold text-success">
              {formatCurrency(totalPotentialValue)}
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          {data.actions.map((action) => {
            const config = statusConfig[action.status];
            const ActionIcon = iconMap[action.status];

            return (
              <Card key={action.id} className="p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <ActionIcon className={`h-5 w-5 ${config.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">{action.title}</h3>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          priorityConfig[action.priority]
                        }`}
                      >
                        {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">{action.description}</p>

                    {action.reviewMessage && (
                      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                          {action.reviewType || 'review'}
                        </p>
                        <p className="text-sm text-foreground">{action.reviewMessage}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" className="gap-2">
                        Take Action
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        Linked page {action.actionPath}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
