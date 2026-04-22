'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { DashboardCard } from '@/components/dashboard-card';
import { useUser } from '@/lib/user-context';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Zap } from 'lucide-react';

export default function PortfolioPage() {

  const { user } = useUser();

  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [assetAllocation, setAssetAllocation] = useState<any[]>([]);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchPortfolio = async () => {

      try {

        const token = localStorage.getItem("accessToken");

        const dashboardRes = await fetch(
          "http://https://psb-backend.onrender.com/api/risk/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const transactionRes = await fetch(
          "http://https://psb-backend.onrender.com/api/transaction/history",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const dashboard = await dashboardRes.json();
        const transactions = await transactionRes.json();

        setPortfolioData(dashboard.performance || []);

        setAssetAllocation(
          dashboard.assetAllocation || [
            { name: 'Stocks', value: 45, color: '#c65d3d' },
            { name: 'Bonds', value: 25, color: '#d4a017' },
            { name: 'Real Estate', value: 20, color: '#4a9d6f' },
            { name: 'Cash', value: 10, color: '#9ca3af' },
          ]
        );

        const formattedHoldings = transactions.map((tx:any, index:number) => ({
          id: index + 1,
          name: tx.asset || "Investment",
          ticker: tx.symbol || "INV",
          amount: tx.amount,
          return: tx.return || 0,
          percentage: tx.percentage || 0
        }));

        setHoldings(formattedHoldings);

      } catch (err) {
        console.error("Portfolio fetch failed", err);
      }

      setLoading(false);

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

  const totalReturn = holdings.reduce((sum, h) => sum + h.amount, 0);

  const avgReturn =
    holdings.length > 0
      ? (
          holdings.reduce((sum, h) => sum + h.return * h.percentage, 0) / 100
        ).toFixed(2)
      : "0";

  return (

    <MainLayout>

      <div className="space-y-8 pb-8">

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Portfolio
          </h1>
          <p className="text-muted-foreground">
            Manage and track your investment holdings
          </p>
        </div>

        {/* Top Stats */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          <DashboardCard
            title="Total Portfolio Value"
            value={`$${user?.netWorth?.toLocaleString() || 0}`}
            change={Number(avgReturn)}
            changeLabel="% this month"
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <DashboardCard
            title="Total Holdings"
            value={holdings.length.toString()}
            change={holdings.length}
            changeLabel={`Across ${holdings.length} assets`}
            icon={<Zap className="h-5 w-5" />}
          />

          <DashboardCard
            title="Best Performer"
            value={holdings[0]?.name || "N/A"}
            change={holdings[0]?.return || 0}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          <DashboardCard
            title="Cash Available"
            value={`$${assetAllocation.find(a => a.name === "Cash")?.value || 0}`}
            change={0}
            icon={<Zap className="h-5 w-5" />}
          />

        </div>

        {/* Charts */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">

            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Portfolio Performance
            </h2>

            <ResponsiveContainer width="100%" height={300}>

              <LineChart data={portfolioData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="month" />

                <YAxis />

                <Tooltip formatter={(value:any) => `$${value.toLocaleString()}`} />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-primary)"
                  dot={{ r: 5 }}
                  strokeWidth={2}
                  name="Portfolio Value"
                />

              </LineChart>

            </ResponsiveContainer>

          </div>

          <div className="bg-card border border-border rounded-xl p-6">

            <h2 className="text-lg font-semibold mb-4 text-foreground">
              Asset Allocation
            </h2>

            <ResponsiveContainer width="100%" height={300}>

              <PieChart>

                <Pie
                  data={assetAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  dataKey="value"
                >

                  {assetAllocation.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}

                </Pie>

                <Tooltip formatter={(value:any) => `${value}%`} />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>

        {/* Holdings Table */}

        <div className="bg-card border border-border rounded-xl overflow-hidden">

          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Holdings
            </h2>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-secondary/10 border-b border-border">

                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Return
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    % of Portfolio
                  </th>
                </tr>

              </thead>

              <tbody>

                {holdings.map((holding) => (

                  <tr key={holding.id} className="border-b border-border">

                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">
                        {holding.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {holding.ticker}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      ${holding.amount?.toLocaleString()}
                    </td>

                    <td className={`px-6 py-4 text-right font-medium ${
                      holding.return >= 0 ? 'text-green-500' : 'text-destructive'
                    }`}>
                      {holding.return >= 0 ? '+' : ''}{holding.return}%
                    </td>

                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {holding.percentage}%
                    </td>

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