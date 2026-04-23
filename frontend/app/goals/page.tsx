'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import { apiRequest } from '@/lib/api-client';

function buildGoalDescription(goal: {
  predictedCompletion?: string;
  progress: number;
  deadline?: string;
}) {
  if (goal.predictedCompletion) {
    return `AI estimate: on track to complete by ${new Date(
      goal.predictedCompletion
    ).toLocaleDateString()}.`;
  }

  if (goal.progress < 35) {
    return 'AI suggests increasing monthly contributions to regain momentum.';
  }

  if (goal.deadline) {
    return `Tracked against deadline ${new Date(goal.deadline).toLocaleDateString()}.`;
  }

  return 'AI is waiting for more savings history to sharpen the forecast.';
}

export default function GoalsPage() {
  const { data, loading, error, setData } = useAppOverview();
  const formatCurrency = useFormattedCurrency();

  const deleteGoal = async (id: string) => {
    try {
      await apiRequest(`/api/goals/${id}`, { method: 'DELETE' });
      setData((current) =>
        current
          ? {
              ...current,
              goals: current.goals.filter((goal) => goal.id !== id),
              dashboard: {
                ...current.dashboard,
                goals: current.dashboard.goals.filter((goal) => goal.id !== id),
              },
            }
          : current
      );
    } catch (err) {
      console.error('Delete goal failed', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading goals...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load goals.'}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Goals & Planning</h1>
            <p className="text-muted-foreground">
              Goal progress from your database with AI completion guidance
            </p>
          </div>

          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.goals.map((goal) => (
            <Card key={goal.id} className="p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {goal.deadline
                        ? new Date(goal.deadline).toLocaleDateString()
                        : 'No deadline'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">{goal.progress.toFixed(1)}%</span>
                </div>

                <Progress value={goal.progress} className="h-2" />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="font-semibold text-foreground">{formatCurrency(goal.current)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="font-semibold text-foreground">{formatCurrency(goal.target)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">{buildGoalDescription(goal)}</p>
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Goal Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Total Target</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(data.goals.reduce((sum, goal) => sum + goal.target, 0))}
              </p>
            </div>
            <div className="text-center border-l border-r border-border">
              <p className="text-muted-foreground text-sm mb-2">Total Saved</p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(data.goals.reduce((sum, goal) => sum + goal.current, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Overall Progress</p>
              <p className="text-3xl font-bold text-foreground">
                {(
                  (data.goals.reduce((sum, goal) => sum + goal.current, 0) /
                    Math.max(data.goals.reduce((sum, goal) => sum + goal.target, 0), 1)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
