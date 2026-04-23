'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Target } from 'lucide-react';
import { AppGoal, AppOverview, useAppOverview, useFormattedCurrency } from '@/lib/app-data';
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
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<AppGoal | null>(null);
  const [form, setForm] = useState({
    id: '',
    name: '',
    target: '',
    current: '',
    deadline: '',
  });

  const refreshOverview = async () => {
    const overview = await apiRequest<AppOverview>('/api/app/overview');
    setData(overview);
    window.dispatchEvent(new Event('legend-security-refresh'));
  };

  const openCreateDialog = () => {
    setSelectedGoal(null);
    setStatus('');
    setForm({
      id: '',
      name: '',
      target: '',
      current: '',
      deadline: '',
    });
    setFormOpen(true);
  };

  const openEditDialog = (goal: AppGoal) => {
    setSelectedGoal(goal);
    setStatus('');
    setForm({
      id: goal.id,
      name: goal.name,
      target: String(goal.target),
      current: String(goal.current),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 10) : '',
    });
    setFormOpen(true);
  };

  const openDetailsDialog = (goal: AppGoal) => {
    setSelectedGoal(goal);
    setDetailsOpen(true);
  };

  const saveGoal = async () => {
    const target = Number(form.target);
    const current = Number(form.current || 0);

    if (!form.name.trim() || !target || target <= 0 || !form.deadline) {
      setStatus('Enter a goal name, positive target amount, and deadline.');
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      if (form.id) {
        await apiRequest(`/api/goals/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.name.trim(),
            targetAmount: target,
            currentAmount: current,
            deadline: form.deadline,
          }),
        });
      } else {
        await apiRequest('/api/goals', {
          method: 'POST',
          body: JSON.stringify({
            title: form.name.trim(),
            targetAmount: target,
            currentAmount: current,
            deadline: form.deadline,
          }),
        });
      }

      await refreshOverview();
      setFormOpen(false);
      setStatus('');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to save goal.');
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await apiRequest(`/api/goals/${id}`, { method: 'DELETE' });
      await refreshOverview();
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

          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={openCreateDialog}>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(goal)}
                  >
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

                <Button
                  variant="outline"
                  className="w-full"
                  size="sm"
                  onClick={() => openDetailsDialog(goal)}
                >
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

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            <DialogDescription>
              Set a target, current saved amount, and deadline to keep your planning on track.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Goal name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Example: House Down Payment"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Target amount</label>
                <Input
                  type="number"
                  min="1"
                  value={form.target}
                  onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                  placeholder="500000"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Already saved</label>
                <Input
                  type="number"
                  min="0"
                  value={form.current}
                  onChange={(event) => setForm((current) => ({ ...current, current: event.target.value }))}
                  placeholder="50000"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Deadline</label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              />
            </div>

            {status && <p className="text-sm text-primary">{status}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGoal} disabled={saving}>
              {saving ? 'Saving...' : form.id ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedGoal?.name || 'Goal details'}</DialogTitle>
            <DialogDescription>
              Review progress, target, and the current AI guidance for this goal.
            </DialogDescription>
          </DialogHeader>

          {selectedGoal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Current saved</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatCurrency(selectedGoal.current)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-4">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {formatCurrency(selectedGoal.target)}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">
                    {selectedGoal.progress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={selectedGoal.progress} className="h-2" />
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="text-sm text-foreground">{buildGoalDescription(selectedGoal)}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Deadline:{' '}
                  {selectedGoal.deadline
                    ? new Date(selectedGoal.deadline).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedGoal && (
              <Button
                onClick={() => {
                  setDetailsOpen(false);
                  openEditDialog(selectedGoal);
                }}
              >
                Edit Goal
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
