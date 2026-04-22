'use client';

import { useState, useEffect } from 'react';
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

interface ActionItem {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'recommended' | 'scheduled' | 'completed';
  priority: 'high' | 'medium' | 'low';
  icon: any;
}

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

  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchActions = async () => {

      try {

        const token = localStorage.getItem("accessToken");

        const dashboardRes = await fetch(
          "http://https://psb-backend.onrender.com/api/risk/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const goalsRes = await fetch(
          "http://https://psb-backend.onrender.com/api/goals",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const dashboard = await dashboardRes.json();
        const goals = await goalsRes.json();

        const actions: ActionItem[] = [];

        if (dashboard?.savingsRate < 20) {
          actions.push({
            id: 1,
            title: "Increase Savings Rate",
            description: "Your savings rate is below recommended levels",
            status: "recommended",
            priority: "high",
            icon: DollarSign
          });
        }

        if (goals?.length === 0) {
          actions.push({
            id: 2,
            title: "Create Financial Goals",
            description: "Set financial goals to guide your investments",
            status: "pending",
            priority: "high",
            icon: FileText
          });
        }

        if (dashboard?.portfolio?.changePercent < 0) {
          actions.push({
            id: 3,
            title: "Review Portfolio Allocation",
            description: "Your portfolio performance has dropped recently",
            status: "recommended",
            priority: "medium",
            icon: TrendingUp
          });
        }

        actions.push({
          id: 4,
          title: "Schedule Financial Review",
          description: "Quarterly check-in with your financial strategy",
          status: "scheduled",
          priority: "low",
          icon: Clock
        });

        setActionItems(actions);

      } catch (err) {
        console.error("Failed to fetch actions", err);
      }

      setLoading(false);

    };

    fetchActions();

  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading actions...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="space-y-8">

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

        {/* Action Items */}

        <div className="space-y-4">

          {actionItems.map((action) => {

            const config =
              statusConfig[action.status as keyof typeof statusConfig];

            return (

              <Card key={action.id} className="p-6 hover:border-primary/50 transition-colors">

                <div className="flex items-start gap-4">

                  <div
                    className={`w-10 h-10 rounded-lg ${config?.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <action.icon className={`h-5 w-5 ${config?.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-4 mb-2">

                      <h3 className="font-semibold text-foreground">
                        {action.title}
                      </h3>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                          priorityConfig[action.priority]
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

      </div>

    </MainLayout>
  );
}