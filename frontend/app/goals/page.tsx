'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { goalsData } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';

export default function GoalsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Goals & Planning
            </h1>
            <p className="text-muted-foreground">
              Track and manage your financial goals
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsData.map((goal) => (
            <Card key={goal.id} className="p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{goal.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(goal.deadline).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold text-foreground">
                    {goal.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={goal.progress} className="h-2" />

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="font-semibold text-foreground">
                      ${goal.current.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="font-semibold text-foreground">
                      ${goal.target.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {goal.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Goal Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Goal Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Total Target</p>
              <p className="text-3xl font-bold text-foreground">
                ${goalsData.reduce((sum, g) => sum + g.target, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center border-l border-r border-border">
              <p className="text-muted-foreground text-sm mb-2">Total Saved</p>
              <p className="text-3xl font-bold text-primary">
                ${goalsData.reduce((sum, g) => sum + g.current, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Overall Progress</p>
              <p className="text-3xl font-bold text-foreground">
                {(
                  (goalsData.reduce((sum, g) => sum + g.current, 0) /
                    goalsData.reduce((sum, g) => sum + g.target, 0)) *
                  100
                ).toFixed(1)}
                %
              </p>
            </div>
          </div>
        </Card>

        {/* Recommendations */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Recommendations
          </h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span className="text-muted-foreground">
                Increase monthly contributions to reach retirement goal by deadline
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span className="text-muted-foreground">
                Home purchase goal is on track with current savings rate
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1">•</span>
              <span className="text-muted-foreground">
                Consider automated contributions to vacation fund
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
}
