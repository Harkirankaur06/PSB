'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { useState, useEffect } from 'react';

// Define the Goal interface
interface Goal {
  _id: string;
  name: string;
  description: string;
  deadline: string;
  current: number;
  target: number;
}

export default function GoalsPage() {

  const [goalsData, setGoalsData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {

    try {

      const token = localStorage.getItem("accessToken");

      const res = await fetch(
        "http://https://psb-backend.onrender.com/api/goals",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const text = await res.text();
      console.log(text);
      const data = JSON.parse(text);
      setGoalsData(data);

    } catch (err) {

      console.error("Failed to fetch goals", err);

    }

    setLoading(false);

  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const deleteGoal = async (id: string) => {

    try {

      const token = localStorage.getItem("accessToken");

      await fetch(
        `http://https://psb-backend.onrender.com/api/goals/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchGoals();

    } catch (err) {

      console.error("Delete goal failed", err);

    }

  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading goals...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="space-y-8">

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

        {/* Goals */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {goalsData.map((goal) => {

            const progress = (goal.current / goal.target) * 100;

            return (

              <Card
                key={goal._id}
                className="p-6 hover:border-primary/50 transition-colors"
              >

                <div className="flex items-start justify-between mb-4">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>

                    <div>

                      <h3 className="font-semibold text-foreground">
                        {goal.name}
                      </h3>

                      <p className="text-xs text-muted-foreground">
                        {new Date(goal.deadline).toLocaleDateString()}
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
                      onClick={() => deleteGoal(goal._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>

                </div>

                <div className="space-y-3">

                  <div className="flex items-center justify-between text-sm">

                    <span className="text-muted-foreground">Progress</span>

                    <span className="font-semibold text-foreground">
                      {progress.toFixed(1)}%
                    </span>

                  </div>

                  <Progress value={progress} className="h-2" />

                  <div className="grid grid-cols-2 gap-4 pt-2">

                    <div>

                      <p className="text-xs text-muted-foreground mb-1">
                        Current
                      </p>

                      <p className="font-semibold text-foreground">
                        ${goal.current.toLocaleString()}
                      </p>

                    </div>

                    <div>

                      <p className="text-xs text-muted-foreground mb-1">
                        Target
                      </p>

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

            );

          })}

        </div>

        {/* Summary */}

        <Card className="p-6">

          <h2 className="text-lg font-semibold text-foreground mb-4">
            Goal Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="text-center">

              <p className="text-muted-foreground text-sm mb-2">
                Total Target
              </p>

              <p className="text-3xl font-bold text-foreground">
                ${goalsData.reduce((sum, g) => sum + g.target, 0).toLocaleString()}
              </p>

            </div>

            <div className="text-center border-l border-r border-border">

              <p className="text-muted-foreground text-sm mb-2">
                Total Saved
              </p>

              <p className="text-3xl font-bold text-primary">
                ${goalsData.reduce((sum, g) => sum + g.current, 0).toLocaleString()}
              </p>

            </div>

            <div className="text-center">

              <p className="text-muted-foreground text-sm mb-2">
                Overall Progress
              </p>

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

      </div>

    </MainLayout>
  );
}

