'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Landmark,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppOverview, AppTransaction, useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import { getBehaviorSnapshot, getDuressProtectionState } from '@/lib/behavior-monitor';

type RiskLevel = 'low' | 'medium' | 'high';
type Decision = 'allow' | 'step-up' | 'manual-review' | 'block';

interface TwinSignal {
  id: string;
  title: string;
  description: string;
  weight: number;
  active: boolean;
}

function getRiskAppetite(data: AppOverview): { label: string; detail: string } {
  const ratio = data.metrics.investmentRatio;
  const trust = data.profile.trustScore;

  if (ratio >= 50 && trust >= 80) {
    return {
      label: 'Growth-oriented',
      detail: 'The twin sees a strong comfort level with long-term market exposure.',
    };
  }

  if (ratio >= 30) {
    return {
      label: 'Balanced',
      detail: 'The twin is balancing growth intent with stability and liquidity needs.',
    };
  }

  return {
    label: 'Protection-first',
    detail: 'The twin prioritizes stability and stronger checks before unfamiliar actions.',
  };
}

function getPrimaryAction(data: AppOverview) {
  const candidate = data.actions.find(
    (item) => item.status === 'pending' || item.status === 'recommended'
  );

  return (
    candidate ?? {
      id: 'simulated-proposal',
      title: 'Start diversified SIP',
      description: 'Shift idle cash into a diversified SIP aligned to your top goal.',
      status: 'recommended' as const,
      priority: 'medium' as const,
      value: Math.max(Math.round(data.metrics.monthlyBalance * 1.5), 15000),
      actionPath: '/invest',
      reviewType: 'fraud guard',
      reviewMessage: 'New investment type and amount require a lightweight security review.',
    }
  );
}

function buildSignals(
  data: AppOverview,
  actionValue: number,
  actionPath: string,
  anomalyScore: number,
  duressActive: boolean
): TwinSignal[] {
  const warningTransactions = data.transactions.filter(
    (item) => item.status === 'warning' || item.status === 'blocked'
  );
  const reviewFlagCount = data.transactions.reduce(
    (sum, item) => sum + (item.reviewFlags?.length || 0),
    0
  );
  const matchingTransactions = data.transactions.filter((item) => item.type === getActionType(actionPath));
  const highValueThreshold = Math.max(data.financial.income * 0.45, 20000);

  return [
    {
      id: 'device',
      title: 'Device trust check',
      description:
        data.profile.trustScore < 85
          ? 'Trust posture is below preferred threshold, so the twin asks for stronger verification.'
          : 'Trusted device history is healthy, so this signal stays quiet.',
      weight: 18,
      active: data.profile.trustScore < 85,
    },
    {
      id: 'amount',
      title: 'High-value action',
      description:
        actionValue >= highValueThreshold
          ? 'The proposed action is materially larger than the recent monthly comfort band.'
          : 'Action size sits inside the normal monthly range.',
      weight: 22,
      active: actionValue >= highValueThreshold,
    },
    {
      id: 'otp',
      title: 'OTP usage pattern',
      description:
        data.cyber.summary.totalWarned > 0 || reviewFlagCount > 1
          ? 'Recent warnings suggest this action should not pass on OTP alone.'
          : 'No recent OTP-style friction is visible in the activity summary.',
      weight: 14,
      active: data.cyber.summary.totalWarned > 0 || reviewFlagCount > 1,
    },
    {
      id: 'new-action',
      title: 'New action or investment type',
      description:
        matchingTransactions.length === 0
          ? 'The twin has not seen this action pattern before, so it adds moderate caution.'
          : 'This action type already exists in the customer history.',
      weight: 16,
      active: matchingTransactions.length === 0,
    },
    {
      id: 'behaviour',
      title: 'Behaviour consistency check',
      description:
        warningTransactions.length >= 2
          ? 'Repeated warning or correction patterns suggest abnormal behavior during decisioning.'
          : 'Behavior looks consistent with previous wealth actions.',
      weight: 20,
      active: warningTransactions.length >= 2,
    },
    {
      id: 'ui-anomaly',
      title: 'UI-behaviour anomaly tracking',
      description:
        anomalyScore >= 30
          ? 'Rapid retries, corrections, or OTP friction suggest stressed or unusual interaction patterns.'
          : 'Current session telemetry looks calm and consistent.',
      weight: 18,
      active: anomalyScore >= 30,
    },
    {
      id: 'duress',
      title: 'Coercion or duress protection',
      description:
        duressActive
          ? 'Silent review mode is active, so critical actions should be routed to extra review.'
          : 'No duress signal has been raised for this session.',
      weight: 28,
      active: duressActive,
    },
  ];
}

