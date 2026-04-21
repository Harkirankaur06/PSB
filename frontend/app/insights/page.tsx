'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Brain,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  ThumbsUp,
} from 'lucide-react';

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

export default function InsightsPage() {

  const [insightsData, setInsightsData] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchInsights = async () => {

      try {

        const token = localStorage.getItem("accessToken");

        const dashboardRes = await fetch(
          "http://localhost:5000/api/risk/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const transactionRes = await fetch(
          "http://localhost:5000/api/transaction/history",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const financialRes = await fetch(
          "http://localhost:5000/api/financial",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const dashboard = await dashboardRes.json();
        const transactions = await transactionRes.json();
        const financial = await financialRes.json();

        const insights: Insight[] = [];

        if (dashboard?.portfolio?.changePercent < 0) {
          insights.push({
            id: 1,
            title: "Portfolio Performance Alert",
            description: "Your portfolio dropped recently. Consider rebalancing your asset allocation.",
            type: "warning",
            impact: "high",
            actionable: true
          });
        }

        if (financial?.savings < financial?.income * 0.2) {
          insights.push({
            id: 2,
            title: "Savings Opportunity",
            description: "Your savings rate is below recommended levels. Increasing savings by 5% could improve long-term growth.",
            type: "opportunity",
            impact: "medium",
            actionable: true
          });
        }

        if (transactions?.length === 0) {
          insights.push({
            id: 3,
            title: "Investment Recommendation",
            description: "You have no active investments. Consider diversifying your assets to grow your wealth.",
            type: "ai",
            impact: "high",
            actionable: true
          });
        }

        insights.push({
          id: 4,
          title: "Market Update",
          description: "Technology sector has outperformed the market this quarter.",
          type: "info",
          impact: "low",
          actionable: false
        });

        setInsightsData(insights);

      } catch (err) {
        console.error("Insights fetch failed", err);
      }

      setLoading(false);

    };

    fetchInsights();

  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Generating AI insights...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="space-y-8">

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Personalized recommendations powered by advanced AI
          </p>
        </div>

        {/* Insights */}

        <div className="space-y-4">

          {insightsData.map((insight) => (

            <Card
              key={insight.id}
              className="p-6 hover:border-primary/50 transition-colors cursor-pointer"
            >

              <div className="flex items-start gap-4">

                <div className="flex-shrink-0 mt-1">
                  {iconMap[insight.type]}
                </div>

                <div className="flex-1">

                  <div className="flex items-start justify-between gap-4 mb-2">

                    <h3 className="text-lg font-semibold text-foreground">
                      {insight.title}
                    </h3>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        impactColors[insight.impact]
                      }`}
                    >
                      {insight.impact} Impact
                    </div>

                  </div>

                  <p className="text-muted-foreground mb-4">
                    {insight.description}
                  </p>

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

        {/* Feedback */}

        <Card className="p-6 bg-muted/50">

          <div className="flex items-center justify-between">

            <div>

              <h3 className="font-semibold text-foreground mb-1">
                Was this helpful?
              </h3>

              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve AI recommendations
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