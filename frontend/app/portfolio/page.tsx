'use client';

import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { useUser } from '@/lib/user-context';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';

const portfolioData = [
  { month: 'Jan', value: 850000 },
  { month: 'Feb', value: 920000 },
  { month: 'Mar', value: 880000 },
  { month: 'Apr', value: 1050000 },
  { month: 'May', value: 1120000 },
  { month: 'Jun', value: 1250000 },
];

const assetAllocation = [
  { name: 'Stocks', value: 45, color: '#c65d3d' },
  { name: 'Bonds', value: 25, color: '#d4a017' },
  { name: 'Real Estate', value: 20, color: '#4a9d6f' },
  { name: 'Cash', value: 10, color: '#9ca3af' },
];

const holdings = [
  {
    id: 1,
    name: 'Technology Index Fund',
    ticker: 'TECH',
    amount: 320000,
    return: 12.5,
    percentage: 22,
  },
  {
    id: 2,
    name: 'US Treasury Bonds',
    ticker: 'BONDS',
    amount: 180000,
    return: 4.2,
    percentage: 12,
  },
  {
    id: 3,
    name: 'Real Estate Investment Trust',
    ticker: 'REIT',
    amount: 250000,
    return: 8.3,
    percentage: 17,
  },
  {
    id: 4,
    name: 'International Stocks',
    ticker: 'INTL',
    amount: 280000,
    return: -2.1,
    percentage: 19,
  },
  {
    id: 5,
    name: 'Dividend Portfolio',
    ticker: 'DIV',
    amount: 140000,
    return: 6.7,
    percentage: 9,
  },
  {
    id: 6,
    name: 'Money Market Fund',
    ticker: 'MMF',
    amount: 105000,
    return: 5.1,
    percentage: 7,
  },
];

export default function PortfolioPage() {
  const { user } = useUser();

  const totalReturn = holdings.reduce((sum, h) => sum + h.amount, 0);
  const avgReturn = (holdings.reduce((sum, h) => sum + h.return * h.percentage, 0) / 100).toFixed(2);

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Portfolio</h1>
          <p className="text-muted-foreground">Manage and track your investment holdings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Portfolio Value"
            value={`$${user?.netWorth.toLocaleString()}`}
            change={`+${avgReturn}% this month`}
            isPositive={true}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <DashboardCard
            title="Total Holdings"
            value={holdings.length.toString()}
            change="Across 6 assets"
            isPositive={true}
            icon={<Zap className="h-5 w-5" />}
          />
          <DashboardCard
            title="Best Performer"
            value="Tech Index"
            change="+12.5% YTD"
            isPositive={true}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <DashboardCard
            title="Cash Available"
            value="$105,000"
            change="Ready to invest"
            isPositive={true}
            icon={<Zap className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Portfolio Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
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
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Asset Allocation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Holdings</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/10 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Asset</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Return</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <tr key={holding.id} className="border-b border-border hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{holding.name}</p>
                        <p className="text-sm text-muted-foreground">{holding.ticker}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">
                      ${holding.amount.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${holding.return >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {holding.return >= 0 ? '+' : ''}{holding.return}%
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">{holding.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
