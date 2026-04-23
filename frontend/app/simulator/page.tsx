'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';

export default function SimulatorPage() {
  const { data } = useAppOverview();
  const formatCurrency = useFormattedCurrency();
  const [initialAmount, setInitialAmount] = useState('400000');
  const [monthlyContribution, setMonthlyContribution] = useState('2000');
  const [annualReturn, setAnnualReturn] = useState('7');
  const [years, setYears] = useState('25');

  useEffect(() => {
    if (!data) {
      return;
    }

    setInitialAmount(String(Math.round(data.metrics.netWorth || 0)));
    setMonthlyContribution(String(Math.max(Math.round(data.metrics.monthlyBalance || 0), 1000)));
    setAnnualReturn(
      String(
        Math.max(
          Math.round(data.ai.portfolioAssistant?.bestPerformerReturn || data.dashboard.portfolio.changePercent || 7),
          1
        )
      )
    );
    setYears(String(Math.max(data.goals.length * 3, 10)));
  }, [data]);

  const projectionData = useMemo(() => {
    const entries = [];
    let balance = Number(initialAmount) || 0;
    const monthlyReturn = (Number(annualReturn) || 0) / 100 / 12;
    const contribution = Number(monthlyContribution) || 0;
    const totalMonths = (Number(years) || 0) * 12;

    for (let month = 0; month <= totalMonths; month += 1) {
      entries.push({
        month: (month / 12).toFixed(1),
        balance: Math.round(balance),
      });
      balance = balance * (1 + monthlyReturn) + contribution;
    }

    return entries;
  }, [annualReturn, initialAmount, monthlyContribution, years]);

  const finalBalance = projectionData[projectionData.length - 1]?.balance || 0;
  const totalContributed = Number(initialAmount) + Number(monthlyContribution) * Number(years) * 12;
  const totalGain = finalBalance - totalContributed;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Future Simulator</h1>
          <p className="text-muted-foreground">
            AI-seeded wealth projections using your current portfolio and monthly surplus
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Simulation Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Starting Balance
              </label>
              <Input type="number" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Monthly Contribution
              </label>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
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
              <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Projected Balance</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(finalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">After {years} years</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Gain</p>
            <p className="text-3xl font-bold text-success">{formatCurrency(totalGain)}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {totalContributed > 0 ? ((totalGain / totalContributed) * 100).toFixed(1) : '0.0'}%
              return
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Contributed</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(totalContributed)}</p>
            <p className="text-xs text-muted-foreground mt-2">Principal + contributions</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Projection Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
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

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => setMonthlyContribution(String((Number(monthlyContribution) || 0) + 3000))}
            >
              <span className="font-semibold text-foreground">Aggressive</span>
              <span className="text-xs text-muted-foreground">Boost monthly contribution</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => {
                setMonthlyContribution(String(Math.max(Number(monthlyContribution) || 0, 2000)));
                setAnnualReturn('5');
              }}
            >
              <span className="font-semibold text-foreground">Conservative</span>
              <span className="text-xs text-muted-foreground">Lower return, steadier compounding</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4"
              onClick={() => {
                if (data?.goals[0]) {
                  setYears('10');
                  setMonthlyContribution(
                    String(Math.max(Math.round((data.goals[0].target - data.goals[0].current) / 120), 1000))
                  );
                }
              }}
            >
              <span className="font-semibold text-foreground">Goal Focused</span>
              <span className="text-xs text-muted-foreground">Tune for your top savings goal</span>
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
