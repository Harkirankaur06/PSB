'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Brain,
  AlertTriangle,
  Zap,
  Info,
  ChevronRight,
  ThumbsUp,
  MessageSquare,
  Send,
} from 'lucide-react';
import { AppOverview, useAppOverview } from '@/lib/app-data';
import { apiRequest } from '@/lib/api-client';

interface Insight {
  id: number;
  title: string;
  description: string;
  type: 'ai' | 'warning' | 'opportunity' | 'info';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  navigationTarget?: string | null;
  navigationLabel?: string | null;
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
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask about your savings rate, spending, goals, or portfolio posture and I will answer from your current account context.',
    },
  ]);

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

  const handleSendChat = async () => {
    const trimmed = chatInput.trim();

    if (!trimmed) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, content: trimmed }];
    setMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError('');

    try {
      const response = await apiRequest<{
        provider: 'openai' | 'gemini' | 'scope-guard';
        model: string;
        reply: string;
        navigationTarget?: string | null;
        navigationLabel?: string | null;
      }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.reply,
          navigationTarget: response.navigationTarget,
          navigationLabel: response.navigationLabel,
        },
      ]);
      setChatError('');
    } catch (err) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to get a response from the AI assistant.'
      );
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Insights</h1>
          <p className="text-muted-foreground">
            Personalized recommendations powered by your financial and cyber signals
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="lg:w-72">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Insights Chat</h2>
                  <p className="text-sm text-muted-foreground">
                    Chat with your financial copilot using OpenAI or Gemini.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Provider
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={provider === 'openai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('openai')}
                  >
                    OpenAI
                  </Button>
                  <Button
                    variant={provider === 'gemini' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('gemini')}
                  >
                    Gemini
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The backend is scoped to your own account only, and it can also guide you to the right page in this website.
                </p>
                <div className="rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                  Try: "How is my savings rate?", "Which page should I use to update my goals?", or "Where do I check my security alerts?"
                </div>
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-border bg-muted/20 p-4">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-2xl p-4 text-sm ${
                      message.role === 'assistant'
                        ? 'bg-background border border-border text-foreground'
                        : 'ml-auto max-w-[90%] bg-primary text-primary-foreground'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.navigationTarget && (
                      <div className="mt-3">
                        <Button
                          asChild
                          size="sm"
                          variant={message.role === 'assistant' ? 'outline' : 'secondary'}
                        >
                          <Link href={message.navigationTarget}>
                            {message.navigationLabel || 'Open page'}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
                    Thinking...
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about savings, goals, spending, risk, or next steps"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSendChat();
                    }
                  }}
                />
                <Button onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
                  Send
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {chatError && <p className="mt-3 text-sm text-destructive">{chatError}</p>}
            </div>
          </div>
        </Card>

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
