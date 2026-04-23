'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import {
  Activity,
  Brain,
  CalendarRange,
  Clock3,
  ShieldAlert,
} from 'lucide-react';

function getStatusTone(status: string) {
  if (status === 'blocked') return 'bg-destructive/10 text-destructive';
  if (status === 'warning') return 'bg-warning/10 text-warning';
  if (status === 'pending') return 'bg-primary/10 text-primary';
  return 'bg-success/10 text-success';
}

export default function TransactionIntelPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading transaction intelligence...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load transaction intelligence.'}</div>
      </MainLayout>
    );
  }

  const intel = data.transactionIntelligence;

  return (
    <MainLayout>
      <div className="space-y-8">
        <section className="rounded-3xl border border-warning/30 bg-gradient-to-br from-warning/10 via-background to-destructive/5 p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-warning">
                <ShieldAlert className="h-3.5 w-3.5" />
                Fraud Detection Demo
              </div>
              <h1 className="mt-4 text-3xl font-bold text-foreground md:text-4xl">
                {intel.fraudDemo.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                Transactions are fuel for the AI engine, not the product itself. This page shows
                how transaction history powers risk scoring, anomaly detection, and protected
                wealth execution.
              </p>
            </div>

            <Card className="border-warning/30 bg-background/80 p-5 lg:max-w-md">
              <p className="text-xs uppercase tracking-wide text-warning">Critical scenario</p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {formatCurrency(intel.fraudDemo.amount)} at {intel.fraudDemo.timeLabel}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{intel.fraudDemo.explanation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">New device: {intel.fraudDemo.newDevice ? 'Yes' : 'No'}</Badge>
                <Badge variant="outline">High risk: {intel.fraudDemo.highRisk ? 'Yes' : 'No'}</Badge>
                <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                  Risk score {intel.fraudDemo.riskScore}
                </Badge>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Engine outcome</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{intel.fraudDemo.outcome}</p>
              </div>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Smart Transaction Feed</h2>
                <p className="text-sm text-muted-foreground">
                  Transaction history presented as intelligence input with risk tags and anomaly flags.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {intel.feed.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-background/70 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-semibold text-foreground">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">Category: {item.category}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      Risk score {item.riskScore}
                    </span>
                    <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-medium text-foreground">
                      {item.category}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.anomalyFlag
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      Anomaly flag: {item.anomalyFlag ? 'Raised' : 'Clear'}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusTone(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground">{item.anomalyReason}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Insights From Transactions</h2>
                  <p className="text-sm text-muted-foreground">
                    AI-style output generated from transaction history and risk behavior.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {intel.insights.map((insight) => (
                  <div key={insight} className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <CalendarRange className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Behavior Patterns</h2>
                  <p className="text-sm text-muted-foreground">
                    Weekend spikes, salary cycle, and unusual activity patterns derived from history.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {intel.behaviorPatterns.map((pattern) => (
                  <div key={pattern.id} className="rounded-xl border border-border bg-background/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{pattern.title}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {pattern.value}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{pattern.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-muted/30">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Project Alignment</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This tab treats transactions as intelligence input and security evidence.
                    It demonstrates how wealth actions are checked, scored, and blocked or delayed
                    before execution when the risk pattern is abnormal.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
