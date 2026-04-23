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

    return () => {
      active = false;
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

    return () => {
      active = false;
    };
  }, [enabled]);

  return { data, loading, error };
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