function getActionType(path: string): AppTransaction['type'] {
  if (path.includes('invest')) {
    return 'invest';
  }

  if (path.includes('portfolio')) {
    return 'rebalance';
  }

  if (path.includes('goals')) {
    return 'transfer';
  }

  return 'sip';
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 60) {
    return 'high';
  }

  if (score >= 30) {
    return 'medium';
  }

  return 'low';
}

function getDecision(score: number): {
  value: Decision;
  label: string;
  detail: string;
  icon: typeof ShieldCheck;
  tone: string;
} {
  if (score >= 80) {
    return {
      value: 'block',
      label: 'Block and escalate',
      detail: 'Too many fraud signals overlap. The action should pause and move to a human review path.',
      icon: ShieldX,
      tone: 'text-destructive',
    };
  }

  if (score >= 55) {
    return {
      value: 'manual-review',
      label: 'Manual review',
      detail: 'The twin should hold execution until a bank reviewer or trusted-contact flow confirms intent.',
      icon: CircleAlert,
      tone: 'text-warning',
    };
  }

  if (score >= 30) {
    return {
      value: 'step-up',
      label: 'Step-up verification',
      detail: 'Run biometric or trusted-device verification before the wealth action completes.',
      icon: ShieldCheck,
      tone: 'text-primary',
    };
  }

  return {
    value: 'allow',
    label: 'Allow with monitoring',
    detail: 'The action fits normal behavior, but the twin keeps post-action monitoring active.',
    icon: CheckCircle2,
    tone: 'text-success',
  };
}

function getTwinSummary(data: AppOverview) {
  const savingsRate = data.metrics.savingsRate;
  const goalCount = data.goals.length;
  const marketHeadline = data.market.headline;

  return [
    `Learns from ${goalCount} active goals, recent spending, savings cadence, and investment behavior.`,
    `Tracks income-to-surplus efficiency with a ${savingsRate}% savings rate.`,
    `Adapts recommendations to market context: ${marketHeadline}`,
  ];
}

