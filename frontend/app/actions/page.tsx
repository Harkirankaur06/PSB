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
} from 'lucide-react';

const actionItems = [
  {
    id: 1,
    title: 'Verify Tax Documents',
    description: 'Upload 2024 tax documents for portfolio optimization',
    status: 'pending',
    priority: 'high',
    icon: FileText,
  },
  {
    id: 2,
    title: 'Rebalance Portfolio',
    description: 'Your portfolio allocation has drifted 5% from target',
    status: 'recommended',
    priority: 'medium',
    icon: TrendingUp,
  },
  {
    id: 3,
    title: 'Schedule Advisor Call',
    description: 'Quarterly review with your financial advisor',
    status: 'scheduled',
    priority: 'low',
    icon: Clock,
  },
  {
    id: 4,
    title: 'Review Beneficiaries',
    description: 'Update beneficiaries on your investment accounts',
    status: 'pending',
    priority: 'high',
    icon: FileText,
  },
  {
    id: 5,
    title: 'Deposit Funds',
    description: 'Make a contribution to your retirement fund',
    status: 'recommended',
    priority: 'medium',
    icon: DollarSign,
  },
  {
    id: 6,
    title: 'Claim Tax Credits',
    description: 'You may be eligible for $1,200 in tax credits',
    status: 'recommended',
    priority: 'high',
    icon: AlertCircle,
  },
];

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

export default function ActionCenterPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Action Center
          </h1>
          <p className="text-muted-foreground">
            Recommended actions to optimize your finances
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Actions</p>
            <p className="text-3xl font-bold text-foreground">
              {actionItems.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-3xl font-bold text-warning">
              {actionItems.filter((a) => a.status === 'pending').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Recommended</p>
            <p className="text-3xl font-bold text-primary">
              {actionItems.filter((a) => a.status === 'recommended').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Potential Value</p>
            <p className="text-3xl font-bold text-success">$1.2K</p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            All Actions
          </Button>
          <Button size="sm" variant="outline">
            Pending
          </Button>
          <Button size="sm" variant="outline">
            Recommended
          </Button>
          <Button size="sm" variant="outline">
            High Priority
          </Button>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          {actionItems.map((action) => {
            const StatusIcon =
              statusConfig[action.status as keyof typeof statusConfig]?.icon ||
              AlertCircle;
            const config =
              statusConfig[action.status as keyof typeof statusConfig];

            return (
              <Card key={action.id} className="p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-lg ${config?.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <action.icon className={`h-5 w-5 ${config?.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {action.title}
                      </h3>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          priorityConfig[
                            action.priority as keyof typeof priorityConfig
                          ]
                        }`}
                      >
                        {action.priority.charAt(0).toUpperCase() +
                          action.priority.slice(1)}
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">
                      {action.description}
                    </p>

                    <div className="flex gap-2">
                      <Button size="sm" className="gap-2">
                        Take Action
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Completed Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recently Completed
          </h2>
          <div className="space-y-3">
            {[
              { title: 'Update Emergency Fund', date: '2 days ago' },
              { title: 'Review Insurance Coverage', date: '1 week ago' },
              { title: 'Adjust Asset Allocation', date: '2 weeks ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
