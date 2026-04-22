'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { GoalProgress } from '@/components/goal-progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchDashboard = async () => {
      try {

        const token = localStorage.getItem("accessToken");

        const res = await fetch(
          "https://psb-backend.onrender.com/api/risk/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const text = await res.text();
        console.log(text);

        const data = JSON.parse(text);  
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }

      setLoading(false);
    };

    fetchDashboard();

  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading dashboard...</div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="p-8">Failed to load dashboard</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Your financial overview and key insights
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Total Portfolio Value"
            value={dashboardData.portfolio?.totalValue}
            change={dashboardData.portfolio?.changePercent}
            changeLabel="This month"
            trend="up"
            icon={<Wallet className="h-5 w-5" />}
          />

          <DashboardCard
            title="Monthly Income"
            value={dashboardData.monthlyIncome}
            description="From investments"
          />

          <DashboardCard
            title="Savings Rate"
            value={`${dashboardData.savingsRate}%`}
            description="Of monthly income"
          />

          <DashboardCard
            title="Active Goals"
            value={dashboardData.goals?.length}
            description="Tracking progress"
            icon={<Target className="h-5 w-5" />}
          />
        </div>

        {/* Income vs Expenses */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Income vs Expenses
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="var(--chart-1)" />
              <Bar dataKey="expenses" fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Asset Allocation */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Asset Allocation
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.assetAllocation}
                dataKey="value"
                outerRadius={80}
                label={({ name, percentage }) =>
                  `${name} ${percentage}%`
                }
              >
                {dashboardData.assetAllocation?.map((entry:any, index:number) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.goals?.map((goal:any) => (
            <GoalProgress
              key={goal.id}
              name={goal.name}
              current={goal.current}
              target={goal.target}
              progress={goal.progress}
            />
          ))}
        </div>

        {/* Transactions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">
            Recent Transactions
          </h2>

          <div className="space-y-3">
            {dashboardData.recentTransactions?.map((tx:any) => (
              <div
                key={tx.id}
                className="flex justify-between p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.date}
                  </p>
                </div>

                <span className="font-semibold">
                  ${Math.abs(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </MainLayout>
  );
}