export default function SecureWealthTwinPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  if (loading) {
    return <div className="p-8">Loading SecureWealth Twin...</div>;
  }

  if (error || !data) {
    return <div className="p-8">{error || 'Unable to load SecureWealth Twin.'}</div>;
  }

  const primaryAction = getPrimaryAction(data);
  const twinSummary = getTwinSummary(data);
  const riskAppetite = getRiskAppetite(data);
  const behaviorSnapshot = getBehaviorSnapshot();
  const duressActive =
    data.cyber.securityStatus.accessMode === 'duress' ||
    data.cyber.securityStatus.restrictedMode ||
    getDuressProtectionState();
  const signals = buildSignals(
    data,
    primaryAction.value,
    primaryAction.actionPath,
    behaviorSnapshot.anomalyScore,
    duressActive
  );
  const score = signals.reduce((sum, signal) => sum + (signal.active ? signal.weight : 0), 0);
  const riskLevel = getRiskLevel(score);
  const decision = getDecision(score);
  const DecisionIcon = decision.icon;
  const activeSignals = signals.filter((signal) => signal.active).length;
  const marketRecommendation = data.market.recommendations[0] || 'Shift idle funds toward safer instruments while volatility remains elevated.';
  const monthlySurplus = Math.max(data.metrics.monthlyBalance, 0);
  const levelTone =
    riskLevel === 'high'
      ? 'text-destructive'
      : riskLevel === 'medium'
        ? 'text-warning'
        : 'text-success';

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/20 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Explicit Hackathon Workflow
            </div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              SecureWealth Twin
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              A virtual financial twin that learns wealth behavior, studies market context,
              and wraps every critical action in a mandatory fraud-protection decision.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="min-w-[140px] border-primary/20 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Twin trust</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{data.profile.trustScore}</p>
            </Card>
            <Card className="min-w-[140px] border-primary/20 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Risk score</p>
              <p className={`mt-2 text-2xl font-bold ${levelTone}`}>{score}/100</p>
            </Card>
            <Card className="min-w-[140px] border-primary/20 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Signals fired</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{activeSignals}</p>
            </Card>
            <Card className="min-w-[140px] border-primary/20 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Decision</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{decision.label}</p>
            </Card>
          </div>
        </div>
      </section>

      {(duressActive || behaviorSnapshot.totalEvents > 0) && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="border-warning/30 bg-warning/5 p-5">
            <p className="text-xs uppercase tracking-wide text-warning">Coercion shield</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {duressActive ? 'Silent review mode is active' : 'No active duress signal'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {duressActive
                ? 'The next sensitive wealth action should pause for extra verification or trusted-contact review.'
                : 'Customers can quietly request silent review from login or verification if they are under pressure.'}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              UI anomaly telemetry
            </p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              Session anomaly score {behaviorSnapshot.anomalyScore}/100
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {behaviorSnapshot.correctionCount} corrections, {behaviorSnapshot.submitFailures}{' '}
              submit failures, {behaviorSnapshot.otpFailures} OTP failures, and{' '}
              {behaviorSnapshot.dialogToggleCount} dialog toggles are feeding the Twin.
            </p>
          </Card>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <UserRoundSearch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Twin profile</h2>
              <p className="text-sm text-muted-foreground">
                What the system learns before it recommends or approves anything
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Wealth behavior
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Monthly surplus {formatCurrency(monthlySurplus)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Income {formatCurrency(data.financial.income)} vs expenses{' '}
                {formatCurrency(data.financial.expenses)} informs how aggressive new actions can be.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Risk appetite
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">{riskAppetite.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{riskAppetite.detail}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {twinSummary.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-border p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Market-aware guidance</h2>
              <p className="text-sm text-muted-foreground">
                The document calls for macro-aware recommendation logic
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-wide text-primary">Current headline</p>
            <p className="mt-2 font-semibold text-foreground">{data.market.headline}</p>
            <p className="mt-2 text-sm text-muted-foreground">{marketRecommendation}</p>
          </div>

          <div className="mt-4 space-y-3">
            {data.market.indicators.slice(0, 3).map((indicator) => (
              <div
                key={indicator.code}
                className="flex items-center justify-between rounded-2xl border border-border p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{indicator.name}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {indicator.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{indicator.value}</p>
                  <p
                    className={`text-sm ${
                      indicator.changePercent >= 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {indicator.changePercent >= 0 ? '+' : ''}
                    {indicator.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Protected action workflow</h2>
              <p className="text-sm text-muted-foreground">
                Recommendation, intent capture, fraud checks, and final decision in one place
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</p>
              <p className="mt-2 font-semibold text-foreground">{primaryAction.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{primaryAction.description}</p>
              <p className="mt-3 text-sm font-medium text-primary">
                Proposed value: {formatCurrency(primaryAction.value)}
              </p>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2</p>
              <p className="mt-2 font-semibold text-foreground">Twin context merge</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Income changes, current goals, transaction history, and market indicators are
                merged before the action proceeds.
              </p>
            </div>

            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 3</p>
              <p className="mt-2 font-semibold text-foreground">Mandatory fraud layer</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Device trust, OTP pattern, first-time activity, behavior consistency, and value
                thresholds feed a single Wealth Protection Risk Score.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs uppercase tracking-wide text-primary">Step 4</p>
              <p className="mt-2 font-semibold text-foreground">{decision.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{decision.detail}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={primaryAction.actionPath}>
                Continue to action
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/verify">Open verification flow</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Risk scoring engine</h2>
              <p className="text-sm text-muted-foreground">
                A simple weighted model, just like the hackathon brief asks for
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Wealth Protection Risk Score
                </p>
                <p className={`mt-2 text-3xl font-bold ${levelTone}`}>{score}/100</p>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-medium ${levelTone}`}>
                {riskLevel.toUpperCase()} RISK
              </div>
            </div>
            <Progress value={score} className="mt-4 h-3" />
            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>Allow</span>
              <span>Step-up</span>
              <span>Review</span>
              <span>Block</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className={`rounded-2xl border p-4 ${
                  signal.active ? 'border-warning/40 bg-warning/5' : 'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{signal.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{signal.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">+{signal.weight}</p>
                    <p className="text-xs text-muted-foreground">
                      {signal.active ? 'active' : 'clear'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Protection decision</h2>
              <p className="text-sm text-muted-foreground">
                The twin converts signals into an outcome the bank can explain
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-5">
            <div className="flex items-start gap-4">
              <DecisionIcon className={`mt-1 h-6 w-6 flex-shrink-0 ${decision.tone}`} />
              <div>
                <p className="text-lg font-semibold text-foreground">{decision.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{decision.detail}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
              <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <p>Critical actions always pass through a security checkpoint before execution.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
              <p>
                The score is explainable, so reviewers can see exactly why an action was slowed or
                blocked.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">How this aligns to the brief</h2>
              <p className="text-sm text-muted-foreground">
                The page makes the hackathon narrative explicit for judges and demos
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Learns from spending, saving, and investment habits',
              'Tracks changes in income, goals, and risk appetite',
              'Uses market and economic cues for guidance',
              'Wraps critical actions with a fraud-protection layer',
              'Simulates OTP, first-time action, and behavior checks',
              'Converts signals into a simple, weighted decision engine',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border p-4">
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
