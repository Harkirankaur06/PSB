'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Zap, TrendingUp } from 'lucide-react';

export default function SimulatorPage() {
  const [initialAmount, setInitialAmount] = useState('400000');
  const [monthlyContribution, setMonthlyContribution] = useState('2000');
  const [annualReturn, setAnnualReturn] = useState('7');
  const [years, setYears] = useState('25');

  const calculateProjection = () => {
    const data = [];
    let balance = parseFloat(initialAmount);
    const monthlyReturn = parseFloat(annualReturn) / 100 / 12;
    const contribution = parseFloat(monthlyContribution);

    for (let month = 0; month <= parseFloat(years) * 12; month++) {
      data.push({
        month: (month / 12).toFixed(1),
        balance: Math.round(balance),
      });
      balance = balance * (1 + monthlyReturn) + contribution;
    }

    return data;
  };

  const projectionData = calculateProjection();
  const finalBalance = projectionData[projectionData.length - 1]?.balance || 0;
  const totalContributed =
    parseFloat(initialAmount) +
    parseFloat(monthlyContribution) * parseFloat(years) * 12;
  const totalGain = finalBalance - totalContributed;

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Future Simulator
          </h1>
          <p className="text-muted-foreground">
            Project your wealth growth with different scenarios
          </p>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Simulation Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Starting Balance
              </label>
              <Input
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                prefix="$"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Monthly Contribution
              </label>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                prefix="$"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Annual Return (%)
              </label>
              <Input
                type="number"
                value={annualReturn}
                onChange={(e) => setAnnualReturn(e.target.value)}
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time Period (Years)
              </label>
              <Input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Projected Balance
            </p>
            <p className="text-3xl font-bold text-foreground">
              ${(finalBalance / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              After {years} years
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Total Gain
            </p>
            <p className="text-3xl font-bold text-success">
              ${(totalGain / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {((totalGain / totalContributed) * 100).toFixed(1)}% return
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">
              Total Contributed
            </p>
            <p className="text-3xl font-bold text-foreground">
              ${(totalContributed / 1000000).toFixed(2)}M
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Principal + contributions
            </p>
          </Card>
        </div>

        {/* Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Projection Over Time
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                label={{ value: 'Years', position: 'insideBottomRight', offset: -5 }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                label={{
                  value: 'Balance ($)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="var(--chart-1)"
                dot={false}
                strokeWidth={2}
                name="Projected Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Scenarios */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Quick Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => {
                setMonthlyContribution('3000');
              }}
            >
              <span className="font-semibold text-foreground">Aggressive</span>
              <span className="text-xs text-muted-foreground">
                +$3,000/month contribution
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => {
                setMonthlyContribution('2000');
                setAnnualReturn('5');
              }}
            >
              <span className="font-semibold text-foreground">Conservative</span>
              <span className="text-xs text-muted-foreground">
                5% return, +$2,000/month
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => {
                setMonthlyContribution('2500');
                setAnnualReturn('8');
              }}
            >
              <span className="font-semibold text-foreground">Balanced</span>
              <span className="text-xs text-muted-foreground">
                8% return, +$2,500/month
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
