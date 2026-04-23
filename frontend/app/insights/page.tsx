'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, Zap, Info, ChevronRight, ThumbsUp } from 'lucide-react';
import { AppOverview, useAppOverview } from '@/lib/app-data';

interface Insight {
  id: number;
  title: string;
  description: string;
  type: 'ai' | 'warning' | 'opportunity' | 'info';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

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

function buildInsights(data: AppOverview): Insight[] {
  const summary = data.ai.summary || {};
  const insights: Insight[] = [];

  if (data.ai.portfolioAssistant?.headline) {
    insights.push({
      id: 1,
      title: 'AI Portfolio Outlook',
      description: data.ai.portfolioAssistant.headline,
      type: 'ai',
      impact:
        data.ai.portfolioAssistant.outlook === 'cautious'
          ? 'high'
          : data.ai.portfolioAssistant.outlook === 'strong'
            ? 'medium'
            : 'low',
      actionable: true,
    });
  }

  (data.ai.insights || []).forEach((message, index) => {
    const lower = message.toLowerCase();
    const type: Insight['type'] = lower.includes('risk') || lower.includes('behind')
      ? 'warning'
      : lower.includes('save') || lower.includes('spending')
        ? 'opportunity'
        : 'ai';
    const impact: Insight['impact'] =
      lower.includes('risk') || lower.includes('behind') ? 'high' : 'medium';

    insights.push({
      id: insights.length + index + 2,
      title:
        type === 'warning'
          ? 'AI Risk Alert'
          : type === 'opportunity'
            ? 'AI Opportunity'
            : 'AI Recommendation',
      description: message,
      type,
      impact,
      actionable: true,
    });
  });

  (data.ai.recommendations || []).forEach((message, index) => {
    insights.push({
      id: insights.length + index + 20,
      title: 'Recommended Next Step',
      description: message,
      type: 'opportunity',
      impact: 'medium',
      actionable: true,
    });
  });

  if (summary.spendingAnalysis) {
    insights.push({
      id: 200,
      title: 'Spending Analysis',
      description: summary.spendingAnalysis,
      type: 'info',
      impact: 'low',
      actionable: false,
    });
  }

  if (summary.financialHealthScore !== undefined) {
    insights.push({
      id: 201,
      title: 'Financial Health Score',
      description: `Your current AI-calculated financial health score is ${summary.financialHealthScore}/100.`,
      type: 'ai',
      impact: summary.financialHealthScore < 50 ? 'high' : 'medium',
      actionable: false,
    });
  }

  return insights.slice(0, 6);
}

export default function InsightsPage() {
  const { data, loading, error } = useAppOverview();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Generating AI insights...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load AI insights.'}</div>
      </MainLayout>
    );
  }

  const insightsData = buildInsights(data);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Insights</h1>
          <p className="text-muted-foreground">
            Personalized recommendations powered by your financial and cyber signals
          </p>
        </div>

        <div className="space-y-4">
          {insightsData.map((insight) => (
            <Card
              key={insight.id}
              className="p-6 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{iconMap[insight.type]}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{insight.title}</h3>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        impactColors[insight.impact]
                      }`}
                    >
                      {insight.impact} Impact
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4">{insight.description}</p>

                  {insight.actionable && (
                    <Button variant="outline" size="sm" className="gap-2">
                      Take Action
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Was this helpful?</h3>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve future AI recommendations
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
