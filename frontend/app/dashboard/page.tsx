'use client';

import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { GoalProgress } from '@/components/goal-progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Wallet, Target, AlertCircle, ArrowRight } from 'lucide-react';

const COLORS = ['#c65d3d', '#d4a017', '#6b5d52', '#8b7d78'];

export default function DashboardPage() {
  const { data, loading, error } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading dashboard...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Failed to load dashboard.'}</div>
      </MainLayout>
    );
  }

  const dashboardData = data.dashboard;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {data.profile.name}!
          </h1>
          <p className="text-muted-foreground">
            Your financial overview, AI guidance, and cyber protection in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Portfolio Value"
            value={formatCurrency(dashboardData.portfolio.totalValue)}
            change={dashboardData.portfolio.changePercent}
            changeLabel="This cycle"
            trend="up"
            icon={<Wallet className="h-5 w-5" />}
          />
          <DashboardCard
            title="Monthly Income"
            value={formatCurrency(data.financial.income)}
            description="Pulled from your financial profile"
          />
          <DashboardCard
            title="Savings Rate"
            value={`${data.metrics.savingsRate}%`}
            description="Live from your database"
          />
          <DashboardCard
            title="Active Goals"
            value={String(data.goals.length)}
            description={`Cyber protection score ${data.cyber.protectionScore}`}
            icon={<Target className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Income vs Expenses
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" fill="var(--chart-1)" />
                <Bar dataKey="expenses" fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Asset Allocation
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {dashboardData.assetAllocation.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Portfolio Growth
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.investmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  dot={{ fill: 'var(--chart-1)' }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Net Worth
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(data.metrics.netWorth)}
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Monthly Balance
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(data.metrics.monthlyBalance)}
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Protection Score
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {data.cyber.protectionScore}/100
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Goals</h2>
            <Button variant="outline" size="sm" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboardData.goals.map((goal) => (
              <GoalProgress
                key={goal.id}
                name={goal.name}
                current={goal.current}
                target={goal.target}
                progress={goal.progress}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Transactions
              </h2>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {dashboardData.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.relativeDate}</p>
                    {tx.reviewFlags?.map((flag) => (
                      <p key={flag.type} className="text-xs text-warning mt-1">
                        {flag.message}
                      </p>
                    ))}
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">AI Insights</h2>
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {dashboardData.insights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <p className="font-medium text-foreground text-sm">{insight.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
