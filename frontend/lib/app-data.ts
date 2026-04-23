'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api-client';

export interface AppProfile {
  id: string;
  name: string;
  email: string;
  trustScore: number;
  devices: Array<{
    deviceId: string;
    deviceName?: string;
    lastUsed?: string;
    isTrusted?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  progress: number;
  deadline?: string;
  predictedCompletion?: string;
}

export interface AppTransaction {
  id: string;
  type: 'transfer' | 'sip' | 'invest' | 'rebalance';
  amount: number;
  status: 'pending' | 'completed' | 'blocked' | 'warning';
  riskScore: number;
  date: string;
  relativeDate: string;
  description: string;
  metadata?: Record<string, unknown>;
  reviewFlags?: Array<{
    type: string;
    message: string;
  }>;
}

export interface AppContact {
  _id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  permissions: string[];
}

export interface AppOverview {
  profile: AppProfile;
  financial: {
    income: number;
    expenses: number;
    savings: number;
    assets: number;
    investments: number;
  };
  metrics: {
    netWorth: number;
    monthlyBalance: number;
    savingsRate: number;
    investmentRatio: number;
    healthScore: number;
  };
  goals: AppGoal[];
  transactions: AppTransaction[];
  dashboard: {
    portfolio: {
      totalValue: number;
      previousValue: number;
      changeAmount: number;
      changePercent: number;
    };
    incomeVsExpenses: Array<{ month: string; income: number; expenses: number }>;
    assetAllocation: Array<{ name: string; value: number; percentage: number }>;
    investmentGrowth: Array<{ month: string; value: number }>;
    goals: AppGoal[];
    recentTransactions: AppTransaction[];
    insights: Array<{ id: string; title: string; description: string }>;
    trustScore: {
      score: number;
      level: string;
      protectionScore: number;
    };
  };
  ai: {
    insights?: string[];
    recommendations?: string[];
    summary?: {
      savingsRate?: number;
      totalGoals?: number;
      riskyTransactions?: number;
      financialHealthScore?: number;
      spendingAnalysis?: string;
    };
    portfolioAssistant?: {
      outlook?: 'strong' | 'steady' | 'cautious';
      headline?: string;
      bestPerformerLabel?: string;
      bestPerformerReturn?: number;
      estimatedMonthlyReturn?: number;
      cashMessage?: string;
      estimatedReturns?: Partial<Record<AppTransaction['type'], number>>;
    };
  };
  market: {
    source: string;
    headline: string;
    indicators: Array<{
      code: string;
      name: string;
      value: number;
      changePercent: number;
      trend: 'up' | 'down' | 'flat';
      category: string;
    }>;
    recommendations: string[];
  };
  cyber: {
    protectionScore: number;
    trustScore: number;
    summary: {
      totalBlocked: number;
      totalWarned: number;
      totalAllowed: number;
    };
    recentAlerts?: unknown[];
    securityStatus: {
      hasPin: boolean;
      hasBiometric: boolean;
      biometricEnabled: boolean;
      hasWebAuthnCredentials: boolean;
      secondFactorVerified: boolean;
      needsSetup: boolean;
      requiresVerification: boolean;
      accessMode?: 'normal' | 'duress';
      restrictedMode?: boolean;
      fakeDashboardMode?: boolean;
      delayedActions?: boolean;
      hasDuressPassword?: boolean;
    };
  };
  transactionIntelligence: {
    feed: Array<{
      id: string;
      title: string;
      subtitle: string;
      amount: number;
      status: 'pending' | 'completed' | 'blocked' | 'warning';
      riskScore: number;
      category: string;
      anomalyFlag: boolean;
      anomalyReason: string;
    }>;
    insights: string[];
    behaviorPatterns: Array<{
      id: string;
      title: string;
      value: string;
      description: string;
    }>;
    fraudDemo: {
      title: string;
      amount: number;
      timeLabel: string;
      newDevice: boolean;
      highRisk: boolean;
      riskScore: number;
      outcome: string;
      explanation: string;
    };
  };
  contacts: AppContact[];
  actions: Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'recommended' | 'scheduled' | 'completed';
    priority: 'high' | 'medium' | 'low';
    value: number;
    actionPath: string;
    reviewType?: string;
    reviewMessage?: string;
  }>;
  protection: Array<{
    id: string;
    name: string;
    status: 'active' | 'pending' | 'inactive';
    coverage: number;
    premium: number;
    renewalDate: string;
    source: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    expectedReturn: number;
    riskLevel: 'low' | 'moderate' | 'high';
    minimumInvestment: number;
    fundSize: number;
    fundRaised: number;
    investorCount: number;
    featured?: boolean;
    source: string;
  }>;
}

export interface AppSecurityFeed {
  status: AppOverview['cyber']['securityStatus'];
  cyber: {
    protectionScore: number;
    trustScore: number;
    summary: {
      totalBlocked: number;
      totalWarned: number;
      totalAllowed: number;
    };
  };
  timeline: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    icon: string;
    type: string;
  }>;
}

export interface HeaderData {
  profile: {
    id: string;
    name: string;
    email: string;
    trustScore: number;
    devices: Array<{
      deviceId: string;
      deviceName?: string;
      lastUsed?: string;
      isTrusted?: boolean;
    }>;
    balance: number;
    netWorth: number;
    securityStatus: {
      hasPin: boolean;
      hasBiometric: boolean;
      biometricEnabled: boolean;
      hasWebAuthnCredentials: boolean;
      secondFactorVerified: boolean;
      needsSetup: boolean;
      requiresVerification: boolean;
      accessMode?: 'normal' | 'duress';
      restrictedMode?: boolean;
      fakeDashboardMode?: boolean;
      delayedActions?: boolean;
      hasDuressPassword?: boolean;
    };
  };
  notifications: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    read: boolean;
    type: string;
  }>;
}

export function useAppOverview() {
  const [data, setData] = useState<AppOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      try {
        const response = await apiRequest<AppOverview>('/api/app/overview');

        if (!active) {
          return;
        }

        setData(response);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load app data.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    const handleRefresh = () => {
      if (active) {
        setLoading(true);
        loadOverview();
      }
    };

    window.addEventListener('legend-security-refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('legend-security-refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  return { data, loading, error, setData };
}

export function useSecurityFeed(enabled = true) {
  const [data, setData] = useState<AppSecurityFeed | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    async function loadFeed() {
      try {
        const response = await apiRequest<AppSecurityFeed>('/api/app/security-feed');

        if (!active) {
          return;
        }

        setData(response);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load security feed.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    const handleRefresh = () => {
      if (active) {
        setLoading(true);
        loadFeed();
      }
    };

    window.addEventListener('legend-security-refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('legend-security-refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [enabled]);

  return { data, loading, error };
}

export function useHeaderData(enabled = true) {
  const [data, setData] = useState<HeaderData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    async function loadHeaderData() {
      try {
        const response = await apiRequest<HeaderData>('/api/app/header');

        if (!active) {
          return;
        }

        setData(response);
        setError(null);
      } catch (err) {
        if (!active) {
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load header data.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHeaderData();

    const handleRefresh = () => {
      if (active) {
        setLoading(true);
        loadHeaderData();
      }
    };

    window.addEventListener('legend-security-refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      active = false;
      window.removeEventListener('legend-security-refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, [enabled]);

  return { data, loading, error, setData };
}

export function useFormattedCurrency() {
  return useMemo(
    () => (value: number) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(value || 0),
    []
  );
}
