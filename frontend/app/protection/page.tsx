'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { protectionData } from '@/lib/mock-data';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

const statusConfig = {
  active: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  inactive: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

export default function ProtectionPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Risk & Protection
            </h1>
            <p className="text-muted-foreground">
              Manage your insurance and risk protection
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Insurance
          </Button>
        </div>

        {/* Overview */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Coverage
                </p>
                <p className="text-2xl font-bold text-foreground">
                  $1.6M
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Active Policies
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {protectionData.filter((p) => p.status === 'active').length}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Monthly Premium
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${protectionData.reduce((sum, p) => sum + p.premium, 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Insurance Policies */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Policies
          </h2>
          <div className="space-y-4">
            {protectionData.map((policy) => {
              const StatusIcon = statusConfig[policy.status as keyof typeof statusConfig].icon;
              const config = statusConfig[policy.status as keyof typeof statusConfig];

              return (
                <Card key={policy.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {policy.name}
                        </h3>
                        <p className={`text-sm ${config.color} capitalize`}>
                          {policy.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Coverage Amount
                      </p>
                      <p className="font-semibold text-foreground">
                        ${policy.coverage.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Monthly Premium
                      </p>
                      <p className="font-semibold text-foreground">
                        ${policy.premium}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Renewal Date
                      </p>
                      <p className="font-semibold text-foreground">
                        {new Date(policy.renewalDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        <Card className="p-6 border-warning/50 bg-warning/5">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Protection Recommendations
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Review life insurance coverage annually or when life circumstances change
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Consider increasing umbrella policy coverage as your assets grow
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Ensure beneficiaries are up to date on all policies
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
}
