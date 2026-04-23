'use client';

import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
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
import { AppTransaction, useAppOverview, useFormattedCurrency } from '@/lib/app-data';

const ALLOCATION_COLORS = ['#c65d3d', '#d4a017', '#4a9d6f', '#8b7d78'];

interface PortfolioPosition {
  id: string;
  name: string;
  ticker: string;
  amount: number;
  percentage: number;
  return: number | null;
  sourceType: AppTransaction['type'];
}

const POSITION_META: Record<AppTransaction['type'], { name: string; ticker: string }> = {
  invest: { name: 'Direct Investments', ticker: 'INV' },
  sip: { name: 'SIP Contributions', ticker: 'SIP' },
  transfer: { name: 'Cash Transfers', ticker: 'TRF' },
  rebalance: { name: 'Rebalanced Funds', ticker: 'RBL' },
};

function formatShare(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatChange(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function buildPositions(transactions: AppTransaction[]): PortfolioPosition[] {
  const activeTransactions = transactions.filter(
    (tx) => tx.status === 'completed' || tx.status === 'warning'
  );

  const totalActiveAmount = activeTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const grouped = activeTransactions.reduce<Record<string, PortfolioPosition>>((acc, tx) => {
    const metadata = tx.metadata || {};
    const metadataName =
      typeof metadata.assetName === 'string'
        ? metadata.assetName
        : typeof metadata.name === 'string'
          ? metadata.name
          : undefined;
    const metadataTicker =
      typeof metadata.symbol === 'string'
        ? metadata.symbol
        : typeof metadata.ticker === 'string'
          ? metadata.ticker
          : undefined;
    const meta = POSITION_META[tx.type];
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
        return: typeof metadata.return === 'number' ? metadata.return : null,
        sourceType: tx.type,
      };
    }

    acc[key].amount += tx.amount || 0;
    return acc;
  }, {});

  return Object.values(grouped)
    .map((position) => ({
      ...position,
      percentage: totalActiveAmount > 0 ? (position.amount / totalActiveAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export default function PortfolioPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading portfolio...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8 space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Portfolio unavailable</h1>
          <p className="text-muted-foreground">{error || 'We could not load your portfolio.'}</p>
        </div>
      </MainLayout>
    );
  }

  const portfolioValue = data.dashboard.portfolio.totalValue;
  const portfolioChange = data.dashboard.portfolio.changePercent;
  const growthData = data.dashboard.investmentGrowth;
  const assetAllocation = data.dashboard.assetAllocation.map((item, index) => ({
    ...item,
    color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],
  }));
  const cashAllocation =
    assetAllocation.find((item) => item.name.toLowerCase() === 'cash')?.value || 0;
  const estimatedReturns = data.ai.portfolioAssistant?.estimatedReturns || {};
  const positions = buildPositions(data.transactions);
  const normalizedPositions = positions.map((position) => ({
    ...position,
    return:
      position.return ??
      estimatedReturns[position.sourceType] ??
      data.ai.portfolioAssistant?.estimatedMonthlyReturn ??
      portfolioChange,
  }));
  const avgReturn =
    normalizedPositions.length > 0
      ? normalizedPositions.reduce(
          (sum, position) => sum + ((position.return ?? 0) * position.percentage) / 100,
          0
        )
      : data.ai.portfolioAssistant?.estimatedMonthlyReturn ?? portfolioChange;
  const bestPerformer =
    normalizedPositions.length > 0
      ? [...normalizedPositions].sort((a, b) => (b.return ?? 0) - (a.return ?? 0))[0]
      : null;
  const bestPerformerLabel =
    bestPerformer?.name || data.ai.portfolioAssistant?.bestPerformerLabel || 'N/A';
  const bestPerformerReturn =
    bestPerformer?.return ?? data.ai.portfolioAssistant?.bestPerformerReturn ?? portfolioChange;

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Live holdings, AI performance estimates, and database-backed allocation
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
            value={String(normalizedPositions.length)}
            description={`Across ${normalizedPositions.length} assets`}
            icon={<Zap className="h-5 w-5" />}
          />
          <DashboardCard
            title="Best Performer"
            value={bestPerformerLabel}
            change={bestPerformerReturn}
            changeLabel="AI-adjusted"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={bestPerformerReturn >= 0 ? 'up' : 'down'}
          />
          <DashboardCard
            title="Cash Available"
            value={formatCurrency(cashAllocation)}
            description={data.ai.portfolioAssistant?.cashMessage || 'Ready to deploy'}
            icon={<Zap className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Portfolio Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Asset Allocation</h2>
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
                >
                  {assetAllocation.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3 mt-4">
              {assetAllocation.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(item.value)}</p>
                    <p className="text-muted-foreground">{item.percentage || 0}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Holdings</h2>
          </div>

          <div className="overflow-x-auto">
            {normalizedPositions.length > 0 ? (
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
                        <p className="text-sm text-muted-foreground">{position.ticker}</p>
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
              <div className="p-8 text-muted-foreground text-center">No holdings available yet.</div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
