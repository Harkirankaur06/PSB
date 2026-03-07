'use client';

import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { GoalProgress } from '@/components/goal-progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardData } from '@/lib/mock-data';
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
import {
  TrendingUp,
  Wallet,
  Target,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

const COLORS = ['#c65d3d', '#d4a017', '#6b5d52', '#8b7d78'];

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, John
          </h1>
          <p className="text-muted-foreground">
            Your financial overview and key insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Portfolio Value"
            value={dashboardData.portfolio.totalValue}
            change={dashboardData.portfolio.changePercent}
            changeLabel="This month"
            trend="up"
            icon={<Wallet className="h-5 w-5" />}
          />
          <DashboardCard
            title="Monthly Income"
            value={5900}
            description="From investments"
          />
          <DashboardCard
            title="Savings Rate"
            value="32%"
            description="Of monthly income"
          />
          <DashboardCard
            title="Active Goals"
            value={dashboardData.goals.length}
            description="Tracking progress"
            icon={<Target className="h-5 w-5" />}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Income vs Expenses
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.incomeVsExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="income" fill="var(--chart-1)" />
                <Bar dataKey="expenses" fill="var(--chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Asset Allocation */}
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
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Investment Growth */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Portfolio Growth
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.investmentGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `$${value.toLocaleString()}`}
                />
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

          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Year to Date
                  </p>
                  <p className="text-2xl font-bold text-foreground">+2.8%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Avg Monthly Return
                </p>
                <p className="text-2xl font-bold text-foreground">0.47%</p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Volatility
                </p>
                <p className="text-2xl font-bold text-foreground">12.3%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Goals Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Your Goals
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
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

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transactions */}
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
                    <p className="font-medium text-foreground">
                      {tx.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.amount > 0
                        ? 'text-success'
                        : 'text-foreground'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                AI Insights
              </h2>
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {dashboardData.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-muted/50 border border-border"
                >
                  <p className="font-medium text-foreground text-sm">
                    {insight.title}
                  </p>
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
