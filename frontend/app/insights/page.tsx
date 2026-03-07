'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { insightsData } from '@/lib/mock-data';
import {
  Brain,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  ThumbsUp,
} from 'lucide-react';

const iconMap = {
  ai: <Brain className="h-5 w-5 text-primary" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning" />,
  opportunity: <Zap className="h-5 w-5 text-accent" />,
  info: <Info className="h-5 w-5 text-muted-foreground" />,
};

const impactColors = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-warning/10 text-warning',
  low: 'bg-muted text-muted-foreground',
};

export default function InsightsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Personalized recommendations powered by advanced AI
          </p>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {insightsData.map((insight) => (
            <Card
              key={insight.id}
              className="p-6 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {iconMap[insight.type as keyof typeof iconMap]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {insight.title}
                    </h3>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        impactColors[insight.impact as keyof typeof impactColors]
                      }`}
                    >
                      {insight.impact.charAt(0).toUpperCase() +
                        insight.impact.slice(1)} Impact
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">
                    {insight.description}
                  </p>

                  {insight.actionable && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      Take Action
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Analysis Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Deep Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">
                Portfolio Health
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Diversification</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < 4 ? 'bg-primary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="text-sm font-medium text-foreground">
                    Moderate
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rebalance Soon</span>
                  <span className="text-sm font-medium text-warning">
                    In 2 months
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">
                Performance Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">YTD Return</span>
                  <span className="text-sm font-medium text-success">
                    +2.8%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sharpe Ratio</span>
                  <span className="text-sm font-medium text-foreground">
                    1.45
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Benchmark</span>
                  <span className="text-sm font-medium text-foreground">
                    S&P 500
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback */}
        <Card className="p-6 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Was this helpful?
              </h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve our AI recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                Not Helpful
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
