'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { useUser } from '@/lib/user-context';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://psb-backend.onrender.com';

const ALLOCATION_COLORS = ['#c65d3d', '#d4a017', '#4a9d6f', '#8b7d78'];

interface DashboardResponse {
  portfolio?: {
    totalValue?: number;
    changePercent?: number;
    changeAmount?: number;
  };
  assetAllocation?: Array<{
    name: string;
    value: number;
    percentage?: number;
  }>;
  investmentGrowth?: Array<{
    month: string;
    value: number;
  }>;
}

interface AIInsightsResponse {
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
    estimatedReturns?: Partial<Record<Transaction['type'], number>>;
  };
}

interface Transaction {
  _id: string;
  type: 'transfer' | 'sip' | 'invest' | 'rebalance';
  amount: number;
  status: 'pending' | 'completed' | 'blocked' | 'warning';
  createdAt: string;
  metadata?: {
    assetName?: string;
    name?: string;
    symbol?: string;
    ticker?: string;
    return?: number;
  };
}

interface PortfolioPosition {
  id: string;
  name: string;
  ticker: string;
  amount: number;
  percentage: number;
  return: number | null;
  sourceType: Transaction['type'];
}

const POSITION_META: Record<Transaction['type'], { name: string; ticker: string }> = {
  invest: { name: 'Direct Investments', ticker: 'INV' },
  sip: { name: 'SIP Contributions', ticker: 'SIP' },
  transfer: { name: 'Cash Transfers', ticker: 'TRF' },
  rebalance: { name: 'Rebalanced Funds', ticker: 'RBL' },
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatShare(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatChange(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function buildPositions(transactions: Transaction[]): PortfolioPosition[] {
  const activeTransactions = transactions.filter(
    (tx) => tx.status === 'completed' || tx.status === 'warning'
  );

  const totalActiveAmount = activeTransactions.reduce(
    (sum, tx) => sum + (tx.amount || 0),
    0
  );

  const grouped = activeTransactions.reduce<Record<string, PortfolioPosition>>(
    (acc, tx) => {
      const metadataName = tx.metadata?.assetName || tx.metadata?.name;
      const metadataTicker = tx.metadata?.symbol || tx.metadata?.ticker;
      const meta = POSITION_META[tx.type] ?? {
        name: tx.type,
        ticker: tx.type.slice(0, 3).toUpperCase(),
      };
      const name = metadataName || meta.name;
      const ticker = metadataTicker || meta.ticker;
      const key = `${name}-${ticker}`;

      if (!acc[key]) {
        acc[key] = {
          id: key,
          name,
          ticker,
          amount: 0,
          percentage: 0,
          return: tx.metadata?.return ?? null,
          sourceType: tx.type,
        };
      }

      acc[key].amount += tx.amount || 0;

      if (tx.metadata?.return !== undefined && tx.metadata?.return !== null) {
        const currentReturn = acc[key].return ?? 0;
        acc[key].return =
          currentReturn === 0 && acc[key].amount === (tx.amount || 0)
            ? tx.metadata.return
            : Number(((currentReturn + tx.metadata.return) / 2).toFixed(2));
      }

      return acc;
    },
    {}
  );

  return Object.values(grouped)
    .map((position) => ({
      ...position,
      percentage:
        totalActiveAmount > 0 ? (position.amount / totalActiveAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export default function PortfolioPage() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null);
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [dashboardRes, transactionRes, aiRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/dashboard`, { headers }),
          fetch(`${API_BASE_URL}/api/transaction/history`, { headers }),
          fetch(`${API_BASE_URL}/api/ai/insights`, { headers }),
        ]);

        if (!dashboardRes.ok || !transactionRes.ok || !aiRes.ok) {
          throw new Error('Unable to load portfolio data from the server.');
        }

        const dashboardData: DashboardResponse = await dashboardRes.json();
        const transactionData: Transaction[] = await transactionRes.json();
        const aiData: AIInsightsResponse = await aiRes.json();

        setDashboard(dashboardData);
        setAiInsights(aiData);
        setPositions(buildPositions(transactionData));
      } catch (err) {
        console.error('Portfolio fetch failed', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Something went wrong while loading your portfolio.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading portfolio...</div>
      </MainLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <MainLayout>
        <div className="p-8 space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Portfolio unavailable
          </h1>
          <p className="text-muted-foreground">
            {error || 'We could not load your portfolio data right now.'}
          </p>
        </div>
      </MainLayout>
    );
  }

  const portfolioValue = dashboard.portfolio?.totalValue || user?.netWorth || 0;
  const portfolioChange = dashboard.portfolio?.changePercent || 0;
  const growthData = dashboard.investmentGrowth || [];
  const assetAllocation =
    dashboard.assetAllocation?.map((item, index) => ({
      ...item,
      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
    })) || [];
  const cashAllocation =
    assetAllocation.find((item) => item.name.toLowerCase() === 'cash')?.value || 0;
  const estimatedReturns = aiInsights?.portfolioAssistant?.estimatedReturns || {};
  const normalizedPositions = positions.map((position) => ({
    ...position,
    return:
      position.return ??
      estimatedReturns[position.sourceType] ??
      aiInsights?.portfolioAssistant?.estimatedMonthlyReturn ??
      portfolioChange,
  }));
  const avgReturn =
    normalizedPositions.length > 0
      ? normalizedPositions.reduce((sum, position) => {
          const weightedReturn = (position.return ?? 0) * position.percentage;
          return sum + weightedReturn;
        }, 0) / 100
      : aiInsights?.portfolioAssistant?.estimatedMonthlyReturn ?? portfolioChange;
  const bestPerformer =
    normalizedPositions.length > 0
      ? [...normalizedPositions]
          .filter((position) => position.return !== null)
          .sort((a, b) => (b.return ?? 0) - (a.return ?? 0))[0]
      : null;
  const totalHoldings = normalizedPositions.length;
  const bestPerformerLabel =
    bestPerformer?.name ||
    aiInsights?.portfolioAssistant?.bestPerformerLabel ||
    'N/A';
  const bestPerformerReturn =
    bestPerformer?.return ??
    aiInsights?.portfolioAssistant?.bestPerformerReturn ??
    portfolioChange;
  const cashMessage =
    aiInsights?.portfolioAssistant?.cashMessage || 'Ready to invest';

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage and track your investment holdings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Portfolio Value"
            value={formatCurrency(portfolioValue)}
            change={avgReturn}
            changeLabel="this month"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={avgReturn >= 0 ? 'up' : 'down'}
          />

          <DashboardCard
            title="Total Holdings"
            value={totalHoldings.toString()}
            description={`Across ${totalHoldings} assets`}
            icon={<Zap className="h-5 w-5" />}
          />

          <DashboardCard
            title="Best Performer"
            value={bestPerformerLabel}
            change={bestPerformerReturn}
            changeLabel="YTD"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={bestPerformerReturn >= 0 ? 'up' : 'down'}
          />

          <DashboardCard
            title="Cash Available"
            value={formatCurrency(cashAllocation)}
            description={cashMessage}
            icon={<Zap className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Portfolio Performance
            </h2>

            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                  <YAxis stroke="var(--color-muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--color-primary)"
                    dot={{ fill: 'var(--color-primary)', r: 5 }}
                    name="Portfolio Value"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No growth data available yet.
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Asset Allocation
            </h2>

            {assetAllocation.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={assetAllocation}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage || 0}%`}
                      outerRadius={80}
                      dataKey="value"
                      fill="#8884d8"
                    >
                      {assetAllocation.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name, item: { payload?: { percentage?: number } }) =>
                        `${item?.payload?.percentage ?? value}%`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3 mt-4">
                  {assetAllocation.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {formatCurrency(item.value)}
                        </p>
                        <p className="text-muted-foreground">
                          {item.percentage || 0}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No allocation data available yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Holdings</h2>
          </div>

          <div className="overflow-x-auto">
            {positions.length > 0 ? (
              <table className="w-full">
                <thead className="bg-secondary/10 border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                      Return
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">
                      % of Portfolio
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {normalizedPositions.map((position) => (
                    <tr
                      key={position.id}
                      className="border-b border-border hover:bg-secondary/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{position.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {position.ticker}
                        </p>
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-foreground">
                        {formatCurrency(position.amount)}
                      </td>

                      <td
                        className={`px-6 py-4 text-right font-medium ${
                          (position.return ?? portfolioChange) >= 0
                            ? 'text-green-500'
                            : 'text-destructive'
                        }`}
                      >
                        {formatChange(position.return ?? avgReturn)}
                      </td>

                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {formatShare(position.percentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-muted-foreground text-center">
                No holdings available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
